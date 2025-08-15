const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const Course = require('../models/Course');

// Base routes
router.get('/payment', requireAuth, paymentController.showPaymentPage);
router.post('/payment/process', requireAuth, paymentController.processPayment);

// Payment callback route
router.get('/payment/callback/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { status, apptransid } = req.query;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (status === '1') { // Payment successful
            // Update invoice status
            invoice.status = 'paid';
            invoice.paidAt = new Date();
            invoice.transactionId = apptransid;
            await invoice.save();

            // Add student to course
            await Course.findByIdAndUpdate(invoice.course, {
                $addToSet: { enrolledStudents: invoice.student }
            });

            // Redirect to invoice page
            return res.redirect(`/student/invoices/${invoice._id}`);
        }

        // Payment failed
        invoice.status = 'failed';
        await invoice.save();
        res.redirect(`/courses/${invoice.course}?payment=failed`);

    } catch (error) {
        console.error('Payment callback error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xử lý thanh toán',
            error: error.message
        });
    }
});

module.exports = router;