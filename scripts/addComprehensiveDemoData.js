const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Class = require('../src/models/class');
const Invoice = require('../src/models/Invoice');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/korea-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Danh sách ảnh lớp học có sẵn
const classImages = [
  '/botuvung/hoctap/_3.jpg',
  '/botuvung/hoctap/Classroom Wall Pictures _ Freepik.jpg',
  '/botuvung/hoctap/Empty classroom waits for the start of school lessons _ Premium AI-generated image (1).jpg',
  '/botuvung/hoctap/Empty classroom waits for the start of school lessons _ Premium AI-generated image (2).jpg',
  '/botuvung/hoctap/Empty classroom waits for the start of school lessons _ Premium AI-generated image.jpg',
  '/botuvung/hoctap/tải xuống.jpg'
];

// Dữ liệu giảng viên
const teachersData = [
  {
    fullName: 'Park Min-jun',
    email: 'park.minjun@korea-db.com',
    specialization: 'Ngữ pháp cơ bản',
    experience: '5 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Kim So-young',
    email: 'kim.soyoung@korea-db.com',
    specialization: 'Từ vựng và phát âm',
    experience: '7 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Lee Hyun-woo',
    email: 'lee.hyunwoo@korea-db.com',
    specialization: 'Nghe nói giao tiếp',
    experience: '4 năm',
    koreanLevel: 'TOPIK 5'
  },
  {
    fullName: 'Choi Ji-hye',
    email: 'choi.jihye@korea-db.com',
    specialization: 'Viết và sáng tác',
    experience: '6 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Jung Tae-hyung',
    email: 'jung.taehyung@korea-db.com',
    specialization: 'Ngữ pháp nâng cao',
    experience: '8 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Son Na-eun',
    email: 'son.naeun@korea-db.com',
    specialization: 'Văn hóa Hàn Quốc',
    experience: '3 năm',
    koreanLevel: 'TOPIK 5'
  },
  {
    fullName: 'Kang Min-ho',
    email: 'kang.minho@korea-db.com',
    specialization: 'Tiếng Hàn thương mại',
    experience: '9 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Yoon Se-ri',
    email: 'yoon.seri@korea-db.com',
    specialization: 'Phát âm chuẩn',
    experience: '5 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Bae Suzy',
    email: 'bae.suzy@korea-db.com',
    specialization: 'Từ vựng chuyên ngành',
    experience: '4 năm',
    koreanLevel: 'TOPIK 5'
  },
  {
    fullName: 'Oh Sehun',
    email: 'oh.sehun@korea-db.com',
    specialization: 'Ngữ pháp trung cấp',
    experience: '6 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Han Ji-min',
    email: 'han.jimin@korea-db.com',
    specialization: 'Kỹ năng nghe',
    experience: '7 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Jeon Jung-kook',
    email: 'jeon.jungkook@korea-db.com',
    specialization: 'Giao tiếp hàng ngày',
    experience: '3 năm',
    koreanLevel: 'TOPIK 5'
  },
  {
    fullName: 'Shin Min-ah',
    email: 'shin.minah@korea-db.com',
    specialization: 'Viết luận văn',
    experience: '8 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Cha Eun-woo',
    email: 'cha.eunwoo@korea-db.com',
    specialization: 'Tiếng Hàn du lịch',
    experience: '4 năm',
    koreanLevel: 'TOPIK 5'
  },
  {
    fullName: 'Go Ara',
    email: 'go.ara@korea-db.com',
    specialization: 'Luyện thi TOPIK',
    experience: '10 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Im Yoon-ah',
    email: 'im.yoonah@korea-db.com',
    specialization: 'Tiếng Hàn gia đình',
    experience: '5 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Seo Kang-joon',
    email: 'seo.kangjoon@korea-db.com',
    specialization: 'Ngữ pháp TOPIK',
    experience: '6 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Park Shin-hye',
    email: 'park.shinhye@korea-db.com',
    specialization: 'Đọc hiểu nâng cao',
    experience: '7 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Nam Joo-hyuk',
    email: 'nam.joohyuk@korea-db.com',
    specialization: 'Tiếng Hàn công sở',
    experience: '5 năm',
    koreanLevel: 'TOPIK 6'
  },
  {
    fullName: 'Song Hye-kyo',
    email: 'song.hyekyo@korea-db.com',
    specialization: 'Giao tiếp nâng cao',
    experience: '12 năm',
    koreanLevel: 'TOPIK 6'
  }
];

