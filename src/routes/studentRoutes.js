// src/routes/studentRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Add mongoose import
const { getAllCourses, purchaseCourse, confirmPayment, getMyCourses } = require('../controllers/studentCourseController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const Course = require('../models/Course'); // Import the Course model
const Class = require('../models/class'); // Import the Class model
const Assignment = require('../models/Assignment'); // Add this import
const Submission = require('../models/submission'); // Add this import
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Add this import
const Document = require('../models/document'); // Add this import
const ForumPost = require('../models/forum'); // Add this import
const { getUpcomingAssignments } = require('../controllers/studentDashboardController'); // Add this import
const { getStudentDashboard } = require('../controllers/dashboardController'); // Add this import
const messageController = require('../controllers/messageController'); // Add this import
const User = require('../models/User'); // Add this import
const bcrypt = require('bcryptjs'); // Add this import
const ThematicVocabulary = require('../models/ThematicVocabulary'); // Add this import
const studentThematicVocabularyController = require('../controllers/studentThematicVocabularyController'); // Add this import
const Invoice = require('../models/Invoice'); // Add this line with other imports
const gradesController = require('../controllers/gradesController');

// Create required directories
const uploadsDir = path.join(__dirname, '../../uploads');
const forumUploadsDir = path.join(uploadsDir, 'forum');

if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(forumUploadsDir)){
    fs.mkdirSync(forumUploadsDir);
}

// Create uploads directory if it doesn't exist
const assignmentsUploadsDir = path.join(__dirname, '../../uploads/assignments');
if (!fs.existsSync(assignmentsUploadsDir)) {
    fs.mkdirSync(assignmentsUploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/assignments');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (increased for MP3/MP4)
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.mp3', '.mp4'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên các file: PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, MP4'));
        }
    }
});

// Configure multer for forum image uploads
const forumStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, forumUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const forumUpload = multer({ 
    storage: forumStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Chỉ cho phép tải lên file ảnh!');
        }
    }
});

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/forum');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const forumStorageUpdated = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const forumUploadUpdated = multer({ 
    storage: forumStorageUpdated,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const profileUploadsDir = path.join(__dirname, '../../public/uploads/profiles');
        if (!fs.existsSync(profileUploadsDir)) {
            fs.mkdirSync(profileUploadsDir, { recursive: true });
        }
        cb(null, profileUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const profileUpload = multer({ 
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Static routes first - Add these before any parameterized routes
router.get('/messages', requireAuth, requireRole('student'), messageController.getMessages);
router.get('/api/chat/:userId', requireAuth, requireRole('student'), messageController.getChatMessages);
router.post('/api/chat/send', requireAuth, requireRole('student'), messageController.sendMessage);
router.post('/api/chat/:senderId/read', requireAuth, requireRole('student'), messageController.markAsRead);

// Add these static routes BEFORE any routes with parameters (/:courseId)
router.get('/thematic-vocabulary', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Fetch all vocabulary themes grouped by level
        const vocabularies = await ThematicVocabulary.find()
            .populate('createdBy', 'fullName')
            .sort({ level: 1, theme: 1 });

        // Group vocabularies by level
        const groupedVocabularies = {
            basic: vocabularies.filter(v => v.level === 'basic'),
            intermediate: vocabularies.filter(v => v.level === 'intermediate'),
            advanced: vocabularies.filter(v => v.level === 'advanced')
        };

        // Calculate statistics
        const totalThemes = vocabularies.length;
        const totalWords = vocabularies.reduce((sum, vocab) => sum + vocab.words.length, 0);
        const completedWords = 0; // You can implement progress tracking later

        res.render('student/student_thematic_vocabulary', {
            user: req.user,
            vocabularies: groupedVocabularies,
            stats: {
                totalThemes,
                totalWords,
                completedWords
            },
            currentUrl: '/student/thematic-vocabulary'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Error loading vocabulary themes',
            error: error.message,
            user: req.user
        });
    }
});

// Route để học từ vựng theo chủ đề
router.get('/thematic-vocabulary/:themeId/learn', 
    requireAuth, 
    requireRole('student'), 
    async (req, res) => {
        try {
            const themeId = req.params.themeId;
            const vocabulary = await ThematicVocabulary.findById(themeId)
                .select('theme level words');

            if (!vocabulary) {
                return res.status(404).render('error', {
                    message: 'Không tìm thấy chủ đề từ vựng',
                    user: req.user
                });
            }

            res.render('student/learn_vocabulary', {
                user: req.user,
                vocabulary,
                title: `Học từ vựng | ${vocabulary.theme}`
            });

        } catch (error) {
            console.error('Error loading vocabulary:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải từ vựng',
                user: req.user
            });
        }
    }
);

