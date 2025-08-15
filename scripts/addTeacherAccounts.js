const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

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

// Dữ liệu tài khoản giảng viên mẫu
const teacherAccounts = [
  {
    email: 'teacher1@example.com',
    password: '123456',
    fullName: 'Nguyễn Văn Giáo',
    role: 'teacher',
    gender: 'male',
    phone: '0123456789',
    address: 'Hà Nội, Việt Nam',
    koreanLevel: 'TOPIK 6',
    learningGoal: 'Giảng dạy tiếng Hàn',
    interests: ['Văn hóa Hàn Quốc', 'Giáo dục', 'Ngôn ngữ học'],
    dateOfBirth: new Date('1985-05-15'),
    level: 'advanced',
    subscription: {
      type: 'premium',
      expiryDate: new Date('2025-12-31')
    },
    notifications: {
      email: true,
      push: true
    },
    socialMedia: {
      facebook: 'https://facebook.com/teacher1',
      instagram: ''
    },
    emailVerified: true
  },
  {
    email: 'teacher2@example.com',
    password: '123456',
    fullName: 'Trần Thị Minh',
    role: 'teacher',
    gender: 'female',
    phone: '0987654321',
    address: 'TP.HCM, Việt Nam',
    koreanLevel: 'TOPIK 5',
    learningGoal: 'Phát triển kỹ năng giảng dạy',
    interests: ['K-pop', 'Drama Hàn', 'Giáo dục'],
    dateOfBirth: new Date('1990-08-20'),
    level: 'advanced',
    subscription: {
      type: 'premium',
      expiryDate: new Date('2025-12-31')
    },
    notifications: {
      email: true,
      push: false
    },
    socialMedia: {
      facebook: '',
      instagram: 'https://instagram.com/teacher2'
    },
    emailVerified: true
  },
  {
    email: 'teacher3@example.com',
    password: '123456',
    fullName: 'Lê Hoàng Nam',
    role: 'teacher',
    gender: 'male',
    phone: '0369852147',
    address: 'Đà Nẵng, Việt Nam',
    koreanLevel: 'TOPIK 6',
    learningGoal: 'Nghiên cứu ngôn ngữ học Hàn Quốc',
    interests: ['Lịch sử Hàn Quốc', 'Ngôn ngữ học', 'Công nghệ giáo dục'],
    dateOfBirth: new Date('1988-12-10'),
    level: 'advanced',
    subscription: {
      type: 'basic',
      expiryDate: new Date('2025-06-30')
    },
    notifications: {
      email: true,
      push: true
    },
    socialMedia: {
      facebook: 'https://facebook.com/teacher3',
      instagram: 'https://instagram.com/teacher3'
    },
    emailVerified: true
  },
  {
    email: 'teacher4@example.com',
    password: '123456',
    fullName: 'Phạm Thị Hương',
    role: 'teacher',
    gender: 'female',
    phone: '0258147369',
    address: 'Cần Thơ, Việt Nam',
    koreanLevel: 'TOPIK 5',
    learningGoal: 'Giảng dạy tiếng Hàn cho người mới bắt đầu',
    interests: ['Ẩm thực Hàn', 'Phim Hàn', 'Giáo dục trẻ em'],
    dateOfBirth: new Date('1992-03-25'),
    level: 'intermediate',
    subscription: {
      type: 'premium',
      expiryDate: new Date('2025-12-31')
    },
    notifications: {
      email: false,
      push: true
    },
    socialMedia: {
      facebook: '',
      instagram: ''
    },
    emailVerified: true
  },
  {
    email: 'teacher5@example.com',
    password: '123456',
    fullName: 'Vũ Đức Hải',
    role: 'teacher',
    gender: 'male',
    phone: '0147258369',
    address: 'Hải Phòng, Việt Nam',
    koreanLevel: 'TOPIK 6',
    learningGoal: 'Phát triển phương pháp giảng dạy hiện đại',
    interests: ['Công nghệ', 'E-learning', 'Văn hóa đại ch중'],
    dateOfBirth: new Date('1987-11-08'),
    level: 'advanced',
    subscription: {
      type: 'premium',
      expiryDate: new Date('2026-01-31')
    },
    notifications: {
      email: true,
      push: true
    },
    socialMedia: {
      facebook: 'https://facebook.com/teacher5',
      instagram: ''
    },
    emailVerified: true
  }
];

// Hàm mã hóa mật khẩu
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Hàm kiểm tra tài khoản đã tồn tại
const checkExistingUser = async (email) => {
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    return existingUser;
  } catch (error) {
    console.error('Error checking existing user:', error);
    return null;
  }
};

// Hàm thêm tài khoản giảng viên
const addTeacherAccounts = async () => {
  try {
    console.log('Starting to add teacher accounts...');
    let addedCount = 0;
    let skippedCount = 0;

    for (const teacherData of teacherAccounts) {
      // Kiểm tra tài khoản đã tồn tại chưa
      const existingUser = await checkExistingUser(teacherData.email);
      
      if (existingUser) {
        console.log(`⚠️  Email ${teacherData.email} đã tồn tại, bỏ qua...`);
        skippedCount++;
        continue;
      }

      // Mã hóa mật khẩu
      const hashedPassword = await hashPassword(teacherData.password);

      // Tạo object user mới
      const newTeacher = new User({
        ...teacherData,
        password: hashedPassword,
        email: teacherData.email.toLowerCase(),
        joinedDate: new Date(),
        lastLogin: new Date(),
        lastActive: new Date(),
        progress: {
          completedLessons: [],
          completedCourses: [],
          totalPoints: 0
        },
        submissions: [],
        enrolledCourses: [],
        isActive: true,
        averageScore: 0
      });

      // Lưu vào database
      await newTeacher.save();
      console.log(`✅ Đã thêm thành công giảng viên: ${teacherData.fullName} (${teacherData.email})`);
      addedCount++;
    }

    console.log('\n📊 KẾT QUẢ:');
    console.log(`✅ Đã thêm thành công: ${addedCount} tài khoản giảng viên`);
    console.log(`⚠️  Đã bỏ qua (email trùng): ${skippedCount} tài khoản`);
    console.log(`📝 Tổng số tài khoản xử lý: ${teacherAccounts.length}`);

  } catch (error) {
    console.error('❌ Lỗi khi thêm tài khoản giảng viên:', error);
  }
};

// Hàm chính
const main = async () => {
  try {
    // Kết nối database
    await connectDB();
    
    // Thêm tài khoản giảng viên
    await addTeacherAccounts();
    
    console.log('\n🎉 Hoàn thành quá trình thêm tài khoản giảng viên!');
    
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
  addTeacherAccounts,
  teacherAccounts
};
