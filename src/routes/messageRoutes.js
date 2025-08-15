const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Main message routes
router.get('/messages', requireAuth, messageController.getMessages);

// Role-based message routes
router.get('/teacher/messages', 
    requireAuth, 
    requireRole('teacher'), 
    messageController.getMessages
);

router.get('/student/messages', 
    requireAuth, 
    requireRole('student'), 
    messageController.getMessages
);

router.get('/admin/messages', 
    requireAuth, 
    requireRole('admin'), 
    messageController.getMessages
);

// API routes for chat functionality
router.get('/api/chat/:userId', requireAuth, messageController.getChatMessages);
router.post('/api/chat/send', requireAuth, messageController.sendMessage);
router.post('/api/chat/:senderId/read', requireAuth, messageController.markAsRead);

module.exports = router;