// Dữ liệu khóa học
const coursesData = [
  {
    title: 'Tiếng Hàn Cơ Bản A1',
    description: 'Khóa học dành cho người mới bắt đầu học tiếng Hàn, tập trung vào bảng chữ cái Hangeul và từ vựng cơ bản.',
    level: 'beginner',
    category: 'Ngữ pháp',
    duration: '3 tháng',
    price: 1500000
  },
  {
    title: 'Từ Vựng Hàn Quốc Hàng Ngày',
    description: 'Học từ vựng thông dụng trong cuộc sống hàng ngày của người Hàn Quốc.',
    level: 'beginner',
    category: 'Từ vựng',
    duration: '2 tháng',
    price: 1200000
  },
  {
    title: 'Nghe Nói Tiếng Hàn Cơ Bản',
    description: 'Phát triển kỹ năng nghe và nói tiếng Hàn thông qua các tình huống thực tế.',
    level: 'beginner',
    category: 'Nghe nói',
    duration: '4 tháng',
    price: 1800000
  },
  {
    title: 'Viết Tiếng Hàn Cơ Bản',
    description: 'Học cách viết chữ Hàn và tạo các câu đơn giản.',
    level: 'beginner',
    category: 'Viết',
    duration: '2.5 tháng',
    price: 1300000
  },
  {
    title: 'Tiếng Hàn Trung Cấp A2',
    description: 'Nâng cao kiến thức ngữ pháp và từ vựng tiếng Hàn cho học viên có nền tảng.',
    level: 'intermediate',
    category: 'Ngữ pháp',
    duration: '4 tháng',
    price: 2000000
  },
  {
    title: 'Từ Vựng Tiếng Hàn Chuyên Ngành',
    description: 'Học từ vựng chuyên ngành như kinh doanh, y tế, công nghệ.',
    level: 'intermediate',
    category: 'Từ vựng',
    duration: '3 tháng',
    price: 1700000
  },
  {
    title: 'Giao Tiếp Tiếng Hàn Nâng Cao',
    description: 'Rèn luyện kỹ năng giao tiếp trong các tình huống phức tạp.',
    level: 'intermediate',
    category: 'Nghe nói',
    duration: '5 tháng',
    price: 2200000
  },
  {
    title: 'Viết Luận Văn Tiếng Hàn',
    description: 'Học cách viết các bài luận và văn bản dài bằng tiếng Hàn.',
    level: 'intermediate',
    category: 'Viết',
    duration: '3.5 tháng',
    price: 1900000
  },
  {
    title: 'Tiếng Hàn Nâng Cao B1',
    description: 'Khóa học cho học viên muốn đạt trình độ thành thạo tiếng Hàn.',
    level: 'advanced',
    category: 'Ngữ pháp',
    duration: '6 tháng',
    price: 2800000
  },
  {
    title: 'Từ Vựng Tiếng Hàn Học Thuật',
    description: 'Từ vựng chuyên sâu dành cho học viên muốn học tập tại Hàn Quốc.',
    level: 'advanced',
    category: 'Từ vựng',
    duration: '4 tháng',
    price: 2400000
  },
  {
    title: 'Thuyết Trình Tiếng Hàn Chuyên Nghiệp',
    description: 'Kỹ năng thuyết trình và giao tiếp công sở bằng tiếng Hàn.',
    level: 'advanced',
    category: 'Nghe nói',
    duration: '4.5 tháng',
    price: 2600000
  },
  {
    title: 'Viết Sáng Tạo Tiếng Hàn',
    description: 'Phát triển kỹ năng viết sáng tạo và văn học tiếng Hàn.',
    level: 'advanced',
    category: 'Viết',
    duration: '5 tháng',
    price: 2700000
  },
  {
    title: 'Luyện Thi TOPIK I',
    description: 'Chuẩn bị cho kỳ thi TOPIK cấp độ I (level 1-2).',
    level: 'intermediate',
    category: 'Ngữ pháp',
    duration: '3 tháng',
    price: 2100000
  },
  {
    title: 'Luyện Thi TOPIK II',
    description: 'Chuẩn bị cho kỳ thi TOPIK cấp độ II (level 3-6).',
    level: 'advanced',
    category: 'Ngữ pháp',
    duration: '4 tháng',
    price: 2500000
  },
  {
    title: 'Tiếng Hàn Du Lịch',
    description: 'Từ vựng và cụm từ hữu ích cho việc du lịch tại Hàn Quốc.',
    level: 'beginner',
    category: 'Từ vựng',
    duration: '2 tháng',
    price: 1100000
  },
  {
    title: 'Văn Hóa Hàn Quốc',
    description: 'Tìm hiểu về văn hóa, lịch sử và xã hội Hàn Quốc qua ngôn ngữ.',
    level: 'intermediate',
    category: 'Nghe nói',
    duration: '3 tháng',
    price: 1600000
  },
  {
    title: 'Tiếng Hàn Thương Mại',
    description: 'Ngôn ngữ chuyên nghiệp cho môi trường kinh doanh.',
    level: 'advanced',
    category: 'Nghe nói',
    duration: '5 tháng',
    price: 3000000
  },
  {
    title: 'Phát Âm Tiếng Hàn Chuẩn',
    description: 'Sửa lỗi phát âm và nói tiếng Hàn như người bản xứ.',
    level: 'intermediate',
    category: 'Nghe nói',
    duration: '2.5 tháng',
    price: 1500000
  },
  {
    title: 'Đọc Hiểu Tiếng Hàn Nâng Cao',
    description: 'Phát triển kỹ năng đọc hiểu các văn bản phức tạp.',
    level: 'advanced',
    category: 'Viết',
    duration: '4 tháng',
    price: 2300000
  },
  {
    title: 'Tiếng Hàn Cho Gia Đình',
    description: 'Từ vựng và giao tiếp trong môi trường gia đình Hàn Quốc.',
    level: 'beginner',
    category: 'Từ vựng',
    duration: '2.5 tháng',
    price: 1400000
  }
];

