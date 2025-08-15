const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Login routes
router.get('/login', (req, res) => {
    res.render('login', { 
        message: req.flash('error'),
        type: req.flash('type') || 'info', // Add default type
        redirect: req.query.redirect || ''
    });
});

// Form login route
router.post('/auth/login', authController.login);

// Add register route
router.post('/auth/register', authController.register);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    authController.googleCallback
);

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
