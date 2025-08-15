const { Schema, model } = require('mongoose');

const resourceSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["article", "video", "book", "link"], default: "article" },
  content: { type: String },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  url: { type: String },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('Resource', resourceSchema);
