const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    fileName: {
        type: String,
        required: true
    },
    originalName: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['speaking', 'listening', 'writing', 'vocabulary'],
        required: true
    }
});

module.exports = mongoose.model('Document', documentSchema);