const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const flash = require('connect-flash');
require('./src/config/passport');
dotenv.config();
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const authRoutes = require('./src/routes/authRoutes');
const systemManagementRoutes = require('./src/routes/systemManagementRoutes');
const accountManagementRoutes = require('./src/routes/accountManagementRoutes');
const reportsRoutes = require('./src/routes/reportsRoutes');
const courseManagementRoutes = require('./src/routes/courseManagementRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const vocabularySeederRoutes = require('./src/routes/vocabularySeeder');

const userRoutes = require('./src/routes/userRoutes');
const User = require('./src/models/User');
const teacherRoutes = require('./src/routes/teacherRoutes');
const studentRoutes = require('./src/routes/studentRoutes'); // Correct path
const assignmentRoutes = require('./src/routes/assignmentRoutes');
// Update this line
const materialRoutes = require('./src/routes/materialRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const messageRoutes = require('./src/routes/messageRoutes'); // Updated path
const errorHandler = require('./src/middleware/errorMiddleware');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const faqChatbotRoutes = require('./src/routes/faqChatbotRoutes');
const classTestRoutes = require('./src/routes/classTestRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');


// Middleware kiểm tra role teacher
const isTeacher = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'teacher') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure views directory structure
const viewsPath = path.join(__dirname, 'views');
const requiredDirs = ['student', 'teacher', 'admin', 'partials'];

requiredDirs.forEach(dir => {
    const dirPath = path.join(viewsPath, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Create necessary directories if they don't exist
const directories = [
    'public',
    'public/uploads',
    'public/uploads/vocabulary',
    'public/uploads/materials',
    'public/images'
];

directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/vocabulary', express.static(path.join(__dirname, 'public/uploads/vocabulary')));
app.use('/uploads/materials', express.static(path.join(__dirname, 'public/uploads/materials')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Đảm bảo middleware được thêm trước khi định nghĩa routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cập nhật static file middleware
app.use('/uploads/courses', express.static(path.join(__dirname, 'public/uploads/courses')));

// Thêm đường dẫn mới và giữ đường dẫn cũ
app.use('/admin/course-management', courseManagementRoutes);

// Add debug middleware to log file requests
app.use((req, res, next) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        console.log('Image requested:', req.url);
        console.log('Full path:', path.join(__dirname, 'public', req.url));
    }
    next();
});

// Increase payload size limit if needed
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Add flash messages to all responses
app.use((req, res, next) => {
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    next();
});

// Add currentPath to all responses
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware kiểm tra user cho toàn bộ route admin


const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  // Remove deprecated options
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected...');
  // Start the server only if the database connection is successful
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
})
.catch((err) => {
  console.error('Failed to connect to the database', err);
  process.exit(1); // Exit the process with failure
});

const homeRoutes = require('./src/routes/homeRoutes');
app.use('/', homeRoutes);

app.get('/courses', async (req, res) => {
    try {
        const Course = require('./src/models/Course');
        
        // Fetch all courses
        const courses = await Course.find()
            .populate('instructor', 'fullName')
            .sort({ createdAt: -1 });

        // Get enrolled courses for logged-in user
        const userEnrolledIds = req.user ? 
            courses
                .filter(c => c.enrolledStudents && c.enrolledStudents.includes(req.user._id))
                .map(c => c._id.toString()) 
            : [];

        // Render the courses page
        res.render('student/courses', { 
            user: req.user || null,
            courses,
            userEnrolledIds,
            currentUrl: '/courses'
        });

    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải danh sách khóa học', 
            error: err.message,
            user: req.user 
        });
    }
});

