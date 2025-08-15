const mongoose = require('mongoose');
const Course = require('../models/Course');
const Class = require('../models/class');
const Submission = require('../models/submission'); // Thêm dòng này nếu chưa có
const Assignment = require('../models/Assignment');
const Material = require('../models/material'); // Add this line
const ClassTest = require('../models/ClassTest');
const XLSX = require('xlsx'); // Cần cài đặt: npm install xlsx

// Export each controller function individually
exports.getTeacherDashboard = async (req, res) => {
    try {
        // Get teacher's classes with populated course data
        const teacherClasses = await Class.find({ 
            teacher: req.user._id,
            status: 'active'
        }).populate('course').populate('students', 'fullName email profileImage gender');

        // Get class IDs
        const classIds = teacherClasses.map(c => c._id);

        // Get assignments for these classes
        const assignments = await Assignment.find({
            class: { $in: classIds }
        });

        // Get submissions data
        const submissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) }
        }).populate('student', 'fullName').populate('assignment', 'title');

        // Calculate detailed stats
        const ungradedSubmissions = submissions.filter(s => !s.grade || !s.grade.score);
        const gradedSubmissions = submissions.filter(s => s.grade && s.grade.score);
        const lateSubmissions = submissions.filter(s => s.isLate);

        // Get recent submissions (last 10)
        const recentSubmissions = await Submission.find({
            assignment: {
                $in: assignments.map(a => a._id)
            }
        })
        .populate('student', 'fullName profileImage')
        .populate({
            path: 'assignment',
            populate: {
                path: 'class',
                populate: 'course'
            }
        })
        .sort({ submittedAt: -1 })
        .limit(10);

        // Calculate total students across all classes
        const totalStudents = teacherClasses.reduce((acc, curr) => acc + (curr.students ? curr.students.length : 0), 0);

        // Calculate average grade
        const allGrades = gradedSubmissions.map(s => s.grade.score);
        const averageGrade = allGrades.length > 0 ? 
            Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10 : 0;

        // Calculate performance by class
        const classPerformance = await Promise.all(teacherClasses.map(async (cls) => {
            const classAssignments = assignments.filter(a => a.class.toString() === cls._id.toString());
            const classSubmissions = submissions.filter(s => 
                classAssignments.some(a => a._id.toString() === s.assignment.toString())
            );
            
            const classGraded = classSubmissions.filter(s => s.grade && s.grade.score);
            const classAverage = classGraded.length > 0 ? 
                Math.round((classGraded.reduce((sum, s) => sum + s.grade.score, 0) / classGraded.length) * 10) / 10 : 0;

            return {
                class: cls,
                studentCount: cls.students ? cls.students.length : 0,
                assignmentCount: classAssignments.length,
                submissionCount: classSubmissions.length,
                gradedCount: classGraded.length,
                averageGrade: classAverage,
                completionRate: classSubmissions.length > 0 ? 
                    Math.round((classGraded.length / classSubmissions.length) * 100) : 0
            };
        }));

        // Performance trends (last 7 days)
        const weeklySubmissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) },
            submittedAt: { 
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            }
        });

        // Dashboard stats object
        const dashboardStats = {
            classes: {
                total: teacherClasses.length,
                active: teacherClasses.filter(c => c.status === 'active').length
            },
            students: {
                total: totalStudents,
                activeClasses: teacherClasses.filter(c => c.students && c.students.length > 0).length
            },
            assignments: {
                total: assignments.length,
                active: assignments.filter(a => a.status === 'active').length,
                expired: assignments.filter(a => a.status === 'expired').length
            },
            submissions: {
                total: submissions.length,
                pending: ungradedSubmissions.length,
                graded: gradedSubmissions.length,
                late: lateSubmissions.length,
                weeklyCount: weeklySubmissions.length
            },
            performance: {
                averageGrade: averageGrade,
                completionRate: submissions.length > 0 ? 
                    Math.round((gradedSubmissions.length / submissions.length) * 100) : 0,
                onTimeRate: submissions.length > 0 ? 
                    Math.round(((submissions.length - lateSubmissions.length) / submissions.length) * 100) : 0
            }
        };

        res.render('dashboards/teacher', {
            user: req.user,
            currentUrl: '/dashboard/teacher',
            teacherClasses,
            recentSubmissions,
            dashboardStats,
            classPerformance,
            pageTitle: 'Teacher Dashboard'
        });

    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang dashboard',
            error: error.message,
            user: req.user
        });
    }
};

