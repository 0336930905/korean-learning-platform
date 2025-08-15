const ClassTest = require('../models/ClassTest');
const Class = require('../models/class');

exports.getClassTests = async (req, res) => {
    try {
        // Get all classes taught by this teacher
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course', 'title')
            .lean();

        // Get selected class ID from query or first class
        const selectedClassId = req.query.classId || (classes.length > 0 ? classes[0]._id : null);

        // Get tests for selected class
        let tests = [];
        if (selectedClassId) {
            tests = await ClassTest.find({ class: selectedClassId })
                .populate('scores.student', 'fullName')
                .populate('class', 'name')
                .sort('-testDate')
                .lean();
        }

        // Render template with all required data
        res.render('teacher/classTests', {
            title: 'Điểm Kiểm Tra',
            user: req.user,
            classes,
            tests, // Add tests array
            selectedClassId,
            currentUrl: '/teacher/classTests'
        });

    } catch (error) {
        console.error('Error in getClassTests:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang điểm kiểm tra',
            error: process.env.NODE_ENV === 'development' ? error : {},
            title: 'Lỗi',
            user: req.user
        });
    }
};

exports.createClassTest = async (req, res) => {
    try {
        const { classId, testName, testDate, scores } = req.body;

        const newTest = new ClassTest({
            class: classId,
            testName,
            testDate,
            createdBy: req.user._id,
            scores: scores.map(score => ({
                student: score.studentId,
                score: score.score,
                notes: score.notes,
                gradedBy: req.user._id
            }))
        });

        await newTest.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating class test:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo bài kiểm tra'
        });
    }
};

exports.getTestDetails = async (req, res) => {
    try {
        const test = await ClassTest.findById(req.params.id)
            .populate('scores.student', 'fullName')
            .populate('class')
            .lean();

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài kiểm tra'
            });
        }

        // Get class students
        const classDetails = await Class.findById(test.class._id)
            .populate('students', 'fullName')
            .lean();

        res.json({
            success: true,
            test,
            students: classDetails.students
        });
    } catch (error) {
        console.error('Error getting test details:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải thông tin bài kiểm tra'
        });
    }
};

exports.updateClassTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { testName, testDate, scores } = req.body;

        const test = await ClassTest.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài kiểm tra'
            });
        }

        // Update test details
        test.testName = testName;
        test.testDate = testDate;
        test.scores = scores.map(score => ({
            student: score.studentId,
            score: score.score,
            notes: score.notes,
            gradedBy: req.user._id,
            gradedAt: new Date()
        }));

        await test.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating class test:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật bài kiểm tra'
        });
    }
};

exports.deleteClassTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await ClassTest.findById(id);
        
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài kiểm tra'
            });
        }

        await test.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting class test:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa bài kiểm tra'
        });
    }
};