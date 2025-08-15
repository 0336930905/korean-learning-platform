const express = require('express');
const router = express.Router();
const multer = require('multer');
const Class = require('../models/class'); // Import the Class model
const Course = require('../models/Course'); // Import the Course model
const path = require('path');
const fs = require('fs');
const Submission = require('../models/submission');
const mongoose = require('mongoose');
const Document = require('../models/document'); // Import Document model
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Import User model
const teacherController = require('../controllers/teacherController'); // Add this at the top with your other imports
const Material = require('../models/material'); // Also add the Material model import since it's used in teacherController
const thematicVocabularyController = require('../controllers/thematicVocabularyController'); // Import thematicVocabularyController
const ThematicVocabulary = require('../models/ThematicVocabulary'); // Import ThematicVocabulary model
const gradeListController = require('../controllers/gradeListController'); // Import gradeListController

const {
    getTeacherDashboard,
    getNewCoursePage,
    createClass,
    editClass,
    deleteClass,
    getClassesByTeacherId
} = require('../controllers/teacherController');

const { isTeacher } = require('../middleware/authMiddleware');
const Assignment = require('../models/Assignment');
const {
    getAddAssignmentForm,
    addAssignment,
    getEditAssignmentForm,
    editAssignment,
    deleteAssignment
} = require('../controllers/assignmentController');

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.mp3', '.wav', '.m4a', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Loại file không được hỗ trợ. Vui lòng upload PDF, Word, Audio hoặc hình ảnh.'), false);
        }
    }
});

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/documents');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const documentUpload = multer({ 
    storage: documentStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for MP3 files
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.mp3', '.wav', '.m4a'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên các file: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MP3, WAV, M4A'));
        }
    }
});

// Update or add these routes
const materialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/materials';
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

const materialUpload = multer({
    storage: materialStorage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Vocabulary storage and upload configuration
const vocabularyStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/vocabulary');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Create multer instance with configuration
const vocabularyUpload = multer({
    storage: vocabularyStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Chỉ cho phép tải lên file hình ảnh!'));
    }
});

// Add body-parser middleware
router.use(express.json());

// Define routes with their handlers
router.get('/dashboard/teacher', isTeacher, getTeacherDashboard);
router.get('/teacher/courses/new', isTeacher, getNewCoursePage);
router.post('/teacher/classes', isTeacher, upload.single('classImage'), createClass);

// Add this route BEFORE any routes with :id parameter
router.get('/teacher/classes/new', isTeacher, async (req, res) => {
    try {
        // Chỉ lấy các khóa học mà giảng viên hiện tại được phân công
        const courses = await Course.find({ instructor: req.user._id });
        res.render('teacher/new_class', {
            user: req.user,
            courses: courses
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tạo lớp học',
            user: req.user
        });
    }
});

// Then keep your existing class detail route
router.get('/teacher/classes/:id', isTeacher, async (req, res) => {
    try {
        // Validate if id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).render('error', {
                message: 'ID lớp học không hợp lệ',
                user: req.user
            });
        }

        const classData = await Class.findById(req.params.id)
            .populate('course')
            .populate('students', 'fullName email')
            .populate('teacher');

        if (!classData) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy lớp học',
                user: req.user
            });
        }

        const assignments = await Assignment.find({ class: req.params.id });
        const documents = await Document.find({ class: req.params.id })
            .sort({ uploadedAt: -1 });

        res.render('teacher/class', {
            user: req.user,
            classData,
            assignments,
            documents
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải thông tin lớp học',
            user: req.user
        });
    }
});

router.get('/teacher/classes', isTeacher, async (req, res) => {
    try {
        const Class = require('../models/class');
        const Course = require('../models/Course');
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course')
            .populate('students')
            .populate('pendingRequests', 'fullName email'); // Add this line
        const courses = await Course.find();
        res.render('teacher/list_classes', { 
            user: req.user,
            classes: classes,
            courses: courses
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tất cả lớp học'
        });
    }
});
router.post('/teacher/classes/:id/edit', isTeacher, upload.single('classImage'), editClass);
router.post('/teacher/classes/:id/delete', isTeacher, deleteClass);

router.get('/teacher/assignments', isTeacher, async (req, res) => {
    try {
        // Lấy danh sách lớp học của giáo viên
        const classes = await Class.find({ teacher: req.user._id })
            .select('name _id');

        // Lấy danh sách bài tập với thông tin lớp học
        const assignments = await Assignment.find({ createdBy: req.user._id })
            .populate('class')
            .sort({ createdAt: -1 });

        res.render('teacher/assignments', { 
            user: req.user,
            assignments: assignments,
            classes: classes,
            selectedClassId: req.query.classId || 'all'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài tập'
        });
    }
});

