const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề tài liệu là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['speaking', 'listening', 'writing', 'vocabulary'],
        required: [true, 'Phân loại tài liệu là bắt buộc']
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'all'],
        required: [true, 'Cấp độ tài liệu là bắt buộc'],
        default: 'all'
    },
    fileName: {
        type: String,
        required: [true, 'Tên file là bắt buộc']
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Add indexes for better query performance
materialSchema.index({ category: 1 });
materialSchema.index({ class: 1 });
materialSchema.index({ teacher: 1 });
materialSchema.index({ title: 'text', description: 'text' });

// Add methods for download count
materialSchema.methods.incrementDownloadCount = function() {
    this.downloadCount += 1;
    return this.save();
};

// Add virtual for file URL
materialSchema.virtual('fileUrl').get(function() {
    return `/uploads/materials/${this.fileName}`;
});

// Add virtual for file size in readable format
materialSchema.virtual('fileSizeFormatted').get(function() {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (this.fileSize === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(this.fileSize) / Math.log(1024)));
    return Math.round(this.fileSize / Math.pow(1024, i), 2) + ' ' + sizes[i];
});

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;