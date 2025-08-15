const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { ensureAuthenticated } = require('../middleware/auth');

// Middleware kiểm tra role teacher
const requireTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        return next();
    }
    return res.status(403).render('error', {
        message: 'Bạn cần quyền giáo viên để truy cập trang này',
        user: req.user
    });
};

// Route chính - Trang điểm danh với dropdown chọn lớp
router.get('/', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.getAttendancePage
);

// API lấy dữ liệu điểm danh theo lớp
router.get('/class/:classId/data', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.getClassAttendanceData
);

router.post('/update', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.updateAttendance
);

router.get('/stats/:classId', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.getAttendanceStats
);

router.post('/auto-mark-absent/:classId', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.autoMarkAbsent
);

router.get('/export/:classId', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.exportAttendanceReport
);

// Thêm route mới cho mark all present
router.post('/mark-all-present/:classId', 
    ensureAuthenticated, 
    requireTeacher, 
    attendanceController.markAllPresent
);

module.exports = router;