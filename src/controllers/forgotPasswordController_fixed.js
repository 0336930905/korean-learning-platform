const User = require('../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Generate 6-digit verification code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Update the show forgot password form function
exports.showForgotPasswordForm = (req, res) => {
    res.render('verify-code', { 
        email: '',
        message: req.flash('message'),
        error: req.flash('error')
    });
};

// Update the process forgot password function
exports.processForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Email không tồn tại trong hệ thống'
            });
        }

        // Generate and save verification code
        const verificationCode = generateCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        // Send verification email
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: 'Mã xác nhận khôi phục mật khẩu - Korea_DB',
            html: `
                <h2>Yêu cầu khôi phục mật khẩu</h2>
                <p>Xin chào ${user.fullName},</p>
                <p>Mã xác nhận của bạn là:</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
                <p>Mã này sẽ hết hạn sau 10 phút.</p>
                <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        return res.json({
            success: true,
            message: 'Mã xác nhận đã được gửi đến email của bạn'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
};

// Update the show verify code form function
exports.showVerifyCodeForm = (req, res) => {
    res.render('verify-code', {
        email: req.params.email,
        message: req.flash('message'),
        error: req.flash('error')
    });
};

// Update the verify code function
exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log('Received verification request:', { email, code });

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email và mã xác nhận là bắt buộc'
            });
        }

        const user = await User.findOne({
            email: email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Mã xác nhận không hợp lệ hoặc đã hết hạn'
            });
        }

        return res.json({
            success: true,
            message: 'Xác thực thành công'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
};

// Update the process reset password function
exports.processResetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;
        console.log('Processing password reset:', { email });

        const user = await User.findOne({
            email: email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Phiên làm việc đã hết hạn'
            });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        
        await user.save();
        console.log('Password reset successful for:', email);

        return res.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        });
    }
};

// Add this new function
exports.showResetPasswordForm = async (req, res) => {
    try {
        const { email, code } = req.query;
        
        const user = await User.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
            return res.redirect('/forgot-password');
        }

        res.render('reset-password', {
            email,
            code,
            error: req.flash('error'),
            message: req.flash('message')
        });
    } catch (error) {
        console.error('Show reset password error:', error);
        req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        res.redirect('/forgot-password');
    }
};
