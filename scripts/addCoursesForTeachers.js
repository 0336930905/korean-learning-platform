const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Course = require('../src/models/Course');

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Dữ liệu khóa học cho từng giảng viên
const coursesData = [
  // Khóa học cho Nguyễn Văn Giáo (teacher1@example.com)
  {
    teacherEmail: 'teacher1@example.com',
    courses: [
      {
        title: 'Ngữ pháp tiếng Hàn cơ bản',
        description: 'Khóa học về các cấu trúc ngữ pháp cơ bản trong tiếng Hàn Quốc, bao gồm các thì, trợ từ và cách sử dụng trong giao tiếp hàng ngày.',
        level: 'beginner',
        category: 'Ngữ pháp',
        duration: '8 tuần',
        price: 500000,
        imageUrl: '/images/grammar-basic.jpg'
      },
      {
        title: 'Từ vựng tiếng Hàn theo chủ đề',
        description: 'Học từ vựng tiếng Hàn theo các chủ đề như gia đình, công việc, ẩm thực, du lịch với phương pháp ghi nhớ hiệu quả.',
        level: 'beginner',
        category: 'Từ vựng',
        duration: '6 tuần',
        price: 400000,
        imageUrl: '/images/vocabulary-topics.jpg'
      },
      {
        title: 'Văn hóa và giao tiếp tiếng Hàn',
        description: 'Tìm hiểu văn hóa Hàn Quốc và cách giao tiếp phù hợp trong các tình huống khác nhau, từ trang trọng đến thân mật.',
        level: 'intermediate',
        category: 'Nghe nói',
        duration: '10 tuần',
        price: 700000,
        imageUrl: '/images/culture-communication.jpg'
      }
    ]
  },
  // Khóa học cho Trần Thị Minh (teacher2@example.com)
  {
    teacherEmail: 'teacher2@example.com',
    courses: [
      {
        title: 'Luyện nghe tiếng Hàn qua K-pop',
        description: 'Học tiếng Hàn thông qua các bài hát K-pop nổi tiếng, cải thiện kỹ năng nghe và phát âm một cách thú vị.',
        level: 'beginner',
        category: 'Nghe nói',
        duration: '4 tuần',
        price: 300000,
        imageUrl: '/images/kpop-listening.jpg'
      },
      {
        title: 'Tiếng Hàn cho người mới bắt đầu',
        description: 'Khóa học toàn diện dành cho người mới bắt đầu học tiếng Hàn, từ bảng chữ cái Hangeul đến giao tiếp cơ bản.',
        level: 'beginner',
        category: 'Từ vựng',
        duration: '12 tuần',
        price: 800000,
        imageUrl: '/images/korean-beginner.jpg'
      },
      {
        title: 'Viết tiếng Hàn và soạn thảo văn bản',
        description: 'Học cách viết các loại văn bản tiếng Hàn từ email, thư trang trọng đến văn bản học thuật và công việc.',
        level: 'intermediate',
        category: 'Viết',
        duration: '8 tuần',
        price: 600000,
        imageUrl: '/images/korean-writing.jpg'
      }
    ]
  },
  // Khóa học cho Lê Hoàng Nam (teacher3@example.com)
  {
    teacherEmail: 'teacher3@example.com',
    courses: [
      {
        title: 'Ngữ pháp tiếng Hàn nâng cao',
        description: 'Khóa học ngữ pháp tiếng Hàn cấp độ nâng cao với các cấu trúc phức tạp và cách sử dụng trong văn viết trang trọng.',
        level: 'advanced',
        category: 'Ngữ pháp',
        duration: '10 tuần',
        price: 900000,
        imageUrl: '/images/grammar-advanced.jpg'
      },
      {
        title: 'Lịch sử và văn hóa Hàn Quốc',
        description: 'Tìm hiểu sâu về lịch sử, truyền thống và văn hóa Hàn Quốc qua ngôn ngữ, giúp hiểu rõ hơn về đất nước này.',
        level: 'intermediate',
        category: 'Từ vựng',
        duration: '6 tuần',
        price: 550000,
        imageUrl: '/images/korean-history.jpg'
      },
      {
        title: 'Công nghệ trong giảng dạy tiếng Hàn',
        description: 'Ứng dụng công nghệ hiện đại trong việc học tiếng Hàn, sử dụng AI và các công cụ số để nâng cao hiệu quả học tập.',
        level: 'advanced',
        category: 'Nghe nói',
        duration: '4 tuần',
        price: 750000,
        imageUrl: '/images/tech-korean.jpg'
      }
    ]
  },
  // Khóa học cho Phạm Thị Hương (teacher4@example.com)
  {
    teacherEmail: 'teacher4@example.com',
    courses: [
      {
        title: 'Tiếng Hàn cho trẻ em',
        description: 'Khóa học tiếng Hàn được thiết kế đặc biệt cho trẻ em với phương pháp vui nhộn, trò chơi và hoạt động tương tác.',
        level: 'beginner',
        category: 'Từ vựng',
        duration: '8 tuần',
        price: 450000,
        imageUrl: '/images/korean-kids.jpg'
      },
      {
        title: 'Ẩm thực Hàn Quốc và từ vựng chuyên ngành',
        description: 'Học tiếng Hàn thông qua văn hóa ẩm thực, từ vựng về món ăn, cách nấu và đặt món tại nhà hàng Hàn Quốc.',
        level: 'beginner',
        category: 'Từ vựng',
        duration: '5 tuần',
        price: 350000,
        imageUrl: '/images/korean-food.jpg'
      },
      {
        title: 'Phim Hàn và kỹ năng nghe hiểu',
        description: 'Cải thiện kỹ năng nghe hiểu tiếng Hàn thông qua các bộ phim và drama Hàn Quốc nổi tiếng.',
        level: 'intermediate',
        category: 'Nghe nói',
        duration: '6 tuần',
        price: 500000,
        imageUrl: '/images/korean-drama.jpg'
      }
    ]
  },
  // Khóa học cho Vũ Đức Hải (teacher5@example.com)
  {
    teacherEmail: 'teacher5@example.com',
    courses: [
      {
        title: 'E-learning và học tiếng Hàn trực tuyến',
        description: 'Phương pháp học tiếng Hàn hiện đại thông qua các nền tảng trực tuyến và công cụ hỗ trợ học tập số.',
        level: 'intermediate',
        category: 'Nghe nói',
        duration: '7 tuần',
        price: 600000,
        imageUrl: '/images/elearning-korean.jpg'
      },
      {
        title: 'Tiếng Hàn trong môi trường công nghệ',
        description: 'Từ vựng và giao tiếp tiếng Hàn trong lĩnh vực công nghệ thông tin, phần mềm và các thuật ngữ kỹ thuật.',
        level: 'advanced',
        category: 'Từ vựng',
        duration: '6 tuần',
        price: 700000,
        imageUrl: '/images/tech-vocabulary.jpg'
      },
      {
        title: 'Phương pháp giảng dạy tiếng Hàn hiện đại',
        description: 'Khóa học dành cho giảng viên về các phương pháp giảng dạy tiếng Hàn hiện đại và hiệu quả.',
        level: 'advanced',
        category: 'Viết',
        duration: '9 tuần',
        price: 850000,
        imageUrl: '/images/teaching-methods.jpg'
      }
    ]
  }
];