exports.getNewCoursePage = async (req, res) => {
    try {
        const courseId = req.query.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).render('error', {
                message: 'Khóa học không tồn tại'
            });
        }

        // Kiểm tra quyền truy cập của giảng viên
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền tạo lớp học cho khóa học này'
            });
        }

        res.render('teacher/new_class', { 
            user: req.user,
            course: course
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tạo lớp học'
        });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { courseId, className, description, startDate, endDate, maxStudents } = req.body;

        const startDateValue = new Date(startDate);
        const endDateValue = new Date(endDate);

        if (!courseId || !className || !description || isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime()) || !maxStudents) {
            return res.status(400).render('error', {
                message: 'Vui lòng điền đầy đủ thông tin và đảm bảo ngày hợp lệ'
            });
        }

        const newClass = new Class({
            name: className,
            course: courseId || null,
            teacher: req.user._id,
            description: description,
            startDate: startDateValue,
            endDate: endDateValue,
            schedule: {
                days: ['Monday', 'Wednesday'], // Example schedule
                time: '10:00 AM - 12:00 PM' // Example time
            },
            maxStudents: parseInt(maxStudents),
            classImage: req.file ? req.file.filename : '', // Save the filename of the uploaded image
        });

        await newClass.save();

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tạo lớp học'
        });
    }
};

exports.editClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const { name, description, course, scheduleDays, scheduleTime, startDate, endDate, maxStudents } = req.body;

        const courseObject = await Course.findById(course);
        if (!courseObject) {
            return res.status(404).render('error', {
                message: 'Khóa học không tồn tại'
            });
        }

        // Prepare update data
        const updateData = {
            name: name,
            description: description,
            course: course || null,
            schedule: {
                days: scheduleDays ? scheduleDays.split(', ') : ['Monday', 'Wednesday'],
                time: scheduleTime || '10:00 AM - 12:00 PM'
            }
        };

        // Add optional fields if provided
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (maxStudents) updateData.maxStudents = parseInt(maxStudents);

        // Handle image upload if new file is provided
        if (req.file) {
            updateData.classImage = req.file.filename;
        }

        const updatedClass = await Class.findByIdAndUpdate(classId, updateData, { new: true });

        if (!updatedClass) {
            return res.status(404).render('error', {
                message: 'Lớp học không tồn tại'
            });
        }

        res.redirect('/teacher/classes');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi cập nhật lớp học'
        });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const classId = req.params.id;

        const deletedClass = await Class.findByIdAndDelete(classId);

        if (!deletedClass) {
            return res.status(404).render('error', {
                message: 'Lớp học không tồn tại'
            });
        }

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xóa lớp học'
        });
    }
};

exports.getClassesByTeacherId = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const classes = await Class.find({ teacher: teacherId }).populate('course').populate('students');
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Error fetching classes' });
    }
};

// Add this with your other exports
exports.getAllMaterials = async (req, res) => {
    try {
        // Add debug logging
        console.log('User ID:', req.user._id);
        
        const materials = await Material.find({ teacher: req.user._id })
            .sort('-uploadedAt')
            .lean();

        console.log('Materials found:', materials); // Debug log

        const stats = {
            speaking: materials.filter(m => m.category === 'speaking').length,
            listening: materials.filter(m => m.category === 'listening').length,
            writing: materials.filter(m => m.category === 'writing').length,
            vocabulary: materials.filter(m => m.category === 'vocabulary').length
        };

        console.log('Stats:', stats); // Debug log

        res.render('teacher/materials', {
            title: 'Tài liệu dạy học',
            user: req.user,
            materials: materials || [],
            stats: stats,
            path: '/teacher/materials'
        });
    } catch (error) {
        console.error('Error in getAllMaterials:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tài liệu',
            user: req.user,
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

exports.uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng chọn file để tải lên'
            });
        }

        const material = await Material.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            level: req.body.level,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: `uploads/materials/${req.file.filename}`,
            teacher: req.user._id,
            isPublic: true
        });

        res.status(201).json({
            status: 'success',
            data: material
        });
    } catch (error) {
        console.error('Error in uploadMaterial:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getEditAssignmentForm = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const assignment = await Assignment.findById(assignmentId)
            .populate('class');

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài tập',
                user: req.user
            });
        }

        // Get all classes for the dropdown
        const classes = await Class.find({ teacher: req.user._id });

        res.render('teacher/edit_assignment', {
            user: req.user,
            assignment: assignment,
            classes: classes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang chỉnh sửa bài tập',
            user: req.user
        });
    }
};

