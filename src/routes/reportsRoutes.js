const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Hiển thị trang báo cáo chính
router.get('/', ensureAuthenticated, ensureAdmin, reportsController.showReports);

// API endpoints for reports
router.get('/api/revenue', ensureAuthenticated, ensureAdmin, reportsController.getRevenueReport);
router.get('/api/course-revenue', ensureAuthenticated, ensureAdmin, reportsController.getCourseRevenueReport);
router.get('/api/academic', ensureAuthenticated, ensureAdmin, reportsController.getAcademicReport);
router.get('/api/accounts', ensureAuthenticated, ensureAdmin, reportsController.getAccountStats);
router.get('/api/classes', ensureAuthenticated, ensureAdmin, reportsController.getClasses);

module.exports = router;
