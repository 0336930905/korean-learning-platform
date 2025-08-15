const mongoose = require('mongoose'); // Thêm dòng này

const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        user: req?.user?._id
    });

    res.status(err.status || 500).render('error', {
        message: 'Có lỗi xảy ra khi tải tin nhắn',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.user
    });
};

module.exports = errorHandler;