// Update the learning game route handler
exports.getLearningGame = async (req, res) => {
    try {
        // Get statistics
        const stats = {
            totalExercises: await Exercise.countDocuments({ teacher: req.user._id }),
            weeklyExercises: await Exercise.countDocuments({
                teacher: req.user._id,
                createdAt: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            }),
            totalStudents: await User.countDocuments({ 
                role: 'student',
                'progress.completedLessons': { $exists: true, $not: { $size: 0 } }
            }),
            averageScore: await calculateAverageScore(req.user._id)
        };

        res.render('teacher/learning_game', {
            user: req.user,
            currentUrl: '/teacher/learning_game', // Add this line
            stats: stats
        });
    } catch (error) {
        console.error('Error loading learning games:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang bài tự học',
            error: error.message,
            user: req.user
        });
    }
};

// Thống kê học lực
exports.getAcademicStats = async (req, res) => {
    try {
        const teacherId = req.user._id;
        
        // Lấy tất cả lớp của giáo viên
        const classes = await Class.find({ teacher: teacherId })
            .populate('course', 'title')
            .populate('students', 'fullName email profileImage')
            .sort('-createdAt');

        res.render('teacher/academic-stats', {
            title: 'Thống kê học lực',
            user: req.user,
            classes,
            selectedClassId: null,
            currentUrl: '/teacher/academic-stats'
        });
    } catch (error) {
        console.error('Error loading academic stats:', error);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải thống kê học lực',
            user: req.user
        });
    }
};

