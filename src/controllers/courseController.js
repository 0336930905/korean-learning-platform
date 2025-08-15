const Course = require('../models/Course');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const Class = require('../models/class');

// Hiển thị trang quản lý khóa học
exports.getCourseManagementPage = async (req, res) => {
    try {
        // Add proper population and error handling
        const courses = await Course.find()
            .populate({
                path: 'instructor',
                select: 'fullName',
                options: { retainNullValues: true }
            })
            .sort({ createdAt: -1 });

        const teachers = await User.find({ role: 'teacher' })
            .select('_id fullName')
            .sort({ fullName: 1 });

        // Add error handling for courses without instructors
        const processedCourses = courses.map(course => ({
            ...course.toObject(),
            instructor: course.instructor || { fullName: 'Chưa phân công' }
        }));

        res.render('admin/courseManagement', {
            user: req.user,
            courses: processedCourses,
            teachers,
            currentPage: 1,
            totalPages: 1
        });
    } catch (error) {
        console.error('Course management page error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang quản lý khóa học',
            user: req.user
        });
    }
};

// Lấy thông tin chi tiết khóa học
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName');
        
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo khóa học mới
exports.createCourse = async (req, res) => {
    try {
        // Validate dữ liệu đầu vào
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và mô tả là bắt buộc'
            });
        }

        const courseData = {
            title: req.body.title,
            description: req.body.description,
            level: req.body.level,
            category: req.body.category,
            instructor: req.body.instructor,
            duration: req.body.duration,
            price: parseFloat(req.body.price) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Xử lý file ảnh nếu có
        if (req.file) {
            courseData.imageUrl = `/uploads/courses/${req.file.filename}`;
        }

        // Tạo khóa học mới
        const course = await Course.create(courseData);
        
        // Populate thông tin instructor
        await course.populate('instructor', 'fullName');

        res.status(201).json({
            success: true,
            message: 'Thêm khóa học thành công',
            course: course
        });
    } catch (error) {
        // Xóa file ảnh nếu có lỗi
        if (req.file) {
            const filePath = path.join(__dirname, '../../public/uploads/courses', req.file.filename);
            await fs.unlink(filePath).catch(console.error);
        }

        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo khóa học: ' + error.message
        });
    }
};

// Cập nhật khóa học
exports.updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            level: req.body.level,
            category: req.body.category,
            instructor: req.body.instructor,
            duration: req.body.duration,
            price: parseFloat(req.body.price) || 0,
            updatedAt: new Date()
        };

        if (req.file) {
            // Xóa ảnh cũ
            const oldCourse = await Course.findById(courseId);
            if (oldCourse?.imageUrl) {
                const oldImagePath = path.join(__dirname, '../../public', oldCourse.imageUrl);
                await fs.unlink(oldImagePath).catch(console.error);
            }
            updateData.imageUrl = `/uploads/courses/${req.file.filename}`;
        }

        const course = await Course.findByIdAndUpdate(
            courseId,
            updateData,
            { new: true }
        ).populate('instructor', 'fullName');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật khóa học thành công',
            course
        });
    } catch (error) {
        if (req.file) {
            const filePath = path.join(__dirname, '../../public/uploads/courses', req.file.filename);
            await fs.unlink(filePath).catch(console.error);
        }

        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khóa học: ' + error.message
        });
    }
};

// Xóa khóa học
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học'
            });
        }

        // Xóa ảnh khóa học nếu có
        if (course.imageUrl) {
            const imagePath = path.join(__dirname, '../../public', course.imageUrl);
            await fs.unlink(imagePath).catch(console.error);
        }

        await Course.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Xóa khóa học thành công'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khóa học: ' + error.message
        });
    }
};

// Lấy danh sách giáo viên
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .select('_id fullName')
            .sort({ fullName: 1 });
            
        res.json(teachers);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách giáo viên'
        });
    }
};

// Lấy danh sách khóa học của giáo viên
exports.getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course.find({ 
            instructor: req.user._id,
            // Thêm điều kiện lọc nếu cần
            // Ví dụ: chỉ lấy các khóa học đang hoạt động
            // status: 'active'
        }).select('title description level category');

        if (!courses) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học nào'
            });
        }

        res.json({
            success: true,
            courses: courses,
            count: courses.length
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khóa học'
        });
    }
};

