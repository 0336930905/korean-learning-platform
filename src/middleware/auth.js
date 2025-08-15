// Middleware kiểm tra đăng nhập
const ensureAuthenticated = (req, res, next) => {
    // Check both passport and session authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Middleware kiểm tra quyền admin
const ensureAdmin = (req, res, next) => {
    console.log('🔒 Checking admin access...');
    console.log('📊 Request user (passport):', req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : 'No passport user');
    console.log('📊 Session user:', req.session.user ? { id: req.session.user._id, email: req.session.user.email, role: req.session.user.role } : 'No session user');
    
    // Check passport user first
    if (req.user && req.user.role === 'admin') {
        console.log('✅ Admin access granted via passport');
        return next();
    }
    
    // Check session user
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        console.log('✅ Admin access granted via session');
        return next();
    }
    
    console.log('❌ Admin access denied - redirecting to login');
    // Redirect to login with return URL
    return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
};

// Middleware kiểm tra quyền giáo viên
const ensureTeacher = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
    });
};

// Middleware kiểm tra quyền truy cập lớp học
const ensureClassAccess = (req, res, next) => {
    if (!classData.students.some(student => student._id.toString() === req.user._id.toString())) {
        return res.status(403).render('error', {
            message: 'Bạn không có quyền truy cập lớp học này'
        });
    }
    next();
};

// Middleware kiểm tra quyền giáo viên
const isTeacher = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'teacher') {
        next();
    } else {
        res.status(401).redirect('/login');
    }
};

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

// Export các middleware
module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    ensureTeacher,
    ensureClassAccess,
    isTeacher,
    requireAuth
};