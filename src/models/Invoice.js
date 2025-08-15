const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['zalopay_app', 'zalopay_qr', 'zalopay_cc', 'zalopay_atm'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  transactionId: String,
  paidAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