// Add this AFTER the /courses route but BEFORE other routes
app.get('/courses/:courseId', async (req, res) => {
    try {
        const Course = require('./src/models/Course');
        const Class = require('./src/models/class');
        
        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
            return res.status(400).render('error', {
                message: 'ID khóa học không hợp lệ',
                user: req.user
            });
        }

        // Fetch course details
        const course = await Course.findById(req.params.courseId)
            .populate('instructor', 'fullName email');

        if (!course) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy khóa học',
                user: req.user
            });
        }

        // Fetch classes for this course
        const classes = await Class.find({ 
            course: req.params.courseId,
            status: 'active'
        })
        .populate('teacher', 'fullName email')
        .populate({
            path: 'students',
            select: '_id' // Only get student IDs for comparison
        })
        .populate({
            path: 'pendingRequests',
            select: '_id'
        });

        // Change this line from courseDetails to courseClasses
        res.render('student/courseClasses', {
            user: req.user,
            course,
            classes,
            currentUrl: `/courses/${course._id}`,
            isEnrolled: req.user ? course.enrolledStudents.includes(req.user._id) : false,
            studentId: req.user ? req.user._id.toString() : null
        });

    } catch (err) {
        console.error('Error fetching course details:', err);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải thông tin khóa học',
            error: err.message,
            user: req.user
        });
    }
});
// Keep other routes in the correct order
app.use('/student', studentRoutes); 
app.use('/', authRoutes);
app.use('/', courseRoutes);
app.use('/system-management', systemManagementRoutes);
app.use('/admin/reports', reportsRoutes);
app.use('/reports', reportsRoutes);
app.use('/', teacherRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', assignmentRoutes);
app.use('/teacher', materialRoutes);
app.use('/', paymentRoutes);
app.use('/', messageRoutes);
app.use('/', chatbotRoutes); // Add this line for chatbot routes
app.use('/api', faqChatbotRoutes); // Add this line for FAQ chatbot routes
app.use('/', classTestRoutes); // Add this line for class test routes
app.use('/attendance', attendanceRoutes); // Add this line for attendance routes
app.use('/api/vocabulary', vocabularySeederRoutes); // Add vocabulary seeder routes

// Vocabulary View Route
app.get('/vocabulary-view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vocabulary-view.html'));
});

// Account management
app.use('/account-management', accountManagementRoutes);


// Error handling
app.use(errorHandler);

// Use the account management routes
app.use('/account-management', accountManagementRoutes);

app.get('/dashboard/admin', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  
  try {
    const User = require('./src/models/User');
    const Course = require('./src/models/Course');
    const Class = require('./src/models/class');
    const Invoice = require('./src/models/Invoice');
    
    // Lấy thống kê tổng quan
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalClasses = await Class.countDocuments();
    
    // Lấy tổng doanh thu
    const revenueStats = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    
    // Lấy thống kê đăng ký theo ngày (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const registrationStats = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Lấy người dùng mới nhất
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role createdAt');
    
    const dashboardData = {
      totalUsers,
      totalCourses,
      totalClasses,
      totalRevenue,
      registrationStats,
      recentUsers
    };
    
    res.render('dashboards/admin', { 
      user: req.session.user, 
      dashboardData 
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.render('dashboards/admin', { 
      user: req.session.user,
      dashboardData: {
        totalUsers: 406,
        totalCourses: 3,
        totalClasses: 3,
        totalRevenue: 47500000,
        registrationStats: [],
        recentUsers: []
      }
    });
  }
});
app.get('/dashboard/teacher', isTeacher, async (req, res) => {
    try {
        const Course = require('./src/models/Course');
        const Class = require('./src/models/class');

        // Lấy số lượng khóa học của giáo viên
        const courses = await Course.find({ instructor: req.user._id });
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course')
            .populate('students')
            .limit(5);

        res.render('dashboards/teacher', { 
            user: req.user,
            courses: courses,
            classes: classes,
            courseCount: courses.length
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang dashboard'
        });
    }
});

app.get('/teacher/courses/new', isTeacher, async (req, res) => {
    try {
        const Course = require('./src/models/Course');
        const courseId = req.query.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).render('error', {
                message: 'Khóa học không tồn tại'
            });
        }

        res.render('teacher/new_class', { 
            user: req.user,
            course: course
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tạo lớp học'
        });
    }
});

