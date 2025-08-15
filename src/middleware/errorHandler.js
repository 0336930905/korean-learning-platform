const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.response && err.response.data) {
        // Handle ZaloPay API errors
        return res.status(500).json({
            success: false,
            message: err.response.data.return_message || 'Có lỗi xảy ra khi xử lý thanh toán'
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || 'Có lỗi xảy ra khi xử lý thanh toán'
    });
};

module.exports = errorHandler;