// Route để luyện tập từ vựng theo chủ đề
router.get('/thematic-vocabulary/:themeId/practice', 
    requireAuth, 
    requireRole('student'), 
    async (req, res) => {
        try {
            const themeId = req.params.themeId;
            
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(themeId)) {
                return res.status(400).render('error', {
                    message: 'ID chủ đề không hợp lệ',
                    user: req.user
                });
            }

            const vocabulary = await ThematicVocabulary.findById(themeId)
                .select('theme level words');
            
            if (!vocabulary) {
                return res.status(404).render('error', {
                    message: 'Không tìm thấy chủ đề từ vựng',
                    user: req.user
                });
            }

            // Check if vocabulary has words
            if (!vocabulary.words || vocabulary.words.length === 0) {
                return res.status(404).render('error', {
                    message: 'Chủ đề này chưa có từ vựng',
                    user: req.user
                });
            }

            // Check minimum words for practice
            if (vocabulary.words.length < 4) {
                return res.status(400).render('error', {
                    message: 'Cần ít nhất 4 từ vựng để luyện tập',
                    user: req.user
                });
            }

            res.render('student/practice_vocabulary', {
                user: req.user,
                vocabulary: vocabulary,
                title: `Luyện tập từ vựng | ${vocabulary.theme}`
            });

        } catch (error) {
            console.error('Error loading practice vocabulary:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải bài luyện tập',
                error: error.message,
                user: req.user
            });
        }
    }
);

// Thêm route cho API lấy từ vựng
router.get('/api/thematic-vocabulary/theme/:themeId', 
    requireAuth, 
    requireRole('student'), 
    async (req, res) => {
        try {
            const themeId = req.params.themeId;
            
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(themeId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID chủ đề không hợp lệ'
                });
            }

            const vocabulary = await ThematicVocabulary.findById(themeId);
            
            if (!vocabulary) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chủ đề từ vựng'
                });
            }

            // Lọc và map các từ cần thiết
            const words = vocabulary.words
                .filter(word => word.imageUrl && word.korean)
                .map(word => ({
                    _id: word._id,
                    korean: word.korean,
                    meaning: word.meaning,
                    pronunciation: word.pronunciation, 
                    imageUrl: word.imageUrl
                }));

            if (words.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Chủ đề này chưa có từ vựng'
                });
            }

            res.json({
                success: true,
                theme: vocabulary.theme,
                words: words
            });

        } catch (error) {
            console.error('Error getting theme words:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tải từ vựng theo chủ đề'
            });
        }
    }
);

// Add these review routes after your middleware imports but before other routes
router.get('/thematic-vocabulary/review', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const vocabularies = await ThematicVocabulary.find()
            .select('theme words')
            .lean();

        res.render('student/review_vocabulary', {
            user: req.user,
            vocabularies,
            currentUrl: '/student/thematic-vocabulary/review'
        });
    } catch (error) {
        console.error('Error loading review page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang ôn tập',
            user: req.user
        });
    }
});

// Theme review route
router.get('/thematic-vocabulary/review/theme/:themeId', 
    requireAuth, 
    requireRole('student'), 
    studentThematicVocabularyController.showThemeReview
);

// Random review route
router.get('/thematic-vocabulary/review/random', 
    requireAuth, 
    requireRole('student'), 
    studentThematicVocabularyController.showRandomReview
);

// Reset random review route
router.get('/thematic-vocabulary/review/random/reset', 
    requireAuth, 
    requireRole('student'), 
    studentThematicVocabularyController.resetRandomReview
);

// Review routes - Make sure these are placed before any parameterized routes
router.get('/review', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const vocabularies = await ThematicVocabulary.find()
            .select('theme words')
            .lean();

        res.render('student/review_vocabulary', {
            user: req.user,
            vocabularies,
            currentUrl: '/student/review'
        });
    } catch (error) {
        console.error('Error loading review page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang ôn tập',
            user: req.user
        });
    }
});

// Theme review route
router.get('/review/theme/:themeId', 
    requireAuth, 
    requireRole('student'), 
    studentThematicVocabularyController.showThemeReview
);

// Random review route
router.get('/review/random', 
    requireAuth, 
    requireRole('student'), 
    studentThematicVocabularyController.showRandomReview
);

// Add reset route if needed
router.get('/review/random/reset',
    requireAuth,
    requireRole('student'),
    studentThematicVocabularyController.resetRandomReview
);

