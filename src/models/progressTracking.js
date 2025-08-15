const { Schema, model } = require('mongoose');

const progressTrackingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  mistakes: [
    {
      exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
      questionIndex: { type: Number },
      userAnswer: { type: String },
      correctAnswer: { type: String }
    }
  ],
  timeTaken: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
});

module.exports = model('ProgressTracking', progressTrackingSchema);