exports.getClassAcademicStats = async (req, res) => {
    try {
        const { classId } = req.params;
        const teacherId = req.user._id;

        // Kiểm tra quyền truy cập
        const classData = await Class.findOne({ 
            _id: classId, 
            teacher: teacherId 
        })
        .populate('course', 'title')
        .populate('students', 'fullName email profileImage gender');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Lấy điểm kiểm tra
        const classTests = await ClassTest.find({ class: classId })
            .populate('scores.student', 'fullName email')
            .sort('testDate');

        // Lấy điểm bài tập
        const assignments = await Assignment.find({ class: classId })
            .sort('createdAt');

        const submissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) },
            status: 'graded'
        }).populate('student', 'fullName email')
        .populate('assignment', 'title maxScore');

        // Tính toán thống kê cho từng học viên
        const studentStats = [];

        for (let student of classData.students) {
            const studentId = student._id.toString();

            // Tính điểm trung bình kiểm tra
            let testScores = [];
            classTests.forEach(test => {
                const studentScore = test.scores.find(s => 
                    s.student._id.toString() === studentId
                );
                if (studentScore) {
                    // Chuyển đổi điểm về thang điểm 10
                    const normalizedScore = (studentScore.score / test.maxScore) * 10;
                    testScores.push(normalizedScore);
                }
            });

            const avgTestScore = testScores.length > 0 
                ? testScores.reduce((sum, score) => sum + score, 0) / testScores.length 
                : 0;

            // Tính điểm trung bình bài tập
            const studentSubmissions = submissions.filter(s => 
                s.student._id.toString() === studentId
            );

            let assignmentScores = [];
            studentSubmissions.forEach(submission => {
                if (submission.grade && submission.grade.score !== undefined) {
                    // Chuyển đổi điểm về thang điểm 10
                    const normalizedScore = (submission.grade.score / submission.assignment.maxScore) * 10;
                    assignmentScores.push(normalizedScore);
                }
            });

            const avgAssignmentScore = assignmentScores.length > 0
                ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length
                : 0;

            // Tính điểm tổng kết (50% kiểm tra + 50% bài tập)
            const finalScore = (avgTestScore * 0.5) + (avgAssignmentScore * 0.5);

            // Xếp loại học lực
            let classification = '';
            let classificationClass = '';
            if (finalScore >= 8.5) {
                classification = 'Xuất sắc';
                classificationClass = 'excellent';
            } else if (finalScore >= 7.0) {
                classification = 'Giỏi';
                classificationClass = 'good';
            } else if (finalScore >= 5.5) {
                classification = 'Khá';
                classificationClass = 'average';
            } else if (finalScore >= 4.0) {
                classification = 'Trung bình';
                classificationClass = 'belowAverage';
            } else {
                classification = 'Yếu';
                classificationClass = 'poor';
            }

            studentStats.push({
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    email: student.email,
                    profileImage: student.profileImage,
                    gender: student.gender || 'other'
                },
                testCount: testScores.length,
                assignmentCount: assignmentScores.length,
                avgTestScore: Math.round(avgTestScore * 100) / 100,
                avgAssignmentScore: Math.round(avgAssignmentScore * 100) / 100,
                finalScore: Math.round(finalScore * 100) / 100,
                classification,
                classificationClass,
                testScores,
                assignmentScores
            });
        }

        // Sắp xếp theo điểm tổng kết giảm dần
        studentStats.sort((a, b) => b.finalScore - a.finalScore);

        // Thống kê tổng quan lớp
        const classOverallStats = {
            totalStudents: studentStats.length,
            avgClassScore: studentStats.length > 0 
                ? Math.round((studentStats.reduce((sum, s) => sum + s.finalScore, 0) / studentStats.length) * 100) / 100
                : 0,
            testCount: classTests.length,
            assignmentCount: assignments.length,
            classifications: {
                excellent: studentStats.filter(s => s.classificationClass === 'excellent').length,
                good: studentStats.filter(s => s.classificationClass === 'good').length,
                average: studentStats.filter(s => s.classificationClass === 'average').length,
                belowAverage: studentStats.filter(s => s.classificationClass === 'below-average').length,
                poor: studentStats.filter(s => s.classificationClass === 'poor').length
            }
        };

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                success: true,
                classData,
                studentStats,
                classOverallStats,
                classTests: classTests.map(test => ({
                    _id: test._id,
                    testName: test.testName,
                    testDate: test.testDate,
                    maxScore: test.maxScore,
                    scoreCount: test.scores.length
                })),
                assignments: assignments.map(assignment => ({
                    _id: assignment._id,
                    title: assignment.title,
                    maxScore: assignment.maxScore,
                    submissionCount: assignment.submissionStats?.totalSubmissions || 0
                }))
            });
        }

        // Lấy tất cả lớp cho dropdown
        const allClasses = await Class.find({ teacher: teacherId })
            .populate('course', 'title')
            .sort('-createdAt');

        res.render('teacher/academic-stats', {
            title: 'Thống kê học lực',
            user: req.user,
            classes: allClasses,
            selectedClassId: classId,
            classData,
            studentStats,
            classOverallStats,
            currentUrl: '/teacher/academic-stats'
        });

    } catch (error) {
        console.error('Error loading class academic stats:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tải thống kê học lực'
            });
        }
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải thống kê học lực',
            user: req.user
        });
    }
};