router.get('/teacher/assignments/add', isTeacher, getAddAssignmentForm);
router.post('/teacher/assignments/add', isTeacher, upload.single('attachmentFile'), async (req, res) => {
    try {
        const { classId, title, dueDate, description } = req.body;

        // Tạo object bài tập mới
        const assignmentData = {
            class: classId,
            title,
            dueDate,
            description,
            createdBy: req.user._id
        };

        // Thêm thông tin file đính kèm nếu có
        if (req.file) {
            assignmentData.attachmentFile = {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            };
        }

        // Tạo bài tập mới
        const newAssignment = new Assignment(assignmentData);

        // Lưu bài tập vào cơ sở dữ liệu
        await newAssignment.save();

        // Chuyển hướng về trang chi tiết lớp học
        res.redirect(`/teacher/classes/${classId}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi thêm bài tập mới'
        });
    }
});
router.get('/teacher/edit_assignment/:id', isTeacher, async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).render('error', {
                message: 'ID bài tập không hợp lệ',
                user: req.user
            });
        }

        // Find assignment and populate class data
        const assignment = await Assignment.findById(req.params.id)
            .populate('class');

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài tập',
                user: req.user
            });
        }

        // Get all classes for the dropdown
        const classes = await Class.find({ teacher: req.user._id });

        // Debug logs
        console.log('Assignment found:', assignment);
        console.log('Available classes:', classes);

        res.render('teacher/edit_assignment', {
            title: 'Chỉnh sửa bài tập',
            user: req.user,
            assignment: assignment,
            classes: classes,
            path: '/teacher/assignments'
        });

    } catch (error) {
        console.error('Error in edit assignment route:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang chỉnh sửa bài tập',
            user: req.user
        });
    }
});
router.post('/teacher/assignments/:id/edit', isTeacher, upload.single('attachmentFile'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, classId } = req.body;

        // Validate date
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Ngày hạn nộp không hợp lệ'
            });
        }

        // Check if date is in the future
        if (parsedDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ngày hạn nộp phải lớn hơn thời gian hiện tại'
            });
        }

        // Prepare update data
        const updateData = { 
            title, 
            description, 
            dueDate: parsedDate,
            class: classId
        };

        // Handle file upload if present
        if (req.file) {
            updateData.attachmentFile = {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            };
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedAssignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài tập'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật bài tập thành công',
            assignment: updatedAssignment
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật bài tập'
        });
    }
});
router.post('/teacher/assignments/:id/delete', isTeacher, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedAssignment = await Assignment.findByIdAndDelete(id);

        if (!deletedAssignment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài tập'
            });
        }

        res.json({ success: true, message: 'Đã xóa bài tập' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa bài tập' });
    }
});

router.get('/api/teachers/:teacherId/classes', getClassesByTeacherId);

router.get('/teacher/enrollment-requests', isTeacher, async (req, res) => {
    try {
        const Class = require('../.models/class');
        const classes = await Class.find({ teacher: req.user._id })
            .populate('pendingRequests', 'fullName email')
            .populate('course', 'title');

        res.render('teacher/enrollment_requests', { 
            user: req.user,
            classes: classes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách yêu cầu ghi danh'
        });
    }
});

// Add routes for handling approval/rejection
router.post('/teacher/enrollment-requests/:classId/:studentId/approve', isTeacher, async (req, res) => {
    try {
        const Class = require('../models/class');
        const { classId, studentId } = req.params;
        
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Check if class is full
        if (classDoc.students.length >= classDoc.maxStudents) {
            return res.status(400).json({ message: 'Lớp học đã đủ số lượng sinh viên' });
        }

        // Check if student is already in the class
        if (classDoc.students.includes(studentId)) {
            return res.status(400).json({ message: 'Sinh viên đã là thành viên của lớp học' });
        }

        // Move student from pendingRequests to students
        classDoc.pendingRequests = classDoc.pendingRequests.filter(id => id.toString() !== studentId);
        classDoc.students.push(studentId);
        await classDoc.save();

        // Create notification for student
        const Notification = require('../models/notification');
        await new Notification({
            user: studentId,
            message: `Yêu cầu tham gia lớp ${classDoc.name} đã được chấp nhận`,
            type: 'enrollment_approved',
            classId: classId // Add classId to reference the class
        }).save();

        res.json({ 
            success: true, 
            message: 'Đã chấp nhận yêu cầu tham gia lớp học',
            updatedClass: classDoc
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xử lý yêu cầu' });
    }
});

router.post('/teacher/enrollment-requests/:classId/:studentId/reject', isTeacher, async (req, res) => {
    try {
        const Class = require('../.models/class');
        const { classId, studentId } = req.params;
        
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Remove student from pendingRequests
        classDoc.pendingRequests = classDoc.pendingRequests.filter(id => id.toString() !== studentId);
        await classDoc.save();

        // Create notification for student
        const Notification = require('../models/notification');
        await new Notification({
            user: studentId,
            message: `Yêu cầu tham gia lớp ${classDoc.name} đã bị từ chối`,
            type: 'enrollment_rejected',
            classId: classId // Add classId to reference the class
        }).save();

        res.json({ 
            success: true, 
            message: 'Đã từ chối yêu cầu tham gia lớp học',
            updatedClass: classDoc
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xử lý yêu cầu' });
    }
});

router.post('/teacher/classes/:classId/students/:studentId/remove', isTeacher, async (req, res) => {
    try {
        const { classId, studentId } = req.params;

        // Tìm lớp học
        const classData = await Class.findById(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Xóa sinh viên khỏi danh sách học viên
        classData.students = classData.students.filter(
            (student) => student.toString() !== studentId
        );

        await classData.save();

        res.json({ success: true, message: 'Đã xóa sinh viên khỏi lớp học' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa sinh viên khỏi lớp học' });
    }
});

router.get('/class/:id', isTeacher, async (req, res) => {
    try {
        const classId = req.params.id;

        // Lấy thông tin lớp học
        const classData = await Class.findById(classId)
            .populate('course')
            .populate('students', 'fullName email');

        if (!classData) {
            return res.status(404).render('error', { message: 'Không tìm thấy lớp học' });
        }

        // Lấy danh sách bài tập liên quan đến lớp học
        const assignments = await Assignment.find({ class: classId });

        // Add this to fetch documents
        const documents = await Document.find({ class: req.params.id })
            .sort({ uploadedAt: -1 });

        res.render('teacher/class', {
            user: req.user,
            classData,
            assignments,
            documents // Add this
        });
    } catch (err) {
        console.error('Error fetching class details:', err);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải thông tin lớp học' });
    }
});

router.get('/teacher/assignment-submissions/:assignmentId', async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const Submission = require('../models/submission'); // Add this line
        
        const assignment = await Assignment.findById(assignmentId)
            .populate('class');

        if (!assignment) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy bài tập',
                user: req.user 
            });
        }

        // Get all submissions for this assignment with student info
        const submissions = await Submission.find({ assignment: assignmentId })
            .populate('student', 'fullName email')
            .sort({ submittedAt: -1 });

        res.render('teacher/assignment_submissions', {
            user: req.user,
            assignment,
            submissions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài nộp',
            user: req.user
        });
    }
});

router.get('/download-submission/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads/assignments', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        res.download(filePath, filename);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
});

// Cập nhật route chấm điểm
router.post('/grade-submission/:submissionId', async (req, res) => {
    try {
        const { score, feedback } = req.body;
        const submissionId = req.params.submissionId;

        // Validate submission ID
        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài nộp không hợp lệ'
            });
        }

        // Find and update submission
        const submission = await Submission.findByIdAndUpdate(
            submissionId,
            {
                $set: {
                    'grade.score': parseFloat(score),
                    'grade.feedback': feedback,
                    'grade.gradedAt': new Date(),
                    'grade.gradedBy': req.user._id,
                    status: 'graded'
                }
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài nộp'
            });
        }

        // Update assignment stats
        const stats = await Assignment.updateStats(submission.assignment);

        return res.json({
            success: true,
            message: 'Đã lưu điểm thành công',
            submission,
            stats
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lưu điểm'
        });
    }
});

// Change this route to match the URL in the link
router.get('/teacher/learning_game', requireAuth, requireRole('teacher'), async (req, res) => {
    try {
        const Exercise = require('../models/exercise'); // Add this line
        const User = require('../models/User'); // Add this line

        // Get statistics
        const stats = {
            totalExercises: await Exercise.countDocuments({ createdBy: req.user._id }),
            weeklyExercises: await Exercise.countDocuments({
                createdBy: req.user._id,
                createdAt: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            }),
            totalStudents: await User.countDocuments({ 
                role: 'student',
                'progress.completedLessons': { $exists: true, $not: { $size: 0 } }
            }),
            averageScore: await calculateAverageScore(req.user._id)
        };

        res.render('teacher/learning_game', {
            user: req.user,
            stats: stats,
            currentUrl: '/teacher/learning_game'
        });
    } catch (error) {
        console.error('Error loading learning games:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang bài tự học',
            error: error.message,
            user: req.user
        });
    }
});

// Add helper function if not already present
async function calculateAverageScore(teacherId) {
    try {
        const Exercise = require('../models/exercise');
        const result = await Exercise.aggregate([
            {
                $match: { 
                    createdBy: new mongoose.Types.ObjectId(teacherId) 
                }
            },
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'exercise',
                    as: 'submissions'
                }
            },
            {
                $unwind: {
                    path: '$submissions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: null,
                    averageScore: { 
                        $avg: '$submissions.score' 
                    }
                }
            }
        ]);

        return result.length > 0 ? Math.round(result[0].averageScore * 10) / 10 : 0;
    } catch (error) {
        console.error('Error calculating average score:', error);
        return 0;
    }
}

// Add this new route
router.get('/teacher/grading', isTeacher, async (req, res) => {
    try {
        // First get all classes taught by the teacher
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course', 'title')
            .lean(); // Use lean() for better performance

        // Get all assignments for these classes
        const assignments = await Assignment.find({
            class: { $in: classes.map(c => c._id) }
        });

        // Get all ungraded submissions
        const pendingSubmissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) },
            'grade.score': { $exists: false }
        })
        .populate('student', 'fullName email')
        .populate({
            path: 'assignment',
            populate: {
                path: 'class',
                populate: 'course'
            }
        })
        .sort({ submittedAt: -1 });

        // Group submissions by class
        const submissionsByClass = classes.map(classItem => {
            const classSubmissions = pendingSubmissions.filter(sub => 
                sub.assignment.class._id.toString() === classItem._id.toString()
            );
            return {
                ...classItem,
                submissions: classSubmissions
            };
        });

        res.render('teacher/grading', {
            user: req.user,
            classes: submissionsByClass,
            pendingSubmissions: pendingSubmissions
        });
    } catch (error) {
        console.error('Error loading grading page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang chấm điểm',
            user: req.user
        });
    }
});



// Update the document upload route
router.post('/teacher/documents/upload', isTeacher, documentUpload.single('document'), async (req, res) => {
    try {
        const { classId, title, description, category } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có file được tải lên' 
            });
        }

        // Validate category
        const validCategories = ['speaking', 'listening', 'writing', 'vocabulary'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Phân loại tài liệu không hợp lệ'
            });
        }

        const document = new Document({
            class: classId,
            title: title,
            description: description,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            category: category // Add this line
        });

        await document.save();
        res.redirect(`/teacher/classes/${classId}`);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải lên tài liệu',
            user: req.user
        });
    }
});

// Replace or update the document delete route
router.post('/teacher/documents/:id/delete', isTeacher, async (req, res) => {
    try {
        const documentId = req.params.id;

        // Find the document first
        const document = await Document.findById(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài liệu'
            });
        }

        // Check if user has permission (teacher of the class)
        const classDoc = await Class.findById(document.class);
        if (classDoc.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa tài liệu này'
            });
        }

        // Delete the file from storage
        const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete the document from database
        await Document.findByIdAndDelete(documentId);

        res.json({
            success: true,
            message: 'Đã xóa tài liệu thành công'
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa tài liệu'
        });
    }
});

router.get('/teacher/documents/:id/download', isTeacher, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy tài liệu',
                user: req.user
            });
        }

        const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).render('error', {
                message: 'File không tồn tại',
                user: req.user
            });
        }

        // Get file extension to determine MIME type
        const ext = path.extname(document.fileName).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4'
        };

        // Set headers for download
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải xuống tài liệu',
            user: req.user
        });
    }
});

// Edit document route
router.post('/teacher/documents/:id/edit', isTeacher, documentUpload.single('document'), async (req, res) => {
    try {
        const documentId = req.params.id;
        const { title, description, category } = req.body;

        // Find the existing document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài liệu'
            });
        }

        // Validate category
        const validCategories = ['speaking', 'listening', 'writing', 'vocabulary'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Phân loại tài liệu không hợp lệ'
            });
        }

        // Prepare update data
        const updateData = {
            title: title,
            description: description,
            category: category
        };

        // If a new file is uploaded, handle file replacement
        if (req.file) {
            // Delete the old file
            const oldFilePath = path.join(__dirname, '../../uploads/documents', document.fileName);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            // Update with new file info
            updateData.fileName = req.file.filename;
            updateData.originalName = req.file.originalname;
        }

        // Update the document
        const updatedDocument = await Document.findByIdAndUpdate(
            documentId,
            updateData,
            { new: true }
        );

        // Get the class ID for redirect
        const classId = document.class;
        res.redirect(`/teacher/classes/${classId}`);

    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật tài liệu'
        });
    }
});

// Replace this route
router.get('/teacher/students', requireAuth, requireRole('teacher'), async (req, res) => {
    try {
        // Get all classes taught by this teacher
        const teacherClasses = await Class.find({ teacher: req.user._id })
            .populate('course', 'title')
            .populate({
                path: 'students',
                select: 'fullName email avatar studentId',
                populate: {
                    path: 'submissions',
                    match: { 
                        assignment: { 
                            $in: await Assignment.find({ 
                                class: { $in: await Class.find({ teacher: req.user._id }).select('_id') } 
                            }).select('_id') 
                        }
                    },
                    select: 'grade.score'
                }
            });

        // Process student data
        let allStudents = [];
        teacherClasses.forEach(classItem => {
            if (classItem.students && classItem.students.length > 0) {
                classItem.students.forEach(student => {
                    // Calculate average score for submissions in teacher's classes only
                    const scores = student.submissions?.map(sub => sub.grade?.score).filter(score => score !== undefined) || [];
                    const avgScore = scores.length > 0 
                        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) 
                        : 'N/A';

                    allStudents.push({
                        id: student._id,
                        fullName: student.fullName,
                        email: student.email,
                        studentId: student.studentId,
                        avatar: student.avatar,
                        className: classItem.name,
                        courseName: classItem.course.title,
                        averageScore: avgScore,
                        submissionCount: scores.length
                    });
                });
            }
        });

        res.render('teacher/student_list', {
            user: req.user,
            students: allStudents,
            classes: teacherClasses
        });

    } catch (error) {
        console.error('Error loading student list:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách học sinh',
            user: req.user
        });
    }
});

// Thay thế route materials
router.get('/teacher/materials', isTeacher, async (req, res, next) => {
    console.log('Accessing materials route with user:', req.user?._id);
    next();
}, teacherController.getAllMaterials);

// Route download cho materials
router.get('/teacher/materials/:id/download', isTeacher, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).send('Material not found');
        }

        const filePath = path.join(__dirname, '../../public/uploads/materials', material.fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Increment download count
        material.downloadCount += 1;
        await material.save();

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${material.originalName}"`);
        res.setHeader('Content-Type', material.fileType);
        
        // Send file
        res.download(filePath, material.originalName);

    } catch (error) {
        console.error('Error downloading material:', error);
        res.status(500).send('Error downloading file');
    }
});