// Hàm tạo dữ liệu demo
async function createDemoData() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu demo...');

    // 1. Tạo 20 giảng viên
    console.log('\n📚 Tạo giảng viên...');
    const teachers = [];
    
    for (let i = 0; i < teachersData.length; i++) {
      const teacherData = teachersData[i];
      
      // Kiểm tra xem email đã tồn tại chưa
      const existingTeacher = await User.findOne({ email: teacherData.email });
      if (existingTeacher) {
        console.log(`⚠️ Giảng viên ${teacherData.email} đã tồn tại, bỏ qua...`);
        teachers.push(existingTeacher);
        continue;
      }

      const hashedPassword = await bcrypt.hash('teacher123', 10);
      
      const teacher = new User({
        email: teacherData.email,
        password: hashedPassword,
        fullName: teacherData.fullName,
        role: 'teacher',
        level: 'advanced',
        koreanLevel: teacherData.koreanLevel,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        phone: '0' + Math.floor(Math.random() * 900000000 + 100000000),
        address: 'Hàn Quốc',
        learningGoal: `Chuyên gia giảng dạy ${teacherData.specialization}`,
        interests: [teacherData.specialization, 'Văn hóa Hàn Quốc', 'Giáo dục'],
        subscription: {
          type: 'premium',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
        },
        progress: {
          totalPoints: Math.floor(Math.random() * 5000) + 5000
        },
        emailVerified: true,
        isActive: true
      });

      await teacher.save();
      teachers.push(teacher);
      console.log(`✅ Đã tạo giảng viên: ${teacher.fullName} (${teacher.email})`);
    }

    // 2. Tạo khóa học
    console.log('\n🎓 Tạo khóa học...');
    const courses = [];
    
    for (let i = 0; i < coursesData.length; i++) {
      const courseData = coursesData[i];
      
      // Kiểm tra khóa học đã tồn tại chưa
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (existingCourse) {
        console.log(`⚠️ Khóa học "${courseData.title}" đã tồn tại, bỏ qua...`);
        courses.push(existingCourse);
        continue;
      }

      // Chọn ngẫu nhiên một giảng viên
      const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      
      const course = new Course({
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        category: courseData.category,
        duration: courseData.duration,
        price: courseData.price,
        instructor: randomTeacher._id,
        status: 'active',
        enrolledCount: Math.floor(Math.random() * 50) + 10
      });

      await course.save();
      courses.push(course);
      console.log(`✅ Đã tạo khóa học: ${course.title} - Giảng viên: ${randomTeacher.fullName}`);
    }

    // 3. Tạo lớp học
    console.log('\n🏫 Tạo lớp học...');
    const classes = [];
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      
      // Tạo 1-2 lớp cho mỗi khóa học
      const numClasses = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < numClasses; j++) {
        const className = `${course.title} - Lớp ${String.fromCharCode(65 + j)}`;
        
        // Kiểm tra lớp học đã tồn tại chưa
        const existingClass = await Class.findOne({ name: className });
        if (existingClass) {
          console.log(`⚠️ Lớp học "${className}" đã tồn tại, bỏ qua...`);
          classes.push(existingClass);
          continue;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Bắt đầu trong 30 ngày tới
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3); // Kéo dài 3 tháng

        const classObj = new Class({
          name: className,
          course: course._id,
          description: `Lớp học cho khóa ${course.title}. ${course.description}`,
          teacher: course.instructor,
          students: [], // Sẽ thêm sinh viên sau
          startDate: startDate,
          endDate: endDate,
          schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: `${Math.floor(Math.random() * 4) + 18}:00-${Math.floor(Math.random() * 4) + 20}:00`
          },
          status: 'active',
          maxStudents: Math.floor(Math.random() * 20) + 15,
          classImage: classImages[Math.floor(Math.random() * classImages.length)]
        });

        await classObj.save();
        classes.push(classObj);
        console.log(`✅ Đã tạo lớp học: ${classObj.name}`);
      }
    }

    // 4. Lấy danh sách sinh viên hiện có
    console.log('\n👥 Lấy danh sách sinh viên...');
    const students = await User.find({ role: 'student' }).limit(50);
    console.log(`📊 Tìm thấy ${students.length} sinh viên hiện có`);

    if (students.length === 0) {
      console.log('⚠️ Không có sinh viên nào trong hệ thống. Vui lòng tạo sinh viên trước.');
      return;
    }

    // 5. Tạo hóa đơn và đăng ký sinh viên vào lớp
    console.log('\n💰 Tạo hóa đơn và đăng ký sinh viên...');
    let invoiceCount = 0;
    let enrollmentCount = 0;

    for (const classObj of classes) {
      const course = await Course.findById(classObj.course);
      const numStudentsToEnroll = Math.floor(Math.random() * 10) + 5; // 5-14 sinh viên mỗi lớp
      
      // Chọn ngẫu nhiên sinh viên
      const selectedStudents = students
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(numStudentsToEnroll, students.length));

      for (const student of selectedStudents) {
        // Kiểm tra xem sinh viên đã mua khóa học này chưa
        const existingInvoice = await Invoice.findOne({
          student: student._id,
          course: course._id,
          status: 'paid'
        });

        if (existingInvoice) {
          console.log(`⚠️ Sinh viên ${student.fullName} đã mua khóa học ${course.title}, bỏ qua...`);
          continue;
        }

        // Tạo hóa đơn
        const paymentMethods = ['zalopay_app', 'zalopay_qr', 'zalopay_cc', 'zalopay_atm'];
        const invoice = new Invoice({
          student: student._id,
          course: course._id,
          amount: course.price,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: 'paid',
          transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          paidAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Đã thanh toán trong 30 ngày qua
        });

        await invoice.save();
        invoiceCount++;

        // Thêm sinh viên vào lớp học
        if (!classObj.students.includes(student._id)) {
          classObj.students.push(student._id);
          enrollmentCount++;
        }

        // Cập nhật enrolledCount của course
        if (!course.enrolledStudents.includes(student._id)) {
          course.enrolledStudents.push(student._id);
          course.enrolledCount = course.enrolledStudents.length;
          await course.save();
        }
      }

      await classObj.save();
      console.log(`✅ Đã đăng ký ${selectedStudents.length} sinh viên vào lớp: ${classObj.name}`);
    }

    console.log('\n🎉 Hoàn thành tạo dữ liệu demo!');
    console.log(`📊 Thống kê:`);
    console.log(`   - Giảng viên: ${teachers.length}`);
    console.log(`   - Khóa học: ${courses.length}`);
    console.log(`   - Lớp học: ${classes.length}`);
    console.log(`   - Hóa đơn: ${invoiceCount}`);
    console.log(`   - Đăng ký: ${enrollmentCount}`);

    console.log('\n✅ Tất cả dữ liệu demo đã được tạo thành công!');

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu demo:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy script
createDemoData();
