const { Schema, model } = require('mongoose');

const flashcardDeckSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  category: { type: String, enum: ["daily", "food", "business"], default: "daily" },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  cards: [
    {
      front: { type: String, required: true },
      back: { type: String, required: true },
      example: { type: String },
      audioUrl: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('FlashcardDeck', flashcardDeckSchema);
