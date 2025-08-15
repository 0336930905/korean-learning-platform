const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Course = require('../models/Course');
const ThematicVocabulary = require('../models/ThematicVocabulary');
const Class = require('../models/class');
const ClassTest = require('../models/ClassTest');
const Assignment = require('../models/Assignment');
const Submission = require('../models/submission');
const Attendance = require('../models/Attendance');

// Initialize variables
let genAI = null;

// Initialize Google AI using dynamic import
async function initializeAI() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not found in environment variables');
    }

    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log('Google AI initialized successfully');
  } catch (error) {
    console.error('Error initializing Google AI:', error);
    throw error;
  }
}

// Call initialization
initializeAI().catch(console.error);

async function getUserContext(userId) {
  try {
    // Get user data with populated courses
    const user = await User.findById(userId)
      .select('fullName email koreanLevel enrolledCourses')
      .populate({
        path: 'enrolledCourses',
        select: 'title level price description category duration instructor',
        populate: {
          path: 'instructor',
          select: 'fullName email'
        }
      });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's classes and test scores
    const userClasses = await Class.find({
      students: userId,
      status: 'active'
    })
    .populate([
      {
        path: 'course',
        select: 'title'
      },
      {
        path: 'teacher',
        select: 'fullName email'
      }
    ]);

    const classIds = userClasses.map(c => c._id);

    // Get test scores
    const testScores = await ClassTest.find({
      class: { $in: classIds }
    })
    .populate({
      path: 'scores',
      match: { student: userId },
      select: 'score gradedAt notes'
    })
    .select('testName testDate class maxScore')
    .sort({ testDate: -1 });

    // Format test scores
    const formattedTestScores = userClasses.map(classItem => {
      const classTests = testScores.filter(test => 
        test.class.toString() === classItem._id.toString()
      );

      const tests = classTests.map(test => ({
        testName: test.testName,
        score: test.scores[0]?.score || null,
        maxScore: test.maxScore,
        date: test.testDate,
        notes: test.scores[0]?.notes || ''
      })).filter(test => test.score !== null);

      return {
        className: classItem.name,
        courseName: classItem.course.title,
        teacher: {
          name: classItem.teacher.fullName,
          email: classItem.teacher.email
        },
        tests: tests,
        testAverage: tests.length > 0 
          ? tests.reduce((sum, test) => sum + test.score, 0) / tests.length 
          : null
      };
    });

    // Lấy thông tin bài tập
    const assignmentInfo = await getAssignmentInfo(classIds, userId);
    
    // Lấy thông tin điểm danh
    const attendanceInfo = await getAttendanceInfo(classIds, userId);

    // Lấy lịch học hôm nay
    const todaySchedule = await getTodaySchedule(classIds, userId);

    return {
      name: user.fullName,
      email: user.email,
      level: user.koreanLevel,
      courses: user.enrolledCourses.map(course => ({
        name: course.title,
        level: course.level,
        price: course.price,
        duration: course.duration,
        instructor: {
          name: course.instructor?.fullName || 'Chưa phân công',
          email: course.instructor?.email || ''
        }
      })),
      testResults: formattedTestScores,
      assignments: assignmentInfo,
      attendance: attendanceInfo,
      todaySchedule: todaySchedule
    };

  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

async function getAllCoursePrices() {
  try {
    const courses = await Course.find({ status: 'active' })
      .select('title price level category duration')
      .sort({ level: 1, price: 1 });

    return courses.map(course => ({
      name: course.title,
      price: course.price,
      level: course.level,
      category: course.category,
      duration: course.duration
    }));
  } catch (error) {
    console.error('Error getting course prices:', error);
    return null;
  }
}

async function getAllCourses() {
  try {
    return await Course.find({ status: 'active' })
      .select('title level price duration category')
      .sort({ level: 1, price: 1 });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return null;
  }
}

// Hàm lấy thông tin bài tập sắp hết hạn và điểm bài tập
async function getAssignmentInfo(classIds, studentId) {
  try {
    if (!classIds || classIds.length === 0) return null;

    // Lấy tất cả bài tập của các lớp học
    const assignments = await Assignment.find({
      class: { $in: classIds },
      status: 'active'
    })
    .populate('class', 'name')
    .sort({ dueDate: 1 });

    // Lấy submissions của học viên
    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) },
      student: studentId
    })
    .populate('assignment', 'title dueDate maxScore');

    // Tạo map để dễ tra cứu
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignment._id.toString()] = sub;
    });

    const currentDate = new Date();
    const upcomingDeadlines = [];
    const completedAssignments = [];
    let totalAssignments = assignments.length;
    let submittedAssignments = 0;
    let gradedAssignments = 0;
    let totalScore = 0;
    let maxTotalScore = 0;

    assignments.forEach(assignment => {
      const submission = submissionMap[assignment._id.toString()];
      const daysLeft = Math.ceil((assignment.dueDate - currentDate) / (1000 * 60 * 60 * 24));

      if (submission) {
        submittedAssignments++;
        if (submission.grade !== undefined && submission.grade !== null) {
          gradedAssignments++;
          totalScore += submission.grade;
          maxTotalScore += assignment.maxScore;
          
          completedAssignments.push({
            title: assignment.title,
            className: assignment.class.name,
            score: submission.grade,
            maxScore: assignment.maxScore,
            percentage: Math.round((submission.grade / assignment.maxScore) * 100),
            feedback: submission.feedback || ''
          });
        }
      } else if (daysLeft > 0) {
        upcomingDeadlines.push({
          title: assignment.title,
          className: assignment.class.name,
          dueDate: assignment.dueDate,
          daysLeft: daysLeft,
          maxScore: assignment.maxScore
        });
      }
    });

    const averageScore = gradedAssignments > 0 ? (totalScore / maxTotalScore * 10).toFixed(1) : null;

    return {
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      averageScore,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      completedAssignments: completedAssignments.slice(-5)
    };

  } catch (error) {
    console.error('Error getting assignment info:', error);
    return null;
  }
}