app.get('/dashboard/student', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.redirect('/login');
  }

  try {
    // Import required models
    const Class = require('./src/models/class');
    const Assignment = require('./src/models/Assignment');
    const Submission = require('./src/models/submission');
    const Course = require('./src/models/Course');
    
    const studentId = req.session.user.id;
    
    // Lấy thông tin chi tiết của student
    const student = await User.findById(studentId)
      .populate('progress.completedCourses');

    // Lấy các lớp học mà student đã tham gia
    const enrolledClasses = await Class.find({ 
      students: studentId,
      status: 'active'
    })
    .populate('course', 'title description imageUrl')
    .populate('teacher', 'fullName email')
    .limit(5);

    // Lấy assignments gần đây
    const recentAssignments = await Assignment.find({
      class: { $in: enrolledClasses.map(c => c._id) }
    })
    .populate('class', 'name')
    .sort({ dueDate: 1 })
    .limit(5);

    // Lấy submissions của student
    const submissions = await Submission.find({
      student: studentId
    })
    .populate('assignment', 'title maxScore class')
    .sort({ submittedAt: -1 })
    .limit(10);

    // Lấy các khóa học có sẵn để đăng ký
    const availableCourses = await Course.find({
      status: 'active'
    })
    .populate('instructor', 'fullName')
    .sort({ enrolledCount: -1 })
    .limit(6);

    // Tính toán progress statistics
    const progressStats = {
      totalCourses: enrolledClasses.length,
      completedLessons: 0, // Tạm thời để 0 vì chưa có model Lesson
      totalPoints: student.progress?.totalPoints || 0,
      averageGrade: 0
    };

    // Tính điểm trung bình
    const gradedSubmissions = submissions.filter(s => s.grade && s.grade.score !== undefined);
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.grade.score, 0);
      const totalMaxScore = gradedSubmissions.reduce((sum, s) => sum + s.grade.maxScore, 0);
      progressStats.averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore * 100) : 0;
    }

    // Lấy recent activities
    const recentActivities = [
      ...submissions.slice(0, 3).map(s => ({
        type: 'submission',
        message: `Đã nộp bài tập "${s.assignment.title}"`,
        time: s.submittedAt,
        icon: 'fas fa-file-upload',
        color: 'blue'
      })),
      ...enrolledClasses.slice(0, 2).map(c => ({
        type: 'enrollment',
        message: `Đã tham gia lớp "${c.name}"`,
        time: c.createdAt || new Date(),
        icon: 'fas fa-user-plus',
        color: 'green'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    const dashboardData = {
      student,
      enrolledClasses,
      recentAssignments,
      submissions,
      availableCourses,
      progressStats,
      recentActivities
    };

    res.render('dashboards/student', { 
      user: req.session.user,
      dashboardData
    });

  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.render('dashboards/student', { 
      user: req.session.user,
      dashboardData: null,
      error: 'Không thể tải dữ liệu dashboard'
    });
  }
});

app.post('/course-management/courses', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).send('Title and Description are required');
  }
  // ...existing code to save the course...
});

app.post('/teacher/classes', isTeacher, upload.single('classImage'), async (req, res) => {
    try {
        const { courseId, className, description, startDate, endDate, maxStudents } = req.body;
        const Class = require('./src/models/class');

        const startDateValue = new Date(startDate);
        const endDateValue = new Date(endDate);

        if (!courseId || !className || description || isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime()) || !maxStudents) {
            return res.status(400).render('error', {
                message: 'Vui lòng điền đầy đủ thông tin và đảm bảo ngày hợp lệ'
            });
        }

        const newClass = new Class({
            name: className,
            course: courseId,
            teacher: req.user._id,
            description: description,
            startDate: startDateValue,
            endDate: endDateValue,
            schedule: {
                days: ['Monday', 'Wednesday'], // Example schedule
                time: '10:00 AM - 12:00 PM' // Example time
            },
            maxStudents: parseInt(maxStudents),
            classImage: req.file ? req.file.filename : '', // Save the filename of the uploaded image
        });

        await newClass.save();

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tạo lớp học'
        });
    }
});

app.get('/teacher/classes', isTeacher, async (req, res) => {
    try {
        const Class = require('./src/models/class');
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course')
            .populate('students');

        res.render('teacher/list_classes', { 
            user: req.user,
            classes: classes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tất cả lớp học'
        });
    }
});