exports.exportAcademicStats = async (req, res) => {
    try {
        const { classId } = req.params;
        const teacherId = req.user._id;

        // Kiểm tra quyền truy cập
        const classData = await Class.findOne({ 
            _id: classId, 
            teacher: teacherId 
        })
        .populate('course', 'title')
        .populate('students', 'fullName email gender');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Lấy dữ liệu điểm kiểm tra
        const classTests = await ClassTest.find({ class: classId })
            .populate('scores.student', 'fullName email')
            .sort('testDate');

        // Lấy dữ liệu bài tập
        const assignments = await Assignment.find({ class: classId })
            .sort('createdAt');

        // Lấy dữ liệu bài nộp đã chấm điểm
        const submissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) },
            status: 'graded'
        }).populate('student', 'fullName email')
        .populate('assignment', 'title maxScore');

        // Tạo workbook Excel
        const workbook = XLSX.utils.book_new();
        
        // Tạo worksheet thống kê tổng quan
        const summaryData = [
            ['BÁO CÁO THỐNG KÊ HỌC LỰC'],
            [`Lớp: ${classData.name}`],
            [`Khóa học: ${classData.course.title}`],
            [`Giáo viên: ${req.user.fullName}`],
            [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
            [],
            ['STT', 'Họ và tên', 'Email', 'Giới tính', 'Số BT', 'Điểm BT TB', 'Số KT', 'Điểm KT TB', 'Điểm TB', 'Xếp loại']
        ];

        // Tính điểm cho từng học viên
        let stt = 1;
        const studentStatsForExport = [];

        for (let student of classData.students) {
            const studentId = student._id.toString();

            // Tính điểm kiểm tra
            let testScores = [];
            classTests.forEach(test => {
                const studentScore = test.scores.find(s => 
                    s.student._id.toString() === studentId
                );
                if (studentScore) {
                    const normalizedScore = (studentScore.score / test.maxScore) * 10;
                    testScores.push(normalizedScore);
                }
            });

            const avgTestScore = testScores.length > 0 
                ? testScores.reduce((sum, score) => sum + score, 0) / testScores.length 
                : 0;

            // Tính điểm bài tập
            const studentSubmissions = submissions.filter(s => 
                s.student._id.toString() === studentId
            );

            let assignmentScores = [];
            studentSubmissions.forEach(submission => {
                if (submission.grade && submission.grade.score !== undefined) {
                    const normalizedScore = (submission.grade.score / submission.assignment.maxScore) * 10;
                    assignmentScores.push(normalizedScore);
                }
            });

            const avgAssignmentScore = assignmentScores.length > 0
                ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length
                : 0;

            // Tính điểm tổng kết (50% kiểm tra + 50% bài tập)
            const finalScore = (avgTestScore * 0.5) + (avgAssignmentScore * 0.5);

            // Xếp loại học lực
            let classification = '';
            if (finalScore >= 8.5) classification = 'Xuất sắc';
            else if (finalScore >= 7.0) classification = 'Giỏi';
            else if (finalScore >= 5.5) classification = 'Khá';
            else if (finalScore >= 4.0) classification = 'Trung bình';
            else classification = 'Yếu';

            // Format gender cho Excel
            const genderText = student.gender === 'male' ? 'Nam' : 
                             student.gender === 'female' ? 'Nữ' : 
                             student.gender === 'other' ? 'Khác' : 'Không xác định';

            // Thêm vào data xuất Excel
            summaryData.push([
                stt++,
                student.fullName,
                student.email,
                genderText,
                assignmentScores.length,
                assignmentScores.length > 0 ? parseFloat(avgAssignmentScore.toFixed(1)) : 'N/A',
                testScores.length,
                testScores.length > 0 ? parseFloat(avgTestScore.toFixed(1)) : 'N/A',
                parseFloat(finalScore.toFixed(1)),
                classification
            ]);

            studentStatsForExport.push({
                student,
                avgTestScore,
                avgAssignmentScore,
                finalScore,
                classification
            });
        }

        // Thêm thống kê tổng quan vào cuối
        summaryData.push([]);
        summaryData.push(['THỐNG KÊ TỔNG QUAN']);
        summaryData.push(['Tổng số học viên:', classData.students.length]);
        summaryData.push(['Số bài kiểm tra:', classTests.length]);
        summaryData.push(['Số bài tập:', assignments.length]);
        
        if (studentStatsForExport.length > 0) {
            const avgClassScore = studentStatsForExport.reduce((sum, s) => sum + s.finalScore, 0) / studentStatsForExport.length;
            summaryData.push(['Điểm trung bình lớp:', parseFloat(avgClassScore.toFixed(1))]);
            
            // Thống kê xếp loại
            const classifications = {
                excellent: studentStatsForExport.filter(s => s.finalScore >= 8.5).length,
                good: studentStatsForExport.filter(s => s.finalScore >= 7.0 && s.finalScore < 8.5).length,
                average: studentStatsForExport.filter(s => s.finalScore >= 5.5 && s.finalScore < 7.0).length,
                belowAverage: studentStatsForExport.filter(s => s.finalScore >= 4.0 && s.finalScore < 5.5).length,
                poor: studentStatsForExport.filter(s => s.finalScore < 4.0).length
            };
            
            summaryData.push(['Xuất sắc:', classifications.excellent]);
            summaryData.push(['Giỏi:', classifications.good]);
            summaryData.push(['Khá:', classifications.average]);
            summaryData.push(['Trung bình:', classifications.belowAverage]);
            summaryData.push(['Yếu:', classifications.poor]);
            
            // Thống kê giới tính
            summaryData.push([]);
            summaryData.push(['THỐNG KÊ GIỚI TÍNH']);
            const genderStats = {
                male: classData.students.filter(s => s.gender === 'male').length,
                female: classData.students.filter(s => s.gender === 'female').length,
                other: classData.students.filter(s => s.gender === 'other').length,
                unknown: classData.students.filter(s => !s.gender || s.gender === '').length
            };
            
            summaryData.push(['Nam:', genderStats.male]);
            summaryData.push(['Nữ:', genderStats.female]);
            if (genderStats.other > 0) {
                summaryData.push(['Khác:', genderStats.other]);
            }
            if (genderStats.unknown > 0) {
                summaryData.push(['Không xác định:', genderStats.unknown]);
            }
        }

        // Tạo worksheet từ data
        const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Định dạng worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Định dạng cột điểm số để hiển thị số thập phân
        for (let rowNum = 2; rowNum <= range.e.r; rowNum++) {
            // Cột F: Điểm BT TB (index 5)
            const cellF = XLSX.utils.encode_cell({ r: rowNum, c: 5 });
            if (worksheet[cellF] && typeof worksheet[cellF].v === 'number') {
                worksheet[cellF].z = '0.0';
            }
            
            // Cột H: Điểm KT TB (index 7)
            const cellH = XLSX.utils.encode_cell({ r: rowNum, c: 7 });
            if (worksheet[cellH] && typeof worksheet[cellH].v === 'number') {
                worksheet[cellH].z = '0.0';
            }
            
            // Cột I: Điểm TB (index 8)
            const cellI = XLSX.utils.encode_cell({ r: rowNum, c: 8 });
            if (worksheet[cellI] && typeof worksheet[cellI].v === 'number') {
                worksheet[cellI].z = '0.0';
            }
        }
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 5 },   // STT
            { wch: 25 },  // Họ và tên
            { wch: 30 },  // Email
            { wch: 10 },  // Giới tính
            { wch: 8 },   // Số BT
            { wch: 12 },  // Điểm BT TB
            { wch: 8 },   // Số KT
            { wch: 12 },  // Điểm KT TB
            { wch: 10 },  // Điểm TB
            { wch: 15 }   // Xếp loại
        ];

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê học lực');

        // Tạo sheet chi tiết bài kiểm tra nếu có
        if (classTests.length > 0) {
            const testDetailsData = [
                ['CHI TIẾT ĐIỂM KIỂM TRA'],
                [],
                ['Học viên', ...classTests.map(test => test.testName || `Kiểm tra ${new Date(test.testDate).toLocaleDateString('vi-VN')}`)],
            ];

            classData.students.forEach(student => {
                const row = [student.fullName];
                classTests.forEach(test => {
                    const studentScore = test.scores.find(s => 
                        s.student._id.toString() === student._id.toString()
                    );
                    row.push(studentScore ? parseFloat(studentScore.score.toFixed(1)) : 'N/A');
                });
                testDetailsData.push(row);
            });

            const testWorksheet = XLSX.utils.aoa_to_sheet(testDetailsData);
            
            // Định dạng cột điểm số cho sheet chi tiết
            const testRange = XLSX.utils.decode_range(testWorksheet['!ref']);
            for (let rowNum = 3; rowNum <= testRange.e.r; rowNum++) {
                for (let colNum = 1; colNum <= testRange.e.c; colNum++) {
                    const cell = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                    if (testWorksheet[cell] && typeof testWorksheet[cell].v === 'number') {
                        testWorksheet[cell].z = '0.0';
                    }
                }
            }
            
            XLSX.utils.book_append_sheet(workbook, testWorksheet, 'Chi tiết kiểm tra');
        }

        // Tạo tên file
        const filename = `ThongKe_HocLuc_${classData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.xlsx`;
        
        // Tạo buffer từ workbook
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers cho download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Length', buffer.length);

        // Gửi file
        res.send(buffer);

    } catch (error) {
        console.error('Error exporting academic stats:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất báo cáo: ' + error.message
        });
    }
};
