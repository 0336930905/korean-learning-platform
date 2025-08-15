const Class = require('../models/class');
const Course = require('../models/Course');
const User = require('../models/User');

exports.getTeacherClasses = async (req, res) => {
    try {
        // Lấy lớp học của giáo viên
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course', 'title imageUrl level category')
            .populate('students', 'fullName email level')
            .sort({ startDate: -1 });

        // Tính toán thống kê
        const stats = {
            activeClasses: classes.filter(c => c.status === 'active').length,
            totalStudents: classes.reduce((sum, c) => sum + c.students.length, 0),
            pendingAssignments: 12, // Giả sử có 12 bài tập chờ chấm
            unreadMessages: 3 // Giả sử có 3 tin nhắn chưa đọc
        };

        res.render('teacher/classes', {
            user: req.user,
            classes,
            stats
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách lớp học'
        });
    }
};

exports.getClassDetail = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('course')
            .populate('students')
            .populate('teacher');

        if (!classItem) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy lớp học'
            });
        }

        res.render('teacher/classDetail', {
            user: req.user,
            classItem
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải thông tin lớp học'
        });
    }
};

exports.updateClassProgress = async (req, res) => {
    try {
        const { currentLesson } = req.body;
        const classId = req.params.id;

        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { 
                'progress.currentLesson': currentLesson,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json({
            success: true,
            progress: updatedClass.progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật tiến độ'
        });
    }
};

exports.getClassesManagement = async (req, res) => {
    try {
        const [classes, courses, teachers] = await Promise.all([
            Class.find()
                .populate('course', 'title level')
                .populate('teacher', 'fullName email')
                .populate('students', 'fullName email'),
            Course.find().select('title level'),
            User.find({ role: 'teacher' }).select('fullName email')
        ]);

        res.render('admin/classManagement', {
            user: req.user,
            classes,
            courses,
            teachers
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang quản lý lớp học'
        });
    }
};

exports.createClass = async (req, res) => {
    try {
        const {
            courseId,
            teacherId,
            className,
            startDate,
            endDate,
            schedule,
            maxStudents,
            totalLessons
        } = req.body;

        // Kiểm tra quyền của giảng viên đối với khóa học
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học'
            });
        }

        // Kiểm tra xem giảng viên có phải là instructor của khóa học này không
        if (course.instructor.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền tạo lớp học cho khóa học này. Chỉ giảng viên được phân công mới có thể tạo lớp học.'
            });
        }

        const newClass = new Class({
            name: className,
            course: courseId,
            teacher: teacherId,
            description: course.description,
            startDate,
            endDate,
            schedule: {
                days: JSON.parse(schedule),
                time: '19:00-21:00' // Default time
            },
            maxStudents: parseInt(maxStudents),
            status: 'active'
        });

        await newClass.save();
        res.json({ success: true, class: newClass });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo lớp học'
        });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const updateData = req.body;

        if (updateData.schedule) {
            updateData.schedule.days = JSON.parse(updateData.schedule.days);
        }

        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        res.json({
            success: true,
            class: updatedClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật lớp học'
        });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const classId = req.params.id;

        const deletedClass = await Class.findByIdAndDelete(classId);
        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa lớp học thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa lớp học'
        });
    }
}; 