// Hiển thị form tạo lớp học mới
exports.getNewClassForm = async (req, res) => {
    try {
        // Lấy courseId từ query parameter nếu có
        const selectedCourseId = req.query.courseId;
        
        // Lấy danh sách khóa học của giáo viên
        const courses = await Course.find({ 
            instructor: req.user._id 
        }).select('_id title description');

        res.render('teacher/new-class', {
            user: req.user,
            courses: courses,
            selectedCourseId: selectedCourseId
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tạo lớp học'
        });
    }
};

// Tạo lớp học mới từ khóa học
exports.createClassFromCourse = async (req, res) => {
    try {
        const { courseId, className, startDate, endDate, schedule } = req.body;
        
        // Kiểm tra quyền sở hữu khóa học
        const course = await Course.findOne({
            _id: courseId,
            instructor: req.user._id
        });
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học hoặc bạn không có quyền truy cập'
            });
        }

        // Tạo lớp học mới
        const newClass = await Class.create({
            name: className,
            course: courseId,
            teacher: req.user._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            schedule: schedule,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Tạo lớp học thành công',
            class: newClass
        });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo lớp học: ' + error.message
        });
    }
};

// Hiển thị trang tất cả khóa học cho người dùng
exports.getAllCoursesPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Hiển thị 12 khóa học mỗi trang
        const skip = (page - 1) * limit;

        // Lấy filters từ query
        const filters = { status: 'active' };
        if (req.query.category && req.query.category !== 'all') {
            filters.category = req.query.category;
        }
        if (req.query.level && req.query.level !== 'all') {
            filters.level = req.query.level;
        }

        // Tìm kiếm theo từ khóa
        if (req.query.search) {
            filters.$text = { $search: req.query.search };
        }

        // Xử lý sắp xếp
        let sortOption = { enrolledCount: -1, createdAt: -1 }; // Mặc định: phổ biến nhất
        switch (req.query.sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'price_low':
                sortOption = { price: 1 };
                break;
            case 'price_high':
                sortOption = { price: -1 };
                break;
            case 'popularity':
            default:
                sortOption = { enrolledCount: -1, createdAt: -1 };
                break;
        }

        // Lấy danh sách khóa học với phân trang
        const courses = await Course.find(filters)
            .populate('instructor', 'fullName')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // Đếm tổng số khóa học
        const totalCourses = await Course.countDocuments(filters);
        const totalPages = Math.ceil(totalCourses / limit);

        // Lấy danh sách categories và levels để hiển thị filter
        const categories = await Course.distinct('category');
        const levels = await Course.distinct('level');

        res.render('public/courseList', {
            user: req.user || null,
            courses,
            currentPage: page,
            totalPages,
            totalCourses,
            categories,
            levels,
            filters: req.query
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.render('error', {
            user: req.user || null,
            message: 'Không thể tải danh sách khóa học'
        });
    }
};

// Hiển thị chi tiết khóa học cho người dùng
exports.getCourseDetailPage = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'fullName email')
            .populate('enrolledStudents', 'fullName');

        if (!course) {
            return res.status(404).render('error', {
                user: req.user || null,
                message: 'Không tìm thấy khóa học'
            });
        }

        // Kiểm tra xem user đã đăng ký khóa học chưa
        let isEnrolled = false;
        if (req.user) {
            isEnrolled = course.enrolledStudents.some(student => 
                student._id.toString() === req.user._id.toString()
            );
        }

        // Lấy các khóa học liên quan (cùng category)
        const relatedCourses = await Course.find({
            category: course.category,
            _id: { $ne: course._id },
            status: 'active'
        })
        .populate('instructor', 'fullName')
        .limit(4)
        .sort({ enrolledCount: -1 });

        res.render('public/courseDetail', {
            user: req.user || null,
            course,
            isEnrolled,
            relatedCourses
        });
    } catch (error) {
        console.error('Error fetching course detail:', error);
        res.render('error', {
            user: req.user || null,
            message: 'Không thể tải thông tin chi tiết khóa học'
        });
    }
};