// View all courses
router.get('/', requireAuth, requireRole('student'), getAllCourses);

// View enrolled courses
router.get('/my-courses', requireAuth, requireRole('student'), getMyCourses);

// Purchase a course
router.post('/purchase/:courseId', requireAuth, requireRole('student'), purchaseCourse);

// Confirm payment
router.post('/confirm-payment', requireAuth, requireRole('student'), confirmPayment);

// Add these routes BEFORE the /:courseId route
router.get('/account', requireAuth, requireRole('student'), async (req, res) => {
    try {
        res.render('student/accountManagement', {
            user: req.user,
            currentUrl: '/student/account'
        });
    } catch (error) {
        console.error('Error loading account page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tài khoản',
            user: req.user
        });
    }
});

// cập nhật tài khoản học viên
router.post('/account/update', requireAuth, requireRole('student'), profileUpload.single('profileImage'), async (req, res) => {
    try {
        const updateData = {
            fullName: req.body.fullName,
            phone: req.body.phone,
            gender: req.body.gender || "" // Thêm trường gender
        };

        // Remove empty fields but keep gender even if empty
        Object.keys(updateData).forEach(key => {
            if (key !== 'gender' && (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined)) {
                delete updateData[key];
            }
        });

        // If a new profile image was uploaded
        if (req.file) {
            updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
            
            // Delete old profile image if exists
            if (req.user.profileImage) {
                const oldImagePath = path.join(__dirname, '../../public', req.user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        // Update user in database
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        req.flash('success', 'Cập nhật thông tin thành công');
        res.redirect('/student/account');
    } catch (error) {
        console.error('Error updating account:', error);
        req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin');
        res.redirect('/student/account');
    }
});

// Password change route
router.post('/account/change-password', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate new password
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Mật khẩu mới không khớp');
            return res.redirect('/student/account');
        }

        // Check current password
        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            req.flash('error', 'Mật khẩu hiện tại không đúng');
            return res.redirect('/student/account');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(req.user._id, {
            password: hashedPassword
        });

        req.flash('success', 'Đổi mật khẩu thành công');
        res.redirect('/student/account');
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'Có lỗi xảy ra khi đổi mật khẩu');
        res.redirect('/student/account');
    }
});

// Add this route before any routes with :courseId or :id parameters
router.get('/grades', requireAuth, requireRole('student'), gradesController.getStudentGrades);

// Add the resources route BEFORE any routes with :id parameters
router.get('/resources', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Get all classes the student is enrolled in
        const enrolledClasses = await Class.find({
            students: req.user._id
        })
        .populate('course', 'title')
        .lean();

        // Get documents for these classes
        const classesWithDocs = await Promise.all(enrolledClasses.map(async (classItem) => {
            const documents = await Document.find({ 
                class: classItem._id 
            })
            .sort({ uploadedAt: -1 })
            .lean();

            return {
                ...classItem,
                documents
            };
        }));

        res.render('student/resources', {
            user: req.user,
            classesWithDocs
        });
    } catch (error) {
        console.error('Error loading resources:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải tài liệu',
            user: req.user
        });
    }
});

// Add this new route
router.get('/student/assignments/submit', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Get all classes the student is enrolled in
        const enrolledClasses = await Class.find({ 
            students: req.user._id 
        })
        .populate('course', 'title');

        // Get all assignments for these classes with submission status
        const assignments = await Promise.all(
            enrolledClasses.map(async (classItem) => {
                const classAssignments = await Assignment.find({ 
                    class: classItem._id 
                });

                const assignmentsWithStatus = await Promise.all(
                    classAssignments.map(async (assignment) => {
                        const submission = await Submission.findOne({
                            assignment: assignment._id,
                            student: req.user._id
                        });

                        return {
                            ...assignment.toObject(),
                            className: classItem.name,
                            courseName: classItem.course.title,
                            submission: submission,
                            status: submission ? 'submitted' : 'pending',
                            isLate: submission ? false : new Date() > assignment.dueDate
                        };
                    })
                );

                return assignmentsWithStatus;
            })
        );

        // Flatten the array of arrays
        const flattenedAssignments = assignments.flat();

        // Sort by due date
        flattenedAssignments.sort((a, b) => a.dueDate - b.dueDate);

        res.render('student/submit_assignments', {
            user: req.user,
            assignments: flattenedAssignments
        });

    } catch (error) {
        console.error('Error loading assignments:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài tập',
            user: req.user
        });
    }
});