// Hàm lấy lịch học hôm nay
async function getTodaySchedule(classIds, studentId) {
  try {
    if (!classIds || classIds.length === 0) return null;

    // Lấy ngày hiện tại
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = dayNames[today.getDay()];
    const todayDateString = today.toISOString().split('T')[0];

    // Lấy thông tin các lớp học có lịch hôm nay
    const todayClasses = await Class.find({
      _id: { $in: classIds },
      status: 'active',
      'schedule.days': todayDayName,
      startDate: { $lte: today },
      endDate: { $gte: today }
    })
    .populate([
      {
        path: 'course',
        select: 'title level'
      },
      {
        path: 'teacher',
        select: 'fullName email'
      }
    ]);

    if (todayClasses.length === 0) {
      return {
        hasClasses: false,
        message: 'Hôm nay bạn không có lịch học nào 😊'
      };
    }

    // Kiểm tra điểm danh hôm nay cho từng lớp
    const classSchedules = await Promise.all(
      todayClasses.map(async (classItem) => {
        const attendance = await Attendance.findOne({
          class: classItem._id,
          student: studentId,
          date: {
            $gte: new Date(todayDateString),
            $lt: new Date(new Date(todayDateString).getTime() + 24 * 60 * 60 * 1000)
          }
        });

        return {
          className: classItem.name,
          courseName: classItem.course.title,
          courseLevel: classItem.course.level,
          teacher: {
            name: classItem.teacher.fullName,
            email: classItem.teacher.email
          },
          schedule: {
            time: classItem.schedule.time,
            days: classItem.schedule.days
          },
          isAttended: !!attendance,
          attendanceStatus: attendance ? {
            status: attendance.status,
            markedAt: attendance.markedAt || attendance.date,
            note: attendance.note || ''
          } : null
        };
      })
    );

    return {
      hasClasses: true,
      totalClasses: classSchedules.length,
      attendedClasses: classSchedules.filter(c => c.isAttended).length,
      classes: classSchedules
    };

  } catch (error) {
    console.error('Error getting today schedule:', error);
    return null;
  }
}

