const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPasswordController');

// Remove auth prefix from routes
router.get('/forgot-password', forgotPasswordController.showForgotPasswordForm);
router.post('/forgot-password', forgotPasswordController.processForgotPassword);
router.get('/verify-code/:email', forgotPasswordController.showVerifyCodeForm);
router.post('/verify-code', forgotPasswordController.verifyCode);
router.post('/reset-password', forgotPasswordController.processResetPassword);
// Add this new route
router.get('/reset-password', forgotPasswordController.showResetPasswordForm);

module.exports = router;