// Forum routes - Place these BEFORE any :courseId routes
router.get('/forum', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const enrolledClasses = await Class.find({
      students: req.user._id
    }).populate('course', 'title');

    const posts = await ForumPost.find({
      class: { $in: enrolledClasses.map(c => c._id) }
    })
    .populate('author', 'fullName')
    .populate('class', 'name')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'fullName'
      }
    })
    .sort({ createdAt: -1 });

    res.render('student/forum', {
      user: req.user,
      path: '/student/forum',
      posts: posts,
      classes: enrolledClasses
    });
  } catch (error) {
    console.error('Error loading forum:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi tải diễn đàn',
      user: req.user
    });
  }
});

// Create new forum post with image upload
router.post('/forum/post', 
  requireAuth, 
  requireRole('student'),
  forumUploadUpdated.array('images', 5), // Cho phép tối đa 5 ảnh
  async (req, res) => {
    try {
      console.log('Files uploaded:', req.files); // Add this for debugging
      const { title, content, classId } = req.body;
      const images = req.files ? req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        originalname: file.originalname
      })) : [];

      const newPost = await ForumPost.create({
        title,
        content,
        images,
        author: req.user._id,
        class: classId
      });

      res.redirect('/student/forum');
    } catch (error) {
      console.error('Error creating forum post:', error);
      res.status(500).render('error', {
        message: 'Có lỗi xảy ra khi tạo bài viết',
        user: req.user
      });
    }
  }
);

// Add comment to forum post
router.post('/forum/comment/:postId', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    // Validate input
    if (!content) {
      return res.status(400).json({
        message: 'Nội dung bình luận không được để trống'
      });
    }

    // Add comment to post
    await ForumPost.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            content,
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Redirect back to forum
    res.redirect('/student/forum');
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi thêm bình luận',
      user: req.user
    });
  }
});

// Edit comment route
router.post('/forum/comment/:postId/:commentId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;

        // Find the post and comment
        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        // Find and update the specific comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Bình luận không tồn tại' });
        }

        // Check comment ownership
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa bình luận này' });
        }

        // Update comment
        comment.content = content;
        comment.updatedAt = new Date();
        await post.save();

        res.redirect('/student/forum');
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ 
            message: 'Có lỗi xảy ra khi cập nhật bình luận',
            error: error.message 
        });
    }
});

// Update post
router.put('/forum/post/:postId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;
        const post = await ForumPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa bài viết này' });
        }

        await ForumPost.findByIdAndUpdate(postId, { title, content });
        res.redirect('/student/forum');
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật bài viết' });
    }
});

// Update forum post route
router.post('/forum/post/:postId', 
    requireAuth, 
    requireRole('student'),
    upload.array('images', 5),
    async (req, res) => {
        try {
            const { title, content } = req.body;
            const { postId } = req.params;

            // Find and verify post ownership
            const post = await ForumPost.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Bài viết không tồn tại' });
            }
            if (post.author.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
            }

            // Handle new images if any
            const newImages = req.files ? req.files.map(file => ({
                filename: file.filename,
                path: file.path,
                originalname: file.originalname
            })) : [];

            // Update post
            const updatedPost = await ForumPost.findByIdAndUpdate(
                postId,
                {
                    title,
                    content,
                    $push: { images: { $each: newImages } }
                },
                { new: true }
            );

            res.redirect('/student/forum');
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi cập nhật bài viết',
                error: error.message
            });
        }
    }
);

// Delete post
router.delete('/forum/post/:postId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await ForumPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền xóa bài viết này' });
        }

        await ForumPost.findByIdAndDelete(postId);
        res.json({ message: 'Xóa bài viết thành công' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Lỗi khi xóa bài viết' });
    }
});

// Update comment
router.put('/forum/comment/:postId/:commentId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;
        
        const post = await ForumPost.findById(postId);
        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền chỉnh sửa bình luận này' });
        }

        comment.content = content;
        await post.save();
        
        res.redirect('/student/forum');
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật bình luận' });
    }
});

// Delete comment
router.delete('/forum/comment/:postId/:commentId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        
        const post = await ForumPost.findById(postId);
        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền xóa bình luận này' });
        }

        post.comments.pull(commentId);
        await post.save();
        
        res.json({ message: 'Xóa bình luận thành công' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Lỗi khi xóa bình luận' });
    }
});

