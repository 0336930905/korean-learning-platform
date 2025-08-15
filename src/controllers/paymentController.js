// src/controllers/paymentController.js
const zalopayService = require('../services/zalopayService');
const Invoice = require('../models/Invoice');
const Course = require('../models/Course');

// Xử lý yêu cầu thanh toán ban đầu
exports.processPayment = async (req, res) => {
    try {
        const { courseId, paymentMethod, amount } = req.body;

        // 1. Tạo hóa đơn với trạng thái pending (chờ thanh toán)
        const invoice = new Invoice({
            student: req.user._id,
            course: courseId,
            amount: amount,
            paymentMethod: paymentMethod,
            status: 'pending' // Trạng thái ban đầu là đang chờ
        });
        await invoice.save();

        // 2. Tạo URL callback để ZaloPay gọi lại sau khi thanh toán xong
        const callbackUrl = `${req.protocol}://${req.get('host')}/payment/callback/${invoice._id}`;

        // 3. Nếu thanh toán qua ZaloPay, tạo yêu cầu thanh toán
        if (paymentMethod.startsWith('zalopay')) {
            const zalopayResult = await zalopayService.createPayment({
                amount: amount,
                orderId: invoice._id,
                userId: req.user._id,
                redirectUrl: callbackUrl // URL này sẽ nhận kết quả từ ZaloPay
            });

            // 4. Kiểm tra kết quả tạo yêu cầu thanh toán
            if (zalopayResult.return_code === 1) {
                return res.json({
                    success: true,
                    paymentUrl: zalopayResult.order_url, // URL để chuyển hướng đến trang thanh toán ZaloPay
                    invoiceId: invoice._id
                });
            } else {
                throw new Error(zalopayResult.return_message);
            }
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi xử lý thanh toán'
        });
    }
};

exports.showPaymentPage = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId)
            .select('title description price imageUrl'); // Changed from thumbnail to imageUrl
        
        if (!course) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy khóa học',
                user: req.user
            });
        }

        res.render('student/payment', {
            course,
            user: req.user,
            title: `Thanh toán khóa học | ${course.title}`
        });
    } catch (error) {
        console.error('Show payment page error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang thanh toán',
            user: req.user
        });
    }
};

exports.handleCallback = async (req, res) => {
    try {
        const paymentId = req.query.paymentId;
        const payment = await Payment.findById(paymentId);
        
        if (!payment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy thông tin thanh toán',
                user: req.user
            });
        }

        if (req.query.status === 'success') {
            // Update payment status
            payment.status = 'completed';
            payment.paidAt = new Date();
            payment.transactionId = req.query.transId;
            await payment.save();

            // Create invoice
            const invoice = new Invoice({
                student: payment.userId,
                course: payment.courseId,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                status: 'paid'
            });
            await invoice.save();

            // Add student to course.enrolledStudents
            await Course.findByIdAndUpdate(payment.courseId, {
                $addToSet: { enrolledStudents: payment.userId }
            });

            // Redirect to invoice details
            res.redirect(`/student/invoices/${invoice._id}`);
        } else {
            payment.status = 'failed';
            await payment.save();
            res.redirect(`/courses/${payment.courseId}?payment=failed`);
        }
    } catch (error) {
        console.error('Payment callback error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xử lý kết quả thanh toán',
            user: req.user
        });
    }
};

// Xử lý callback từ ZaloPay sau khi thanh toán xong
exports.handlePaymentCallback = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // 1. Kiểm tra trạng thái thanh toán từ ZaloPay
        const { status, apptransid } = req.query;

        if (status === '1') { // Thanh toán thành công
            // 2. Cập nhật trạng thái hóa đơn thành công
            invoice.status = 'paid';
            invoice.paidAt = new Date();
            invoice.transactionId = apptransid; // Lưu mã giao dịch từ ZaloPay
            await invoice.save();

            // 3. Thêm học viên vào danh sách đã đăng ký khóa học
            await Course.findByIdAndUpdate(invoice.course, {
                $addToSet: { enrolledStudents: invoice.student }
            });

            // 4. Chuyển hướng đến trang hóa đơn
            return res.redirect(`/student/invoices/${invoice._id}`);
        }

        // Thanh toán thất bại
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
};