app.post('/teacher/classes/:id/edit', isTeacher, upload.single('classImage'), async (req, res) => {
    try {
        const { className, description, startDate, endDate, maxStudents } = req.body;
        const Class = require('./src/models/class');
        const classId = req.params.id;

        const startDateValue = new Date(startDate);
        const endDateValue = new Date(endDate);

        if (isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime())) {
            return res.status(400).render('error', {
                message: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ'
            });
        }

        const updatedClass = await Class.findByIdAndUpdate(classId, {
            name: className,
            description: description,
            startDate: startDateValue,
            endDate: endDateValue,
            schedule: {
                days: ['Monday', 'Wednesday'], // Example schedule
                time: '10:00 AM - 12:00 PM' // Example time
            },
            maxStudents: parseInt(maxStudents),
            classImage: req.file ? req.file.filename : '', // Save the filename of the uploaded image
        }, { new: true });

        if (!updatedClass) {
            return res.status(404).render('error', {
                message: 'Lớp học không tồn tại'
            });
        }

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi chỉnh sửa lớp học'
        });
    }
});

app.post('/teacher/classes/:id/edit', isTeacher, async (req, res) => {
    try {
        const classId = req.params.id;
        res.redirect(`/teacher/classes/${classId}/edit`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi chuyển hướng đến trang chỉnh sửa lớp học'
        });
    }
});

app.post('/teacher/classes/:id/delete', isTeacher, async (req, res) => {
    try {
        const Class = require('./src/models/class');
        const classId = req.params.id;

        const deletedClass = await Class.findByIdAndDelete(classId);

        if (!deletedClass) {
            return res.status(404).render('error', {
                message: 'Lớp học không tồn tại'
            });
        }

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xóa lớp học'
        });
    }
});

app.get('/teacher/add_assignment', isTeacher, async (req, res) => {
    try {
        const Class = require('./src/models/class');
        const classes = await Class.find({ teacher: req.user._id });

        res.render('teacher/add_assignment', { 
            user: req.user,
            classes: classes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang thêm bài tập'
        });
    }
});

app.post('/teacher/assignments', isTeacher, async (req, res) => {
    try {
        const { classId, title, description, dueDate } = req.body;
        const Assignment = require('./src/models/Assignment');

        if (!classId || !title || !description || !dueDate) {
            return res.status(400).render('error', {
                message: 'Vui lòng điền đầy đủ thông tin bài tập'
            });
        }

        const newAssignment = new Assignment({
            class: classId,
            title: title,
            description: description,
            dueDate: new Date(dueDate),
            createdBy: req.user._id
        });

        await newAssignment.save();

        res.redirect('/dashboard/teacher');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tạo bài tập'
        });
    }
});

app.get('/teacher/assignments', isTeacher, async (req, res) => {
    try {
        const Assignment = require('./src/models/Assignment');
        const assignments = await Assignment.find({ createdBy: req.user._id })
            .populate('class', 'name')
            .sort({ dueDate: 1 });

        res.render('teacher/assignments', { 
            user: req.user,
            assignments: assignments
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách bài tập'
        });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log('User joined room:', userId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Export io instance
app.io = io;

// Middleware xử lý lỗi multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn. Kích thước tối đa là 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Lỗi upload file: ' + err.message
        });
    }
    next(err);
});

// Middleware xử lý lỗi chung
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra từ server: ' + err.message
    });
});

// Add this after your routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra từ máy chủ'
    });
});

// Add this before other error handling middleware
app.use(express.json());

// Add body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure static file serving is configured - uploads should point to public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/vocabulary', express.static(path.join(__dirname, 'public/uploads/vocabulary')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use('/', messageRoutes);

// Error handling
app.use(errorHandler);

// Add routes
const forgotPasswordRoutes = require('./src/routes/forgotPasswordRoutes');

// Add these lines if not already present
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add the routes
app.use(forgotPasswordRoutes);

// Add student account routes

module.exports = app;

 