// View course classes for enrolled students
router.get('/:courseId/classes', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).render('error', { 
                message: 'ID khóa học không hợp lệ',
                user: req.user 
            });
        }

        // Fetch the course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).render('error', { 
                message: 'Khóa học không tồn tại',
                user: req.user 
            });
        }

        // Check if student is enrolled in this course
        const isEnrolled = course.enrolledStudents.includes(req.user._id);
        if (!isEnrolled) {
            return res.status(403).render('error', { 
                message: 'Bạn cần đăng ký khóa học này để xem danh sách lớp học',
                user: req.user 
            });
        }

        // Fetch all classes associated with the course and populate necessary fields
        const classes = await Class.find({ course: courseId })
            .populate('teacher', 'fullName email')
            .populate({
                path: 'students',
                select: '_id'
            })
            .populate({
                path: 'pendingRequests',
                select: '_id'
            });

        res.render('student/courseClasses', { 
            user: req.user,
            course,
            classes,
            userEnrolled: true,
            path: '/student/courses',
            studentId: req.user._id.toString()
        });
    } catch (err) {
        console.error('Error fetching course classes:', err);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải danh sách lớp học',
            user: req.user 
        });
    }
});

// Request to join a class
router.post('/classes/:classId/join', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = req.user._id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ 
                success: false,
                message: 'ID lớp học không hợp lệ' 
            });
        }

        // Find the class
        const classItem = await Class.findById(classId);
        if (!classItem) {
            return res.status(404).json({ 
                success: false,
                message: 'Lớp học không tồn tại' 
            });
        }

        // Check if class is full
        if (classItem.students.length >= classItem.maxStudents) {
            return res.status(400).json({
                success: false,
                message: 'Lớp học đã đầy'
            });
        }

        // Check if user is already enrolled or has pending request
        if (classItem.students.includes(userId)) {
            return res.status(400).json({
                success: false, 
                message: 'Bạn đã tham gia lớp học này'
            });
        }
        
        if (classItem.pendingRequests.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu tham gia của bạn đang chờ phê duyệt'
            });
        }

        // Add user to pendingRequests
        classItem.pendingRequests.push(userId);
        await classItem.save();

        res.json({
            success: true,
            message: 'Yêu cầu tham gia lớp học đã được gửi'
        });

    } catch (error) {
        console.error('Error joining class:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi gửi yêu cầu'
        });
    }
});

// Add this route for SSE notifications
router.get('/notifications', requireAuth, requireRole('student'), (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.user.id;
  
  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  // Listen for notifications
  const sendNotification = (notification) => {
    if (notification.user.toString() === userId) {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  };

  // Clean up on close
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

router.get('/class/:id', async (req, res) => {
    try {
        const classId = req.params.id;

        // Lấy thông tin lớp học
        const classData = await Class.findById(classId)
            .populate('course')
            .populate('students', 'fullName email');

        if (!classData) {
            return res.status(404).render('error', { message: 'Không tìm thấy lớp học' });
        }

        // Render trang chi tiết lớp học
        res.render('student/student_class', {
            user: req.user || null, // Nếu không có `req.user`, truyền `null`
            classData
        });
    } catch (err) {
        console.error('Error fetching class details:', err);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải thông tin lớp học' });
    }
});

router.get('/class_student/:id', async (req, res) => {
    try {
        const classId = req.params.id;
        const studentId = req.user._id;

        const classData = await Class.findById(classId)
            .populate('course')
            .populate('teacher', 'fullName email');

        if (!classData) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy lớp học',
                user: req.user 
            });
        }

        // Get assignments with submissions
        const assignments = await Assignment.find({ class: classId });
        const submissionPromises = assignments.map(async (assignment) => {
            const submission = await Submission.findOne({
                assignment: assignment._id,
                student: studentId
            });
            return {
                ...assignment.toObject(),
                studentSubmission: submission
            };
        });

        const assignmentsWithSubmissions = await Promise.all(submissionPromises);

        // Get class documents
        const documents = await Document.find({ class: classId })
            .sort({ uploadedAt: -1 });

        res.render('student/student_class', {
            user: req.user,
            classData,
            assignments: assignmentsWithSubmissions,
            documents // Pass documents to the template
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra',
            user: req.user 
        });
    }
});

// Route to view submission files
router.get('/view-submission/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../public/uploads/assignments', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Set headers for inline viewing
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4'
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error viewing file:', error);
        res.status(500).send('Error viewing file');
    }
});

// Add download route
router.get('/download-submission/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../public/uploads/assignments', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Get file extension
        const ext = path.extname(filename).toLowerCase();
        
        // Set content type based on file extension
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4'
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
});