// Update the assignments route
router.post('/assignments/add', 
    isTeacher,
    upload.single('assignmentFile'),
    async (req, res) => {
        try {
            console.log('Received request body:', req.body); // Debug log

            // Validate required fields
            if (!req.body.title || !req.body.dueDate || !req.body.classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc. Vui lòng điền đầy đủ.'
                });
            }

            // Create new assignment document
            const newAssignment = new Assignment({
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : '',
                dueDate: new Date(req.body.dueDate),
                class: req.body.classId,
                createdBy: req.user._id
            });

            // Handle file if uploaded
            if (req.file) {
                newAssignment.attachmentFile = {
                    fileName: req.file.filename,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    path: `/uploads/assignments/${req.file.filename}`
                };
            }

            console.log('Saving assignment:', newAssignment); // Debug log

            // Save the assignment
            await newAssignment.save();

            // Send success response
            res.status(201).json({
                success: true,
                message: 'Thêm bài tập thành công',
                assignment: newAssignment
            });

        } catch (error) {
            console.error('Error adding assignment:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi thêm bài tập',
                error: error.message
            });
        }
    }
);

// Vocabulary routes
router.get('/teacher/thematic-vocabulary', 
    requireAuth, 
    requireRole('teacher'), 
    thematicVocabularyController.getList
);

