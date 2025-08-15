const Course = require('../models/Course');
const User = require('../models/User');

exports.getManagePage = async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'fullName');
        const teachers = await User.find({ role: 'teacher' });
        res.render('admin/courseManagement', { 
            courses, 
            teachers,
            user: req.user // Add this line
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseDetail = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName email')
            .populate('enrolledStudents', 'fullName email enrolledAt');
        
        if (!course) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy khóa học',
                user: req.user 
            });
        }
        
        res.render('admin/courseDetail', { 
            course,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { 
            message: 'Lỗi server khi tải chi tiết khóa học',
            user: req.user 
        });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const courseData = {
            ...req.body,
            imageUrl: req.file ? `/uploads/courses/${req.file.filename}` : '/images/default-course.jpg'
        };

        const course = await Course.create(courseData);
        res.json({ success: true, course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const courseData = { ...req.body };
        if (req.file) {
            courseData.imageUrl = `/uploads/courses/${req.file.filename}`;
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id, 
            courseData,
            { new: true }
        );
        
        res.json({ success: true, course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};