// Hàm lấy thông tin điểm danh
async function getAttendanceInfo(classIds, studentId) {
  try {
    if (!classIds || classIds.length === 0) return null;

    // Lấy thông tin điểm danh của học viên
    const attendanceRecords = await Attendance.find({
      class: { $in: classIds },
      student: studentId
    })
    .populate('class', 'name')
    .sort({ date: -1 });

    // Thống kê theo lớp
    const classSummary = {};
    attendanceRecords.forEach(record => {
      const classId = record.class._id.toString();
      if (!classSummary[classId]) {
        classSummary[classId] = {
          className: record.class.name,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          recentRecords: []
        };
      }

      classSummary[classId][record.status]++;
      classSummary[classId].total++;
      
      if (classSummary[classId].recentRecords.length < 5) {
        classSummary[classId].recentRecords.push({
          date: record.date,
          status: record.status
        });
      }
    });

    // Tính tỷ lệ điểm danh cho từng lớp
    Object.values(classSummary).forEach(classData => {
      classData.attendanceRate = classData.total > 0 ? 
        Math.round((classData.present / classData.total) * 100) : 0;
    });

    // Tính tỷ lệ điểm danh tổng
    let totalPresent = 0;
    let totalSessions = 0;
    
    Object.values(classSummary).forEach(classData => {
      totalPresent += classData.present;
      totalSessions += classData.total;
    });

    const overallAttendanceRate = totalSessions > 0 ? 
      Math.round((totalPresent / totalSessions) * 100) : 0;

    return {
      overallAttendanceRate,
      totalSessions,
      totalPresent,
      totalAbsent: attendanceRecords.filter(r => r.status === 'absent').length,
      totalLate: attendanceRecords.filter(r => r.status === 'late').length,
      totalExcused: attendanceRecords.filter(r => r.status === 'excused').length,
      classSummary: Object.values(classSummary)
    };

  } catch (error) {
    console.error('Error getting attendance info:', error);
    return null;
  }
}

