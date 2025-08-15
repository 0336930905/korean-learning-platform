const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tên khóa học là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Mô tả khóa học là bắt buộc'],
        trim: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    category: {
        type: String,
        required: [true, 'Danh mục khóa học là bắt buộc'],
        enum: ['Ngữ pháp', 'Từ vựng', 'Nghe nói', 'Viết']
    },
    duration: {
        type: String,
        required: [true, 'Thời lượng khóa học là bắt buộc']
    },
    price: {
        type: Number,
        required: [true, 'Giá khóa học là bắt buộc'],
        min: [0, 'Giá không thể là số âm']
    },
    imageUrl: {
        type: String,
        default: '/images/default-course.jpg'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Giảng viên là bắt buộc']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    enrolledCount: {
        type: Number,
        default: 0
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add text index for search
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
