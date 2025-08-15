const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { requireAuth } = require('../middleware/auth');

router.post('/api/chat', requireAuth, chatbotController.handleMessage);
router.get('/api/chat/history', requireAuth, chatbotController.getHistory);

module.exports = router;