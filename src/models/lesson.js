const { Schema, model } = require('mongoose');

const lessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  content: {
    text: { type: String },
    videoUrl: { type: String },
    attachments: [{ type: String }]
  },
  order: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  exercises: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('Lesson', lessonSchema);