// Add this route for document downloads
router.get('/documents/:id/download', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy tài liệu',
                user: req.user
            });
        }

        const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).render('error', {
                message: 'File không tồn tại',
                user: req.user
            });
        }

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName || document.fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

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

// Use this middleware in your submission route


router.get('/resources', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Get all classes the student is enrolled in
        const enrolledClasses = await Class.find({
            students: req.user._id
        })
        .populate('course', 'title')
        .lean();

        // Get documents for these classes
        const classesWithDocs = await Promise.all(enrolledClasses.map(async (classItem) => {
            const documents = await Document.find({ 
                class: classItem._id 
            })
            .sort({ uploadedAt: -1 })
            .lean();

            return {
                ...classItem,
                documents
            };
        }));

        res.render('student/resources', {
            user: req.user,
            classesWithDocs
        });
    } catch (error) {
        console.error('Error loading resources:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải tài liệu',
            user: req.user
        });
    }
});

// Add this new route
router.get('/assignments/submit', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Get all classes the student is enrolled in
        const enrolledClasses = await Class.find({ 
            students: req.user._id 
        })
        .populate('course', 'title');

        // Get all assignments for these classes with submission status
        const assignments = await Promise.all(
            enrolledClasses.map(async (classItem) => {
                const classAssignments = await Assignment.find({ 
                    class: classItem._id 
                });

                const assignmentsWithStatus = await Promise.all(
                    classAssignments.map(async (assignment) => {
                        const submission = await Submission.findOne({
                            assignment: assignment._id,
                            student: req.user._id
                        });

                        return {
                            ...assignment.toObject(),
                            className: classItem.name,
                            courseName: classItem.course.title,
                            submission: submission,
                            status: submission ? 'submitted' : 'pending',
                            isLate: submission ? false : new Date() > assignment.dueDate
                        };
                    })
                );

                return assignmentsWithStatus;
            })
        );

        // Flatten the array of arrays
        const flattenedAssignments = assignments.flat();

        // Sort by due date
        flattenedAssignments.sort((a, b) => a.dueDate - b.dueDate);

        res.render('student/submit_assignments', {
            user: req.user,
            assignments: flattenedAssignments
        });

    } catch (error) {
        console.error('Error loading assignments:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài tập',
            user: req.user
        });
    }
});

router.get('/student/assignments/:id/view', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.user._id;

        const submission = await Submission.findOne({
            assignment: assignmentId,
            student: studentId
        }).populate({
            path: 'assignment',
            populate: {
                path: 'class',
                populate: 'course'
            }
        });

        if (!submission) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài nộp',
                user: req.user
            });
        }

        // Helper functions for file icons
        const getFileIcon = (fileType) => {
            const fileTypeMap = {
                'pdf': 'fa-file-pdf',
                'doc': 'fa-file-word',
                'docx': 'fa-file-word',
                'jpg': 'fa-file-image',
                'jpeg': 'fa-file-image',
                'png': 'fa-file-image',
                'mp3': 'fa-file-audio',
                'mp4': 'fa-file-video',
                'default': 'fa-file'
            };
            return fileTypeMap[fileType?.toLowerCase()] || fileTypeMap.default;
        };

        const getFileIconStyle = (fileType) => {
            const fileTypeStyles = {
                'pdf': 'background: linear-gradient(135deg, #ef4444, #f87171);',
                'doc': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'docx': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'jpg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'jpeg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'png': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'mp3': 'background: linear-gradient(135deg, #8b5cf6, #a78bfa);',
                'mp4': 'background: linear-gradient(135deg, #f59e0b, #fbbf24);',
                'default': 'background: linear-gradient(135deg, #6b7280, #9ca3af);'
            };
            return fileTypeStyles[fileType?.toLowerCase()] || fileTypeStyles.default;
        };

        res.render('student/view_submission', {
            user: req.user,
            submission: submission,
            getFileIcon,
            getFileIconStyle
        });

    } catch (error) {
        console.error('Error viewing submission:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xem bài nộp',
            user: req.user
        });
    }
});