async function getGeminiResponse(message, context) {
  try {
    // Get all courses if asking about prices
    let allCourses = null;
    if (message.toLowerCase().includes('giá') || 
        message.toLowerCase().includes('học phí') ||
        message.toLowerCase().includes('bảng giá')) {
      allCourses = await getAllCoursePrices();
    }

    const safeContext = {
      name: context?.name || 'Học viên',
      email: context?.email || '',
      level: context?.level || 'Chưa xác định',
      courses: context?.courses || [],
      testResults: context?.testResults || [],
      assignments: context?.assignments || null,
      attendance: context?.attendance || null,
      todaySchedule: context?.todaySchedule || null
    };

    // Check if user has any data at all
    const hasAnyData = safeContext.courses.length > 0 || 
                      safeContext.testResults.length > 0 || 
                      safeContext.assignments || 
                      safeContext.attendance || 
                      safeContext.todaySchedule;

    // Generate available questions based on user's data
    const availableQuestions = [];
    
    if (safeContext.courses.length > 0) {
      availableQuestions.push("Tôi đang học khóa nào?", "Giảng viên của tôi là ai?", "Học phí khóa học của tôi bao nhiêu?");
    }
    
    if (safeContext.testResults.length > 0) {
      availableQuestions.push("Điểm số của tôi thế nào?", "Điểm trung bình của tôi là bao nhiêu?", "Tôi có bài kiểm tra nào gần đây?");
    }
    
    if (safeContext.assignments) {
      availableQuestions.push("Tôi có bài tập nào sắp hết hạn?", "Điểm bài tập của tôi như thế nào?", "Tôi đã nộp bao nhiêu bài tập?");
    }
    
    if (safeContext.attendance) {
      availableQuestions.push("Tỷ lệ điểm danh của tôi thế nào?", "Tôi vắng mặt bao nhiêu buổi?", "Lịch sử điểm danh của tôi?");
    }
    
    if (safeContext.todaySchedule) {
      availableQuestions.push("Hôm nay tôi có lịch học không?", "Lịch học tuần này của tôi?", "Tôi đã điểm danh hôm nay chưa?");
    }
    
    // Always add general questions
    availableQuestions.push("Bảng giá các khóa học?", "Có những khóa học nào?", "Học tiếng Hàn có khó không?");

    const questionSuggestions = availableQuestions.slice(0, 6).join('", "');

    // Check different types of questions
    const isTeacherQuestion = message.toLowerCase().includes('giảng viên') || 
                             message.toLowerCase().includes('giáo viên') ||
                             message.toLowerCase().includes('thầy') ||
                             message.toLowerCase().includes('cô');

    const isAssignmentQuestion = message.toLowerCase().includes('bài tập') ||
                                message.toLowerCase().includes('assignment') ||
                                message.toLowerCase().includes('deadline') ||
                                message.toLowerCase().includes('hết hạn') ||
                                message.toLowerCase().includes('nộp bài');

    const isAttendanceQuestion = message.toLowerCase().includes('điểm danh') ||
                                message.toLowerCase().includes('attendance') ||
                                message.toLowerCase().includes('vắng mặt') ||
                                message.toLowerCase().includes('có mặt') ||
                                message.toLowerCase().includes('muộn');

    const isScheduleQuestion = message.toLowerCase().includes('lịch học') ||
                              message.toLowerCase().includes('lịch hôm nay') ||
                              message.toLowerCase().includes('học hôm nay') ||
                              message.toLowerCase().includes('schedule') ||
                              message.toLowerCase().includes('thời gian học') ||
                              message.toLowerCase().includes('giờ học');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent(`
        Bạn là trợ giảng tiếng Hàn thông minh. Tên bạn là "Hảo100".

        THÔNG TIN CƠ BẢN CỦA HỌC VIÊN:
        Họ tên: ${safeContext.name}
        Email: ${safeContext.email}
        Trình độ: ${safeContext.level}

        TRẠNG THÁI DỮ LIỆU: ${hasAnyData ? 'Có dữ liệu học tập' : 'Chưa có dữ liệu học tập'}

        ${safeContext.testResults.length > 0 ? `
        THÔNG TIN LỚP HỌC VÀ GIẢNG VIÊN:
        ${safeContext.testResults.map(classInfo => `
        Lớp: ${classInfo.className}
        Giảng viên phụ trách: ${classInfo.teacher.name}
        Email giảng viên: ${classInfo.teacher.email}
        
        Điểm kiểm tra:
        ${(classInfo.tests || []).map(test => 
          `- ${test.testName}: ${test.score}/${test.maxScore} (${new Date(test.date).toLocaleDateString('vi-VN')})`
        ).join('\n')}
        `).join('\n\n')}
        ` : 'KHÔNG CÓ THÔNG TIN LỚP HỌC'}

        ${safeContext.courses.length > 0 ? `
        KHÓA HỌC ĐANG THEO: 
        ${safeContext.courses.map(c => `
        - ${c.name} (${c.level})
          Giảng viên: ${c.instructor.name}
          Email: ${c.instructor.email}
          Học phí: ${c.price.toLocaleString('vi-VN')}đ
        `).join('\n')}
        ` : 'KHÔNG CÓ KHÓA HỌC ĐĂNG KÝ'}

        ${safeContext.assignments ? `
        THÔNG TIN BÀI TẬP:
        📊 Tổng quan:
        - Tổng số bài tập: ${safeContext.assignments.totalAssignments}
        - Đã nộp: ${safeContext.assignments.submittedAssignments}
        - Đã có điểm: ${safeContext.assignments.gradedAssignments}
        - Điểm trung bình: ${safeContext.assignments.averageScore || 'Chưa có'}/10

        ${safeContext.assignments.upcomingDeadlines.length > 0 ? `
        ⚠️ Bài tập sắp hết hạn:
        ${safeContext.assignments.upcomingDeadlines.map(assignment => `
        - ${assignment.title} (${assignment.className})
          Hạn nộp: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
          Còn lại: ${assignment.daysLeft} ngày
          Điểm tối đa: ${assignment.maxScore}
        `).join('\n')}
        ` : '✅ Không có bài tập sắp hết hạn'}

        ${safeContext.assignments.completedAssignments.length > 0 ? `
        📝 Bài tập gần đây đã có điểm:
        ${safeContext.assignments.completedAssignments.map(assignment => `
        - ${assignment.title} (${assignment.className})
          Điểm: ${assignment.score}/${assignment.maxScore} (${assignment.percentage}%)
          ${assignment.feedback ? `Nhận xét: ${assignment.feedback}` : ''}
        `).join('\n')}
        ` : ''}
        ` : 'KHÔNG CÓ THÔNG TIN BÀI TẬP'}

        ${safeContext.attendance ? `
        THÔNG TIN ĐIỂM DANH:
        📈 Tổng quan:
        - Tỷ lệ điểm danh: ${safeContext.attendance.overallAttendanceRate}%
        - Tổng buổi học: ${safeContext.attendance.totalSessions}
        - Có mặt: ${safeContext.attendance.totalPresent}
        - Vắng mặt: ${safeContext.attendance.totalAbsent}
        - Đi muộn: ${safeContext.attendance.totalLate}
        - Vắng có phép: ${safeContext.attendance.totalExcused}

        📚 Chi tiết theo lớp:
        ${safeContext.attendance.classSummary.map(classData => `
        Lớp ${classData.className}:
        - Tỷ lệ có mặt: ${classData.attendanceRate}%
        - Có mặt: ${classData.present}, Vắng: ${classData.absent}, Muộn: ${classData.late}
        
        Điểm danh gần đây:
        ${classData.recentRecords.map(record => 
          `  + ${new Date(record.date).toLocaleDateString('vi-VN')}: ${
            record.status === 'present' ? 'Có mặt' :
            record.status === 'absent' ? 'Vắng mặt' :
            record.status === 'late' ? 'Đi muộn' : 'Vắng có phép'
          }`
        ).join('\n')}
        `).join('\n\n')}
        ` : 'KHÔNG CÓ THÔNG TIN ĐIỂM DANH'}

        ${safeContext.todaySchedule ? `
        📅 LỊCH HỌC HÔM NAY (${new Date().toLocaleDateString('vi-VN')}):
        ${safeContext.todaySchedule.hasClasses ? `
        📊 Tổng quan:
        - Tổng số lớp: ${safeContext.todaySchedule.totalClasses}
        - Đã điểm danh: ${safeContext.todaySchedule.attendedClasses}/${safeContext.todaySchedule.totalClasses}

        📖 Chi tiết các lớp:
        ${safeContext.todaySchedule.classes.map(classInfo => `
        🏫 Lớp: ${classInfo.className}
        📚 Khóa học: ${classInfo.courseName} (${classInfo.courseLevel})
        👨‍🏫 Giảng viên: ${classInfo.teacher.name}
        📧 Email GV: ${classInfo.teacher.email}
        ⏰ Thời gian: ${classInfo.schedule.time}
        📅 Các ngày trong tuần: ${classInfo.schedule.days.join(', ')}
        ${classInfo.isAttended ? `
        ✅ Trạng thái điểm danh: ${
          classInfo.attendanceStatus.status === 'present' ? 'Đã có mặt' :
          classInfo.attendanceStatus.status === 'absent' ? 'Vắng mặt' :
          classInfo.attendanceStatus.status === 'late' ? 'Đi muộn' : 'Vắng có phép'
        }
        🕒 Thời gian điểm danh: ${new Date(classInfo.attendanceStatus.markedAt).toLocaleString('vi-VN')}
        ${classInfo.attendanceStatus.note ? `📝 Ghi chú: ${classInfo.attendanceStatus.note}` : ''}
        ` : '❌ Chưa điểm danh'}
        `).join('\n\n')}
        ` : safeContext.todaySchedule.message || 'Hôm nay bạn không có lịch học nào 😊'}
        ` : 'KHÔNG CÓ THÔNG TIN LỊCH HỌC'}

        BẢNG GIÁ KHÓA HỌC:
        ${allCourses ? allCourses.map(course => `
        - ${course.name} (${course.level})
          + Giá: ${course.price.toLocaleString('vi-VN')}đ
          + Thời lượng: ${course.duration}
          + Loại: ${course.category}
        `).join('\n') : 'Đang cập nhật bảng giá'}

        CÁC CÂU HỎI GỢI Ý: "${questionSuggestions}"

        Câu hỏi: ${message}

        QUY TẮC TRẢ LỜI QUAN TRỌNG:
        1. Nếu KHÔNG CÓ DỮ LIỆU để trả lời câu hỏi:
           - Trả lời: "Xin lỗi, tôi không có thông tin về [vấn đề được hỏi] trong hệ thống."
           - Đưa ra gợi ý: "Bạn có thể hỏi tôi những câu hỏi như: [liệt kê 3-4 câu hỏi có thể trả lời được]"
           - VÍ DỤ: "Xin lỗi, tôi không có thông tin về kết quả thi của bạn trong hệ thống. Bạn có thể hỏi tôi: 'Bảng giá các khóa học?', 'Tôi đang học khóa nào?', 'Lịch học hôm nay?' 화이팅!"

        2. Nếu có dữ liệu về câu hỏi:
           - Trả lời đầy đủ và chi tiết
           - Ưu tiên thông tin quan trọng nhất
           - Nêu rõ số liệu cụ thể

        3. Các loại câu hỏi xử lý đặc biệt:
           - Hỏi về giá khóa học: Luôn có thể trả lời từ bảng giá
           - Hỏi về điểm số: Chỉ trả lời nếu có testResults
           - Hỏi về bài tập: Chỉ trả lời nếu có assignments
           - Hỏi về điểm danh: Chỉ trả lời nếu có attendance
           - Hỏi về lịch học: Chỉ trả lời nếu có todaySchedule
           - Hỏi về giảng viên: Chỉ trả lời nếu có courses hoặc testResults

        4. Luôn kết thúc bằng "화이팅!" (Fighting!)
        5. Giữ câu trả lời ngắn gọn, thân thiện
        6. Không bịa đặt thông tin không có

        Câu hỏi: ${message}
      `);

    return response.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
  }
}

const chatbotController = {
  handleMessage: async (req, res) => {
    try {
      if (!genAI) {
        return res.status(500).json({
          success: false,
          message: 'AI service not initialized'
        });
      }

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      if (!req.user?._id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      try {
        // Get user context
        const userContext = await getUserContext(req.user._id);
        
        // Get AI response
        const aiResponse = await getGeminiResponse(message, userContext);
        
        // Save chat message with both user message and bot response
        const chatMessage = new ChatMessage({
          userId: req.user._id,
          message: message,
          response: aiResponse,
          context: {
            level: userContext?.level || 'Chưa xác định'
          },
          timestamp: new Date()
        });
        await chatMessage.save();

        res.json({
          success: true,
          response: aiResponse
        });

      } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing your message'
        });
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  getHistory: async (req, res) => {
    try {
      const history = await ChatMessage.find({ 
        userId: req.user._id 
      })
      .sort({ timestamp: -1 })
      .limit(10);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error loading chat history' 
      });
    }
  }
};

module.exports = chatbotController;
