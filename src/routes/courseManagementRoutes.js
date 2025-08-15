const express = require('express');
const router = express.Router();
const courseManagementController = require('../controllers/courseManagementController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/courses');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Thêm route mới cho trang chính
router.get('/', courseManagementController.getManagePage);

// Giữ nguyên các route hiện tại
router.get('/manage', courseManagementController.getManagePage);
router.get('/:id', courseManagementController.getCourseDetail);
router.post('/create', upload.single('image'), courseManagementController.createCourse);
router.put('/update/:id', upload.single('image'), courseManagementController.updateCourse);
router.delete('/delete/:id', courseManagementController.deleteCourse);

module.exports = router;