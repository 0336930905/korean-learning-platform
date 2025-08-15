const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');

// Route thêm tài khoản
router.post('/add', ensureAuthenticated, userController.addUser);

// Route hiển thị trang thêm tài khoản
router.get('/addUser', ensureAuthenticated, (req, res) => {
    res.render('addUser', { user: req.session.user });
});

// Route chỉnh sửa tài khoản
router.post('/edit', ensureAuthenticated, userController.editUser);

// Route khóa/mở tài khoản
router.post('/toggle-status/:userId', ensureAuthenticated, userController.toggleUserStatus);

// Route xem chi tiết tài khoản
router.get('/view/:userId', ensureAuthenticated, userController.viewUserDetails);

// Route xóa tài khoản
router.delete('/delete/:userId', ensureAuthenticated, userController.deleteUser);

router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('admin/addUser'); // Ensure the correct path is used
});

// Add this route for search API
router.get('/api/users/search', ensureAuthenticated, userController.searchUsersAPI);
router.post('/api/users/toggle-status/:userId', ensureAuthenticated, userController.toggleUserStatus);

module.exports = router;