const Assignment = require('../models/Assignment');
const Class = require('../models/class');
const Submission = require('../models/submission');

exports.getUpcomingAssignments = async (req, res) => {
    try {
        // Get enrolled classes
        const enrolledClasses = await Class.find({
            students: req.user._id
        }).populate('course', 'title');

        // Get assignments for these classes
        const assignments = await Assignment.find({
            class: { $in: enrolledClasses.map(c => c._id) },
            dueDate: { $gte: new Date() }
        })
        .populate({
            path: 'class',
            populate: { path: 'course', select: 'title' }
        })
        .sort({ dueDate: 1 })
        .limit(5);

        // Get submissions for these assignments
        const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
            const submission = await Submission.findOne({
                assignment: assignment._id,
                student: req.user._id
            });

            return {
                ...assignment.toObject(),
                submission,
                status: getSubmissionStatus(assignment, submission)
            };
        }));

        res.render('student/dashboard', {
            user: req.user,
            assignments: assignmentsWithStatus
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải dữ liệu',
            error: error.message
        });
    }
};

function getSubmissionStatus(assignment, submission) {
    if (submission) {
        return {
            text: 'Đã hoàn thành',
            class: 'badge-success'
        };
    }
    
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (now > dueDate) {
        return {
            text: 'Chưa nộp',
            class: 'badge-danger'
        };
    }
    
    return {
        text: 'Đang thực hiện',
        class: 'badge-warning'
    };
}