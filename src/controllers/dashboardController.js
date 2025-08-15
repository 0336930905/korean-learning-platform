const Assignment = require('../models/Assignment');
const Submission = require('../models/submission');
const Class = require('../models/class');
const Course = require('../models/Course');

exports.getStudentDashboard = async (req, res) => {
    try {
        // Get enrolled classes
        const enrolledClasses = await Class.find({
            students: req.user._id
        }).populate('course');

        // Initialize grade data
        let gradeData = {
            average: 0,
            progress: 0,
            submissionCount: 0,
            highestGrade: 0,
            lowestGrade: 0
        };

        if (enrolledClasses && enrolledClasses.length > 0) {
            // Get all graded submissions for the student
            const submissions = await Submission.find({
                student: req.user._id,
                'grade.score': { $exists: true }
            }).populate('assignment');

            if (submissions.length > 0) {
                // Extract grades from submissions
                const grades = submissions.map(sub => sub.grade.score);
                
                // Calculate grade metrics
                gradeData = {
                    // Calculate average (rounded to 1 decimal)
                    average: Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)),
                    // Calculate progress percentage (0-100)
                    progress: Math.min(Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10), 100),
                    // Count of graded submissions
                    submissionCount: submissions.length,
                    // Highest grade
                    highestGrade: Math.max(...grades),
                    // Lowest grade
                    lowestGrade: Math.min(...grades)
                };

                console.log('Grades calculated:', {
                    grades,
                    gradeData
                });
            }
        }

        // Render dashboard with grade data
        res.render('dashboards/student', {
            user: req.user,
            gradeData,
            enrolledClasses
        });

    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang dashboard',
            error: error.message
        });
    }
};