const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment'); // Note the capital A
const Class = require('../models/class');
const Submission = require('../models/submission');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/assignments';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, PNG, and MP4 files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Hiển thị danh sách bài tập
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.aggregate([
            {
                $match: {
                    createdBy: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'class',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            {
                $unwind: '$classInfo'
            },
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'assignment',
                    as: 'submissions'
                }
            },
            {
                $addFields: {
                    submissionCount: {
                        $size: '$submissions'
                    },
                    gradedCount: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                as: 'sub',
                                cond: { $eq: ['$$sub.status', 'graded'] }
                            }
                        }
                    },
                    pendingCount: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                as: 'sub',
                                cond: { $eq: ['$$sub.status', 'pending'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    dueDate: 1,
                    class: '$classInfo',
                    submissionCount: 1,
                    gradedCount: 1,
                    pendingCount: 1,
                    status: {
                        $cond: {
                            if: { $gt: [new Date(), '$dueDate'] },
                            then: 'Đã hết hạn',
                            else: 'Đang hoạt động'
                        }
                    }
                }
            },
            {
                $sort: { dueDate: -1 }
            }
        ]);

        console.log('Assignments with counts:', assignments.map(a => ({
            title: a.title,
            submissions: a.submissionCount,
            graded: a.gradedCount,
            pending: a.pendingCount
        })));

        res.render('teacher/assignments', {
            user: req.user,
            assignments: assignments
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài tập',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Hiển thị form tạo bài tập
router.get('/new', async (req, res) => {
    try {
        const classes = await Class.find({ teacher: req.user._id }); // Lấy danh sách lớp của giáo viên
        res.render('teacher/assignments/new', { user: req.user, classes });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải trang tạo bài tập' });
    }
});

// Xử lý tạo bài tập
router.post('/new', async (req, res) => {
    try {
        const { title, description, dueDate, maxScore, classId } = req.body;

        if (!title || !dueDate || !maxScore || !classId) {
            return res.status(400).render('error', { message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const newAssignment = new Assignment({
            title,
            description,
            dueDate,
            maxScore,
            class: classId,
            createdBy: req.user._id
        });

        await newAssignment.save();
        res.redirect('/teacher/assignments');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tạo bài tập' });
    }
});

// Xóa bài tập
router.post('/:id/delete', async (req, res) => {
    try {
        const assignmentId = req.params.id;
        await Assignment.findByIdAndDelete(assignmentId);
        res.redirect('/teacher/assignments');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi xóa bài tập' });
    }
});

// Route for submitting assignments
router.post('/submit-assignment/:assignmentId', upload.single('submission'), async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const studentId = req.user._id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để nộp.' });
        }

        // Check if assignment exists and is not past due date
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
        }

        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({ message: 'Đã quá hạn nộp bài.' });
        }

        // Create or update submission
        const submission = await Submission.findOneAndUpdate(
            { assignment: assignmentId, student: studentId },
            {
                fileName: file.filename,
                filePath: file.path,
                fileType: path.extname(file.originalname).substring(1),
                submittedAt: Date.now()
            },
            { upsert: true, new: true }
        );

        res.redirect('back');
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({ 
            message: 'Có lỗi xảy ra khi nộp bài tập.',
            error: error.message 
        });
    }
});

// Route for updating submissions
router.post('/update-submission/:assignmentId', upload.single('submission'), async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const studentId = req.user._id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để nộp.' });
        }

        // Check if assignment exists and submission exists
        const submission = await Submission.findOne({ 
            assignment: assignmentId, 
            student: studentId 
        });

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp.' });
        }

        // Delete old file
        if (fs.existsSync(submission.filePath)) {
            fs.unlinkSync(submission.filePath);
        }

        // Update submission
        submission.fileName = file.filename;
        submission.filePath = file.path;
        submission.fileType = path.extname(file.originalname).substring(1);
        submission.submittedAt = Date.now();
        await submission.save();

        res.redirect('back');
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ 
            message: 'Có lỗi xảy ra khi cập nhật bài nộp.',
            error: error.message 
        });
    }
});

// Route for deleting submissions
router.post('/delete-submission/:assignmentId', async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const studentId = req.user._id;

        const submission = await Submission.findOne({ 
            assignment: assignmentId, 
            student: studentId 
        });

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp.' });
        }

        // Delete file from storage
        if (fs.existsSync(submission.filePath)) {
            fs.unlinkSync(submission.filePath);
        }

        // Delete submission from database
        await Submission.deleteOne({ _id: submission._id });

        res.redirect('back');
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ 
            message: 'Có lỗi xảy ra khi xóa bài nộp.',
            error: error.message 
        });
    }
});

module.exports = router;
