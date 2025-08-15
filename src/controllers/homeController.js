const Course = require('../models/Course');

exports.getHomePage = async (req, res) => {
    try {
        // Fetch featured courses - limit to 3, sort by enrolledStudents count (highest first)
        const featuredCourses = await Course.find({ status: 'active' })
            .populate('instructor', 'fullName')
            .sort({ enrolledCount: -1 })
            .limit(3);

        res.render('index', {
            user: req.user || null,
            courses: featuredCourses
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.render('index', {
            user: req.user || null,
            courses: [],
            error: 'Không thể tải danh sách khóa học'
        });
    }
};