const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  profileImage: { type: String },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  joinedDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  
  // Thêm trường giới tính
  gender: { 
    type: String, 
    enum: ["male", "female", "other", ""], 
    default: "" 
  },
  
  // Thêm thông tin cá nhân khác
  dateOfBirth: { type: Date },
  
  progress: {
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    totalPoints: { type: Number, default: 0 }
  },
  subscription: {
    type: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    expiryDate: { type: Date }
  },
  
  // Thông tin liên hệ
  phone: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  
  // Thông tin học tập
  koreanLevel: { 
    type: String, 
    enum: ["", "TOPIK 1", "TOPIK 2", "TOPIK 3", "TOPIK 4", "TOPIK 5", "TOPIK 6"], 
    default: "" 
  },
  learningGoal: { type: String },
  interests: [{ type: String }],
  
  // Cài đặt thông báo
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  
  // Mạng xã hội
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String }
  },
  
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationCode: String,
  verificationCodeExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Thêm thông tin về lý do khóa tài khoản
  blockReason: {
    type: String,
    default: ''
  },
  
  blockDate: {
    type: Date
  },
  
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Thêm thông tin thống kê
  averageScore: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Virtual để hiển thị tuổi từ ngày sinh
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual để hiển thị giới tính tiếng Việt
userSchema.virtual('genderDisplay').get(function() {
  switch(this.gender) {
    case 'male': return 'Nam';
    case 'female': return 'Nữ';
    case 'other': return 'Khác';
    default: return 'Chưa xác định';
  }
});

// Middleware để cập nhật lastActive khi save
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActive')) {
    this.lastActive = new Date();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