router.get('/teacher/thematic-vocabulary/new', 
    requireAuth, 
    requireRole('teacher'), 
    (req, res) => {
        res.render('teacher/thematic_vocabulary_form', {
            user: req.user,
            vocabulary: null,
            messages: req.flash()
        });
    }
);

// Create route with file upload
router.post(
    '/teacher/thematic-vocabulary/add',
    requireAuth,
    requireRole('teacher'),
    vocabularyUpload.any(), // Cho phép tất cả các file
    thematicVocabularyController.create
);

// Edit form route
router.get('/teacher/thematic-vocabulary/:id/edit',
    requireAuth,
    requireRole('teacher'),
    thematicVocabularyController.getEditForm
);

// Update routes
router.put('/teacher/thematic-vocabulary/:id', 
    requireAuth,
    requireRole('teacher'),
    vocabularyUpload.any(),
    thematicVocabularyController.update
);

// Add a POST route as fallback for update
router.post('/teacher/thematic-vocabulary/:id', 
    requireAuth,
    requireRole('teacher'),
    vocabularyUpload.any(), // Cho phép upload nhiều file
    thematicVocabularyController.update
);

// Delete route
router.post('/teacher/thematic-vocabulary/:id/delete',
    requireAuth,
    requireRole('teacher'),
    thematicVocabularyController.delete
);

