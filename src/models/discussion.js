const { Schema, model } = require('mongoose');

const discussionSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  relatedCourse: { type: Schema.Types.ObjectId, ref: 'Course' },
  relatedLesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  tags: [{ type: String }],
  comments: [
    {
      author: { type: Schema.Types.ObjectId, ref: 'User' },
      content: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('Discussion', discussionSchema);
