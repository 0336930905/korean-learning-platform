const Class = require('../models/class');
const ClassTest = require('../models/ClassTest');
const Submission = require('../models/submission');

exports.getStudentGrades = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Get enrolled classes
        const enrolledClasses = await Class.find({
            students: studentId
        })
        .populate('course', 'title')
        .lean();

        // Get all class tests for enrolled classes
        const tests = await ClassTest.find({
            class: { $in: enrolledClasses.map(c => c._id) },
            'scores.student': studentId
        })
        .populate('class')
        .lean();

        // Get all submissions with grades
        const submissions = await Submission.find({
            student: studentId,
            'grade.score': { $exists: true }
        })
        .populate({
            path: 'assignment',
            populate: {
                path: 'class',
                populate: 'course'
            }
        })
        .lean();

        // Calculate grades for each class
        const classesWithGrades = enrolledClasses.map(classItem => {
            // Get tests for this class
            const classTests = tests.filter(test => 
                test.class._id.toString() === classItem._id.toString()
            );

            // Get submissions for this class
            const classSubmissions = submissions.filter(sub => 
                sub.assignment?.class?._id?.toString() === classItem._id.toString()
            );

            // Calculate averages
            const testScores = classTests.map(test => {
                const score = test.scores.find(s => 
                    s.student.toString() === studentId.toString()
                );
                return score ? score.score : 0;
            });

            const testAverage = testScores.length > 0 
                ? testScores.reduce((a, b) => a + b, 0) / testScores.length 
                : 0;

            const assignmentScores = classSubmissions.map(s => s.grade.score);
            const assignmentAverage = assignmentScores.length > 0
                ? assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length
                : 0;

            return {
                ...classItem,
                tests: classTests,
                submissions: classSubmissions,
                testAverage: Number(testAverage.toFixed(1)),
                assignmentAverage: Number(assignmentAverage.toFixed(1)),
                finalGrade: Number(((testAverage * 0.6) + (assignmentAverage * 0.4)).toFixed(1))
            };
        });

        // Render the template with all necessary data
        res.render('student/grades', {
            user: req.user,
            enrolledClasses: classesWithGrades,
            tests, // Pass tests array to template
            submissions, // Pass submissions array to template
            title: 'Xem điểm',
            currentUrl: '/student/grades'
        });

    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải điểm số',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user,
            title: 'Lỗi'
        });
    }
};