const { Schema, model } = require('mongoose');

const studyPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  goals: [{ type: String }],
  schedule: [
    {
      week: { type: Number },
      focus: { type: String },
      activities: [{ type: String }]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('StudyPlan', studyPlanSchema);
