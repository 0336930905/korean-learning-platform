const User = require('../models/userModel'); // Assuming you have a User model

module.exports = async (req, res, next) => {
    try {
        // ...existing code...
        if (req.user && req.user.role === 'teacher') {
            // Ensure teacher data is populated
            const teacher = await User.findById(req.user._id);
            if (!teacher) {
                return res.status(403).send('Không tìm thấy thông tin giáo viên');
            }
            req.user = teacher; // Attach full teacher data to req.user
            return next();
        }
        // ...existing code...
    } catch (error) {
        console.error('Error in isTeacher middleware:', error);
        res.status(500).send('Có lỗi xảy ra trong middleware');
    }
};
