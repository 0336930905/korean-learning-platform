// src/middleware/authMiddleware.js

console.log('authMiddleware loaded');

exports.requireAuth = (req, res, next) => {
    // Kiểm tra cả xác thực Passport và session
    if (req.isAuthenticated() || (req.session && req.session.user)) {
        // Đảm bảo user object có sẵn trong cả req.user và session
        req.user = req.user || req.session.user;
        req.session.user = req.session.user || req.user;
        return next();
    }
    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?redirect=${redirectUrl}`);
};

exports.requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này.' });
        }
        next();
    };
};

exports.isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        return next();
    }
    res.status(403).render('error', { message: 'Bạn không có quyền truy cập' });
};
exports.ensureAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).render('error', {
        message: 'Bạn không có quyền truy cập trang này',
        user: req.user
    });
};

exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() || (req.session && req.session.user)) {
        return next();
    }
    res.redirect('/login');
};