// Hàm tìm giảng viên theo email
const findTeacherByEmail = async (email) => {
  try {
    const teacher = await User.findOne({ 
      email: email.toLowerCase(), 
      role: 'teacher' 
    });
    return teacher;
  } catch (error) {
    console.error('Error finding teacher:', error);
    return null;
  }
};

// Hàm kiểm tra khóa học đã tồn tại
const checkExistingCourse = async (title, instructorId) => {
  try {
    const existingCourse = await Course.findOne({ 
      title: title,
      instructor: instructorId
    });
    return existingCourse;
  } catch (error) {
    console.error('Error checking existing course:', error);
    return null;
  }
};

// Hàm thêm khóa học
const addCoursesForTeachers = async () => {
  try {
    console.log('Starting to add courses for teachers...');
    let totalAddedCount = 0;
    let totalSkippedCount = 0;
    let teacherProcessed = 0;

    for (const teacherData of coursesData) {
      console.log(`\n📚 Xử lý khóa học cho giảng viên: ${teacherData.teacherEmail}`);
      
      // Tìm giảng viên
      const teacher = await findTeacherByEmail(teacherData.teacherEmail);
      if (!teacher) {
        console.log(`❌ Không tìm thấy giảng viên: ${teacherData.teacherEmail}`);
        continue;
      }

      console.log(`✅ Tìm thấy giảng viên: ${teacher.fullName}`);
      
      let courseAddedCount = 0;
      let courseSkippedCount = 0;

      // Thêm từng khóa học
      for (const courseData of teacherData.courses) {
        // Kiểm tra khóa học đã tồn tại chưa
        const existingCourse = await checkExistingCourse(courseData.title, teacher._id);
        
        if (existingCourse) {
          console.log(`   ⚠️  Khóa học "${courseData.title}" đã tồn tại, bỏ qua...`);
          courseSkippedCount++;
          continue;
        }

        // Tạo khóa học mới
        const newCourse = new Course({
          ...courseData,
          instructor: teacher._id,
          enrolledCount: 0,
          enrolledStudents: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Lưu vào database
        await newCourse.save();
        console.log(`   ✅ Đã thêm khóa học: "${courseData.title}"`);
        courseAddedCount++;
      }

      console.log(`   📊 Kết quả cho ${teacher.fullName}: ${courseAddedCount} thêm mới, ${courseSkippedCount} bỏ qua`);
      
      totalAddedCount += courseAddedCount;
      totalSkippedCount += courseSkippedCount;
      teacherProcessed++;
    }

    console.log('\n🎯 TỔNG KẾT:');
    console.log(`👨‍🏫 Số giảng viên đã xử lý: ${teacherProcessed}/${coursesData.length}`);
    console.log(`✅ Tổng số khóa học đã thêm: ${totalAddedCount}`);
    console.log(`⚠️  Tổng số khóa học bỏ qua: ${totalSkippedCount}`);
    console.log(`📝 Tổng số khóa học xử lý: ${totalAddedCount + totalSkippedCount}`);

  } catch (error) {
    console.error('❌ Lỗi khi thêm khóa học:', error);
  }
};

// Hàm chính
const main = async () => {
  try {
    // Kết nối database
    await connectDB();
    
    // Thêm khóa học cho giảng viên
    await addCoursesForTeachers();
    
    console.log('\n🎉 Hoàn thành quá trình thêm khóa học cho giảng viên!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thực thi:', error);
  } finally {
    // Đóng kết nối database
    await mongoose.connection.close();
    console.log('🔐 Đã đóng kết nối MongoDB');
    process.exit(0);
  }
};

// Thực thi script
if (require.main === module) {
  main();
}

module.exports = {
  addCoursesForTeachers,
  coursesData
};
