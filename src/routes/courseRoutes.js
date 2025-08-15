const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Route hiển thị tất cả khóa học cho người dùng công khai
router.get('/browse-courses', courseController.getAllCoursesPage);

// Route hiển thị chi tiết khóa học công khai
router.get('/course-detail/:id', courseController.getCourseDetailPage);

module.exports = router;
