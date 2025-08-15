const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Thêm import này
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Multer configuration for profile images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Route chính
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        // Lấy danh sách users
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        // Lấy thống kê
        const stats = await userController.getStats();
        
        console.log('Stats data:', stats); // Debug
        
        res.render('admin/accountManagement', { 
            users,
            user: req.user,
            stats
        });
        
    } catch (err) {
        console.error('Route error:', err);
        res.status(500).render('admin/accountManagement', { 
            users: [],
            user: req.user,
            stats: {
                totalUsers: 0,
                adminCount: 0,
                teacherCount: 0,
                studentCount: 0,
                activeUsers: 0,
                inactiveUsers: 0,
                adminPercentage: '0.0',
                teacherPercentage: '0.0',
                studentPercentage: '0.0',
                newUsersThisWeek: 0,
                newUsersThisMonth: 0,
                monthGrowthRate: '0.0',
                weekGrowthRate: '0.0'
            }
        });
    }
});

// API stats
router.get('/api/stats', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const stats = await userController.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats API error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thống kê'
        });
    }
});

// Hiển thị form thêm user - Both routes for compatibility
router.get('/addUser', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/addUser', {
        user: req.user,
        error: null,
        formData: {}
    });
});

router.get('/add', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/addUser', {
        user: req.user,
        error: null,
        formData: {}
    });
});

// Xử lý thêm user
router.post('/add', ensureAuthenticated, ensureAdmin, userController.addUser);

// Xử lý xóa user
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, userController.deleteUser);

// Route toggle user status - Sử dụng userController
router.post('/toggle-status/:id', ensureAuthenticated, ensureAdmin, userController.toggleUserStatus);

// Hiển thị form edit
router.get('/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const userToEdit = await User.findById(req.params.id);
        if (!userToEdit) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy người dùng'
            });
        }
        res.render('admin/editUser', {
            user: req.user,           // Current logged-in user for sidebar/header
            userToEdit: userToEdit,   // User being edited
            csrfToken: req.csrfToken ? req.csrfToken() : '', // Add CSRF token
            error: null
        });
    } catch (error) {
        res.status(500).render('error', {
            message: 'Lỗi khi tải thông tin người dùng'
        });
    }
});

// Xử lý edit user - với multer middleware
router.post('/edit/:id', ensureAuthenticated, ensureAdmin, upload.single('profileImage'), userController.editUser);

router.get('/view/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const user = await userController.getUserById(req.params.id);
        const users = await userController.getAllUsers();
        const stats = await userController.getStats();
        
        res.render('admin/accountManagement', { 
            user: req.user,
            users, 
            viewUser: user,
            stats
        });
    } catch (error) {
        console.error('View user error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi xem thông tin người dùng'
        });
    }
});

router.get('/search', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { searchTerm, role } = req.query;
        let query = {};
        if (searchTerm) {
            query.$or = [
                { email: { $regex: searchTerm, $options: 'i' } },
                { fullName: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        const stats = await userController.getStats();
        
        res.render('admin/accountManagement', { 
            user: req.user, 
            users,
            stats
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tìm kiếm'
        });
    }
});

router.get('/reports', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/reports', { user: req.session.user });
});

// Route xem chi tiết tài khoản
router.get('/viewAccount/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const viewUser = await User.findById(req.params.id).select('-password');
        if (!viewUser) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy tài khoản'
            });
        }
        res.render('admin/viewAccount', { 
            user: req.user,      // Current logged-in user for sidebar/header
            viewUser: viewUser   // User being viewed
        });
    } catch (err) {
        console.error('Lỗi khi xem chi tiết tài khoản:', err);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải thông tin tài khoản'
        });
    }
});

router.get('/account-management', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const users = await User.find(); // Fetch users from the database
        res.render('admin/accountManagement', { 
            users, 
            user: req.user // Pass the logged-in user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Fix the add user routes
router.get('/add', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/addUser', {
        user: req.user,
        error: null,
        formData: {}
    });
});

// Đặt lại mật khẩu
router.post('/reset-password/:userId', ensureAuthenticated, ensureAdmin, userController.resetPassword);

// Đổi mật khẩu (cho modal)
router.post('/change-password/:userId', ensureAuthenticated, ensureAdmin, userController.changePassword);

// Bulk actions
router.post('/bulk-action', ensureAuthenticated, ensureAdmin, userController.bulkAction);

// Xuất dữ liệu một user
router.get('/export-user/:userId', ensureAuthenticated, ensureAdmin, userController.exportUserData);

// Xuất tất cả user
router.get('/export-all-users', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('All Users');

        // Headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Họ tên', key: 'fullName', width: 20 },
            { header: 'Vai trò', key: 'role', width: 12 },
            { header: 'Giới tính', key: 'gender', width: 10 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Địa chỉ', key: 'address', width: 30 },
            { header: 'Ngày tham gia', key: 'joinedDate', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 12 },
            { header: 'Hoạt động cuối', key: 'lastActive', width: 15 }
        ];

        // Add data
        const userData = users.map(user => ({
            id: user._id.toString().substr(-8),
            email: user.email,
            fullName: user.fullName,
            role: user.role === 'admin' ? 'Quản trị' : user.role === 'teacher' ? 'Giáo viên' : 'Học viên',
            gender: user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : user.gender === 'other' ? 'Khác' : 'Chưa xác định',
            phone: user.phone || '',
            address: user.address || '',
            joinedDate: user.joinedDate.toLocaleDateString('vi-VN'),
            status: user.isActive ? 'Hoạt động' : 'Vô hiệu',
            lastActive: user.lastActive ? user.lastActive.toLocaleDateString('vi-VN') : 'Chưa có'
        }));

        worksheet.addRows(userData);

        // Style
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=all-users-${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất dữ liệu'
        });
    }
});

// Xóa user (DELETE method)
router.delete('/delete/:userId', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Không cho phép xóa admin
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }

        // Không cho phép tự xóa
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        await User.findByIdAndDelete(userId);

        return res.json({
            success: true,
            message: 'Xóa tài khoản thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa tài khoản'
        });
    }
});

// API tìm kiếm với phân trang
router.get('/api/users/search', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { 
            search, 
            role, 
            status, 
            dateFrom, 
            dateTo, 
            sortField, 
            sortDirection, 
            page = 1, 
            limit = 25 
        } = req.query;

        let query = {};

        // Search
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { _id: { $regex: search, $options: 'i' } }
            ];
        }

        // Filters
        if (role) {
            query.role = role;
        }

        if (status) {
            query.isActive = status === 'true';
        }

        if (dateFrom || dateTo) {
            query.joinedDate = {};
            if (dateFrom) {
                query.joinedDate.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.joinedDate.$lte = new Date(dateTo + 'T23:59:59.999Z');
            }
        }

        // Sort
        let sort = {};
        if (sortField) {
            sort[sortField] = sortDirection === 'asc' ? 1 : -1;
        } else {
            sort = { joinedDate: -1 };
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            users,
            pagination: {
                currentPage: pageNum,
                totalPages,
                total,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('API search error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tìm kiếm người dùng'
        });
    }
});

module.exports = router;