router.get('/assignments/:assignmentId/view', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        const studentId = req.user._id;

        // Find the submission
        const submission = await Submission.findOne({
            assignment: assignmentId,
            student: studentId
        }).populate({
            path: 'assignment',
            populate: {
                path: 'class',
                populate: {
                    path: 'course'
                }
            }
        });

        if (!submission) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài nộp',
                user: req.user
            });
        }

        // Helper functions for file icons
        const getFileIcon = (fileType) => {
            const fileTypeMap = {
                'pdf': 'fa-file-pdf',
                'doc': 'fa-file-word',
                'docx': 'fa-file-word',
                'jpg': 'fa-file-image',
                'jpeg': 'fa-file-image',
                'png': 'fa-file-image',
                'mp3': 'fa-file-audio',
                'mp4': 'fa-file-video',
                'default': 'fa-file'
            };
            return fileTypeMap[fileType?.toLowerCase()] || fileTypeMap.default;
        };

        const getFileIconStyle = (fileType) => {
            const fileTypeStyles = {
                'pdf': 'background: linear-gradient(135deg, #ef4444, #f87171);',
                'doc': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'docx': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'jpg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'jpeg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'png': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'mp3': 'background: linear-gradient(135deg, #8b5cf6, #a78bfa);',
                'mp4': 'background: linear-gradient(135deg, #f59e0b, #fbbf24);',
                'default': 'background: linear-gradient(135deg, #6b7280, #9ca3af);'
            };
            return fileTypeStyles[fileType?.toLowerCase()] || fileTypeStyles.default;
        };

        res.render('student/view_submission', {
            user: req.user,
            submission: submission,
            assignment: submission.assignment, // Pass the assignment data
            getFileIcon,
            getFileIconStyle
        });

    } catch (error) {
        console.error('Error viewing submission:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xem bài nộp',
            user: req.user
        });
    }
});

// Fix the assignments routes
router.get('/assignments/:id/Exercise', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const assignmentId = req.params.id;
        
        // Validate if assignmentId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).render('error', {
                message: 'ID bài tập không hợp lệ',
                user: req.user
            });
        }

        // Find the assignment and populate class details
        const assignment = await Assignment.findById(assignmentId)
            .populate({
                path: 'class',
                populate: {
                    path: 'course'
                }
            });

        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài tập',
                user: req.user
            });
        }

        // Find existing submission
        const submission = await Submission.findOne({
            assignment: assignmentId,
            student: req.user._id
        });

        // Check if assignment is overdue
        const currentTime = new Date();
        const isOverdue = currentTime > assignment.dueDate;
        const timeRemaining = assignment.dueDate - currentTime;
        
        // Check if submission is allowed
        const canSubmit = !isOverdue && !submission;

        // Helper functions for file icons
        const getFileIcon = (fileType) => {
            const fileTypeMap = {
                'pdf': 'fa-file-pdf',
                'doc': 'fa-file-word',
                'docx': 'fa-file-word',
                'jpg': 'fa-file-image',
                'jpeg': 'fa-file-image',
                'png': 'fa-file-image',
                'mp3': 'fa-file-audio',
                'mp4': 'fa-file-video',
                'default': 'fa-file'
            };
            return fileTypeMap[fileType?.toLowerCase()] || fileTypeMap.default;
        };

        const getFileIconStyle = (fileType) => {
            const fileTypeStyles = {
                'pdf': 'background: linear-gradient(135deg, #ef4444, #f87171);',
                'doc': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'docx': 'background: linear-gradient(135deg, #3b82f6, #60a5fa);',
                'jpg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'jpeg': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'png': 'background: linear-gradient(135deg, #10b981, #34d399);',
                'mp3': 'background: linear-gradient(135deg, #8b5cf6, #a78bfa);',
                'mp4': 'background: linear-gradient(135deg, #f59e0b, #fbbf24);',
                'default': 'background: linear-gradient(135deg, #6b7280, #9ca3af);'
            };
            return fileTypeStyles[fileType?.toLowerCase()] || fileTypeStyles.default;
        };

        res.render('student/submit_exercise', {
            user: req.user,
            assignment,
            submission,
            isOverdue,
            canSubmit,
            timeRemaining,
            getFileIcon,
            getFileIconStyle
        });
    } catch (error) {
        console.error('Error loading assignment submission page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang nộp bài tập',
            user: req.user
        });
    }
});

