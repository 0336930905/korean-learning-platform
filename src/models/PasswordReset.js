const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  verificationCode: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours from now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete documents after 24 hours
  }
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);