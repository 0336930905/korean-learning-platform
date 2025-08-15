const express = require('express');
const router = express.Router();
const faqChatbot = require('../controllers/faqChatbotController');
const FAQ = require('../models/FAQ');

// Route để xử lý tin nhắn từ FAQ chatbot
router.post('/faq-chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Xử lý message đơn giản - chỉ tìm FAQ phù hợp
        const response = await faqChatbot.handleMessage(message.trim());
        res.json(response);
        
    } catch (error) {
        console.error('FAQ Chat Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            data: {
                type: 'error',
                message: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 😓",
                suggestions: [
                    "💰 Học phí các khóa học?",
                    "📅 Lịch học như thế nào?",
                    "👨‍🏫 Thông tin giảng viên?",
                    "🎓 Cách đăng ký học?",
                    "📞 Liên hệ tư vấn"
                ]
            }
        });
    }
});

// Route để lấy FAQ theo category
router.get('/faq-category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const faqs = await faqChatbot.getFAQsByCategory(category);
        
        res.json({
            success: true,
            data: {
                category: category,
                faqs: faqs,
                count: faqs.length
            }
        });
    } catch (error) {
        console.error('FAQ Category Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Route để lấy FAQ phổ biến
router.get('/faq-popular/:limit?', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 5;
        const faqs = await faqChatbot.getPopularFAQs(limit);
        
        res.json({
            success: true,
            data: {
                faqs: faqs,
                count: faqs.length
            }
        });
    } catch (error) {
        console.error('FAQ Popular Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Route để đánh dấu FAQ là hữu ích
router.post('/faq-helpful/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await FAQ.findById(id);
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                error: 'FAQ not found'
            });
        }

        faq.helpfulCount += 1;
        await faq.save();
        
        res.json({
            success: true,
            data: {
                message: 'Cảm ơn phản hồi của bạn!',
                helpfulCount: faq.helpfulCount
            }
        });
    } catch (error) {
        console.error('FAQ Helpful Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Route để lấy tất cả categories
router.get('/faq-categories', async (req, res) => {
    try {
        const categories = await FAQ.distinct('category', { isActive: true });
        
        res.json({
            success: true,
            data: {
                categories: categories
            }
        });
    } catch (error) {
        console.error('FAQ Categories Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Route để tìm kiếm FAQ
router.get('/faq-search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const faqs = await FAQ.findSimilar(q.trim());
        
        res.json({
            success: true,
            data: {
                query: q,
                faqs: faqs,
                count: faqs.length
            }
        });
    } catch (error) {
        console.error('FAQ Search Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
