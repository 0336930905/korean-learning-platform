const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
    korean: { type: String, required: true },
    meaning: { type: String, required: true },
    pronunciation: { type: String, required: true },
    imageUrl: { 
        type: String,
        default: '' // Remove default.jpg reference
    }
});

const thematicVocabularySchema = new mongoose.Schema({
    theme: { type: String, required: true },
    level: { 
        type: String, 
        required: true,
        enum: ['basic', 'intermediate', 'advanced']
    },
    imageUrl: { 
        type: String,
        default: '' // Remove default.jpg reference
    },
    words: [wordSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ThematicVocabulary', thematicVocabularySchema);