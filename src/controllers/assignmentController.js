const Submission = require('../models/submission');
const Class = require('../models/class');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

exports.getAssignments = async (req, res) => {
    try {
        // Get assignments with populated class info
        const assignments = await Assignment.aggregate([
            {
                $match: {
                    createdBy: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: 'classes', // collection name in MongoDB
                    localField: 'class', // field from Assignment model
                    foreignField: '_id', // field from Class model
                    as: 'classInfo'
                }
            },
            {
                $unwind: '$classInfo'
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'classInfo.course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            {
                $unwind: '$courseInfo'
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    dueDate: 1,
                    class: {
                        _id: '$classInfo._id',
                        name: '$classInfo.name',
                        course: {
                            _id: '$courseInfo._id',
                            title: '$courseInfo.title',
                            level: '$courseInfo.level'
                        }
                    },
                    submissionCount: { $size: '$submissions' },
                    status: {
                        $cond: {
                            if: { $gt: [new Date(), '$dueDate'] },
                            then: 'Đã kết thúc',
                            else: 'Đang hoạt động'
                        }
                    }
                }
            }
        ]);

        console.log('Assignments with class info:', assignments);

        // Get list of classes for filter
        const teacherClasses = await Class.find({ 
            teacher: req.user._id 
        }).select('name _id');

        res.render('teacher/assignments', { 
            user: req.user,
            assignments: assignments,
            teacherClasses: teacherClasses
        });

    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).render('error', {
            message: 'Error fetching assignments',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

exports.getAddAssignmentForm = async (req, res) => {
    try {
        const classes = await Class.find({ teacher: req.user._id });
        res.render('teacher/add_assignment', { user: req.user, classes });
    } catch (error) {
        console.error('Error loading form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

exports.addAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, classId } = req.body;
        
        const assignmentData = {
            title,
            description,
            dueDate: new Date(dueDate),
            class: classId,
            createdBy: req.user._id
        };

        // Handle file attachment if provided
        if (req.file) {
            assignmentData.attachmentFile = {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            };
        }

        const newAssignment = new Assignment(assignmentData);
        await newAssignment.save();
        res.redirect('/teacher/assignments');
    } catch (error) {
        console.error('Error adding assignment:', error);
        res.status(500).render('error', { message: 'Error adding assignment' });
    }
};

exports.getEditAssignmentForm = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        const classes = await Class.find({ teacher: req.user._id });
        if (!assignment) {
            return res.status(404).render('error', { message: 'Assignment not found' });
        }
        res.render('teacher/edit_assignment', { user: req.user, assignment, classes });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).render('error', { message: 'Error loading edit form' });
    }
};

exports.editAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, classId } = req.body;
        await Assignment.findByIdAndUpdate(req.params.id, {
            title,
            description,
            dueDate: new Date(dueDate),
            class: classId
        });
        res.redirect('/teacher/assignments');
    } catch (error) {
        console.error('Error editing assignment:', error);
        res.status(500).render('error', { message: 'Error editing assignment' });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.redirect('/teacher/assignments');
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).render('error', { message: 'Error deleting assignment' });
    }
};