// Fix the submission route
router.post('/assignments/:id/submit', requireAuth, requireRole('student'), upload.single('file'), async (req, res) => {
    try {
        const assignmentId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).render('error', {
                message: 'ID bài tập không hợp lệ',
                user: req.user
            });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy bài tập',
                user: req.user
            });
        }

        // Check if assignment is past due date - PREVENT LATE SUBMISSIONS
        const currentTime = new Date();
        if (currentTime > assignment.dueDate) {
            return res.status(400).render('error', {
                message: 'Không thể nộp bài tập! Đã quá hạn nộp bài.',
                error: `Hạn nộp: ${assignment.dueDate.toLocaleString('vi-VN')}`,
                user: req.user
            });
        }

        // Check if student already submitted this assignment
        const existingSubmission = await Submission.findOne({
            assignment: assignmentId,
            student: req.user._id
        });

        if (existingSubmission) {
            return res.status(400).render('error', {
                message: 'Bạn đã nộp bài tập này rồi!',
                error: 'Không thể nộp lại bài tập đã nộp.',
                user: req.user
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).render('error', {
                message: 'Vui lòng chọn file để nộp',
                user: req.user
            });
        }

        // Create new submission
        const submission = new Submission({
            student: req.user._id,
            assignment: assignmentId,
            fileName: req.file.filename,
            fileType: path.extname(req.file.originalname).substring(1),
            submittedAt: new Date()
        });

        await submission.save();
        res.redirect(`/student/assignments/${assignmentId}/Exercise`);
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi nộp bài tập',
            user: req.user
        });
    }
});

router.delete('/delete-submission/:id', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const submission = await Submission.findOne({
            assignment: req.params.id,
            student: req.user._id
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài nộp'
            });
        }

        // Check if submission has been graded
        if (submission.grade && submission.grade.score !== undefined) {
            return res.status(403).json({
                success: false,
                error: 'ALREADY_GRADED',
                message: 'Không thể hủy bài đã được chấm điểm'
            });
        }

        // Delete the file
        const filePath = path.join(__dirname, '../../public/uploads/assignments', submission.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete the submission record
        await submission.deleteOne();

        res.json({
            success: true,
            message: 'Đã hủy nộp bài thành công'
        });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi hủy nộp bài'
        });
    }
});

router.get('/check-submission/:id', requireAuth, requireRole('student'), async (req, res) => {
    try {
        const submission = await Submission.findOne({
            assignment: req.params.id,
            student: req.user._id
        });

        if (!submission) {
            return res.json({ canDelete: false });
        }

        // Can delete if submission has no grade or grade.score is undefined
        const canDelete = !submission.grade || !submission.grade.score;

        res.json({ canDelete });
    } catch (error) {
        console.error('Error checking submission status:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi kiểm tra trạng thái bài nộp'
        });
    }
});

// Forum routes - Update the path to match /dashboard/student/forum
router.get('/dashboard/forum', requireAuth, requireRole('student'), async (req, res) => {
  try {
    // Get all classes the student is enrolled in
    const enrolledClasses = await Class.find({
      students: req.user._id
    }).populate('course', 'title');

    // Get forum posts for these classes
    const posts = await ForumPost.find({
      class: { $in: enrolledClasses.map(c => c._id) }
    })
    .populate('author', 'fullName')
    .populate('class', 'name')
    .populate({
      path: 'comments.author',
      select: 'fullName'
    })
    .sort({ createdAt: -1 });

    res.render('student/forum', {
      user: req.user,
      classes: enrolledClasses,
      posts: posts
    });
  } catch (error) {
    console.error('Error loading forum:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi tải diễn đàn',
      user: req.user
    });
  }
});

// Update other forum-related routes
router.post('/dashboard/forum/post', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { title, content, classId } = req.body;

    const newPost = await ForumPost.create({
      title,
      content,
      author: req.user._id,
      class: classId
    });

    res.redirect('/dashboard/forum');
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi tạo bài viết',
      user: req.user
    });
  }
});

router.post('/dashboard/forum/comment/:postId', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;

    await ForumPost.findByIdAndUpdate(postId, {
      $push: {
        comments: {
          content,
          author: req.user._id
        }
      }
    });

    res.redirect('/dashboard/forum');
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi thêm bình luận',
      user: req.user
    });
  }
});

// Add this route
router.get('/dashboard', requireAuth, requireRole('student'), getStudentDashboard);

// Add this route before other parameterized routes
router.get('/invoices/:invoiceId', requireAuth, requireRole('student'), async (req, res) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.invoiceId)) {
            return res.status(400).render('error', {
                message: 'ID hóa đơn không hợp lệ',
                user: req.user
            });
        }

        const invoice = await Invoice.findById(req.params.invoiceId)
            .populate({
                path: 'course',
                populate: {
                    path: 'instructor',
                    select: 'fullName email'
                }
            })
            .populate('student', 'fullName email phone');

        if (!invoice) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy hóa đơn',
                user: req.user
            });
        }

        // Verify invoice belongs to current user
        if (invoice.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền xem hóa đơn này',
                user: req.user
            });
        }

        res.render('student/invoice', {
            user: req.user,
            invoice: invoice,
            course: invoice.course
        });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải hóa đơn',
            user: req.user
        });
    }
});

module.exports = router;