// Add this route to get vocabulary data
router.get('/teacher/thematic-vocabulary/:id/get',
    requireAuth,
    requireRole('teacher'),
    thematicVocabularyController.getVocabularyData
);

// Image upload route
router.post('/api/upload-image',
    requireAuth,
    requireRole('teacher'),
    vocabularyUpload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file được tải lên'
                });
            }

            const imageUrl = `/uploads/vocabulary/${req.file.filename}`;
            res.json({
                success: true,
                imageUrl: imageUrl
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tải lên hình ảnh'
            });
        }
    }
);

// Add error handling middleware
router.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'Lỗi khi tải file lên: ' + err.message
        });
    }
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trong quá trình xử lý',
        error: err.message
    });
});

// Thêm route mới
router.get('/teacher/grade-list', isTeacher, gradeListController.getGradeList);
router.get('/teacher/grade-list/export', isTeacher, gradeListController.exportStudentGrades);
router.post('/teacher/grade-list/send-grades', isTeacher, async (req, res) => {
    try {
        const { classId } = req.body;
        
        // Implementation for sending grades via email/notification
        // This would integrate with your notification system
        
        res.json({
            success: true,
            message: 'Đã gửi bảng điểm thành công cho tất cả học viên'
        });
    } catch (error) {
        console.error('Error sending grades:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi gửi bảng điểm'
        });
    }
});

