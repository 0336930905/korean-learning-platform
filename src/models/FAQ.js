const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        enum: ['Học phí', 'Lịch học', 'Giảng viên', 'Chứng chỉ', 'Hỗ trợ', 'Hình thức học', 'Lớp học', 'Tuyển sinh', 'Khóa học', 'Bài tập', 'Hệ thống', 'Tư vấn']
    },
    keywords: [{
        type: String,
        trim: true
    }],
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search functionality
faqSchema.index({ 
    question: 'text', 
    answer: 'text', 
    keywords: 'text' 
});

// Method to find similar FAQs
faqSchema.statics.findSimilar = function(searchText) {
    return this.find({
        $text: { $search: searchText },
        isActive: true
    }).sort({ priority: -1, viewCount: -1 });
};

// Method to increment view count
faqSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

module.exports = mongoose.model('FAQ', faqSchema);
