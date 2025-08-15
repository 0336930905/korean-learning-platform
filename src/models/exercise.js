const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['vocabulary', 'writing', 'speaking', 'listening'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    pronunciation: String,
    level: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced'],
        default: 'basic'
    },
    audioUrl: String,
    imageUrl: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