// Add this route for API courses
router.get('/api/courses', isTeacher, async (req, res) => {
    try {
        // Chỉ lấy các khóa học mà giảng viên hiện tại được phân công
        const courses = await Course.find({ 
            status: 'active',
            instructor: req.user._id 
        })
            .select('title level category duration price description')
            .sort({ title: 1 });
            
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi tải danh sách khóa học' 
        });
    }
});

// Thêm route link từ class detail đến attendance
router.get('/teacher/attendance', requireAuth, requireRole('teacher'), (req, res) => {
    res.redirect(`/attendance`);
});

// Thêm routes thống kê học lực
router.get('/teacher/academic-stats', isTeacher, teacherController.getAcademicStats);
router.get('/teacher/academic-stats/:classId', isTeacher, teacherController.getClassAcademicStats);
router.get('/teacher/academic-stats/:classId/export', isTeacher, teacherController.exportAcademicStats);

module.exports = router;

async function handleEditSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData();

    try {
        // Add basic data
        formData.append('theme', form.theme.value.trim());
        formData.append('level', form.level.value);
        formData.append('vocabularyId', form.vocabularyId.value);

        // Add theme image if selected
        const themeImageInput = form.querySelector('input[name="themeImage"]');
        if (themeImageInput?.files[0]) {
            formData.append('themeImage', themeImageInput.files[0]);
        } else {
            formData.append('existingThemeImage', form.existingThemeImage.value);
        }

        // Send request to update vocabulary
        const response = await fetch(`/teacher/thematic-vocabulary/${form.vocabularyId.value}`, {
            method: 'POST', // or 'PUT' if your server supports it
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('Cập nhật thành công');
            window.location.reload();
        } else {
            throw new Error(result.message || 'Có lỗi xảy ra khi cập nhật');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Có lỗi xảy ra khi cập nhật');
    }
}