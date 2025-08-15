const express = require('express');
const router = express.Router();
const ThematicVocabulary = require('../models/ThematicVocabulary');
const vocabularyData = require('../../vocabularyData');

// Route để seed dữ liệu từ vựng
router.post('/seed-vocabulary', async (req, res) => {
    try {
        // Kiểm tra xem đã có dữ liệu chưa
        const existingData = await ThematicVocabulary.countDocuments();
        
        if (existingData > 0) {
            return res.json({
                success: false,
                message: `Đã có ${existingData} bộ từ vựng trong database. Sử dụng /reset-and-seed để xóa và thêm lại.`
            });
        }

        // Thêm createdBy (sử dụng user hiện tại hoặc admin)
        const vocabularyWithCreator = vocabularyData.map(vocab => ({
            ...vocab,
            createdBy: req.user ? req.user._id : '000000000000000000000001' // Fake ObjectId nếu không có user
        }));

        // Thêm dữ liệu vào database
        const result = await ThematicVocabulary.insertMany(vocabularyWithCreator);

        res.json({
            success: true,
            message: `Đã thêm ${result.length} bộ từ vựng thành công!`,
            data: result.map(item => ({
                id: item._id,
                theme: item.theme,
                level: item.level,
                wordCount: item.words.length
            }))
        });

    } catch (error) {
        console.error('Lỗi khi seed vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm dữ liệu từ vựng',
            error: error.message
        });
    }
});

// Route để reset và seed lại dữ liệu
router.post('/reset-and-seed', async (req, res) => {
    try {
        // Xóa tất cả dữ liệu cũ
        await ThematicVocabulary.deleteMany({});
        
        // Thêm dữ liệu mới
        const vocabularyWithCreator = vocabularyData.map(vocab => ({
            ...vocab,
            createdBy: req.user ? req.user._id : '000000000000000000000001'
        }));

        const result = await ThematicVocabulary.insertMany(vocabularyWithCreator);

        res.json({
            success: true,
            message: `Đã reset và thêm ${result.length} bộ từ vựng mới!`,
            data: result.map(item => ({
                id: item._id,
                theme: item.theme,
                level: item.level,
                wordCount: item.words.length
            }))
        });

    } catch (error) {
        console.error('Lỗi khi reset vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi reset dữ liệu từ vựng',
            error: error.message
        });
    }
});

// Route để xem tất cả từ vựng
router.get('/all-vocabulary', async (req, res) => {
    try {
        const vocabularies = await ThematicVocabulary.find()
            .populate('createdBy', 'fullName email')
            .sort({ level: 1, theme: 1 });

        res.json({
            success: true,
            count: vocabularies.length,
            totalWords: vocabularies.reduce((sum, vocab) => sum + vocab.words.length, 0),
            data: vocabularies
        });

    } catch (error) {
        console.error('Lỗi khi lấy vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu từ vựng',
            error: error.message
        });
    }
});

// Route để xem từ vựng theo level
router.get('/vocabulary-by-level/:level', async (req, res) => {
    try {
        const { level } = req.params;
        
        if (!['basic', 'intermediate', 'advanced'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Level phải là: basic, intermediate, hoặc advanced'
            });
        }

        const vocabularies = await ThematicVocabulary.find({ level })
            .populate('createdBy', 'fullName email')
            .sort({ theme: 1 });

        res.json({
            success: true,
            level: level,
            count: vocabularies.length,
            totalWords: vocabularies.reduce((sum, vocab) => sum + vocab.words.length, 0),
            data: vocabularies
        });

    } catch (error) {
        console.error('Lỗi khi lấy vocabulary theo level:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu từ vựng theo level',
            error: error.message
        });
    }
});

// Route để lấy thống kê tổng quan
router.get('/stats', async (req, res) => {
    try {
        const total = await ThematicVocabulary.countDocuments();
        const basic = await ThematicVocabulary.countDocuments({ level: 'basic' });
        const intermediate = await ThematicVocabulary.countDocuments({ level: 'intermediate' });
        const advanced = await ThematicVocabulary.countDocuments({ level: 'advanced' });
        
        // Tính tổng số từ
        const allVocab = await ThematicVocabulary.find();
        const totalWords = allVocab.reduce((sum, vocab) => sum + vocab.words.length, 0);
        
        res.json({
            success: true,
            stats: {
                totalThemes: total,
                totalWords: totalWords,
                averageWordsPerTheme: total > 0 ? (totalWords / total).toFixed(1) : 0,
                byLevel: {
                    basic: { count: basic, percentage: total > 0 ? ((basic / total) * 100).toFixed(1) : 0 },
                    intermediate: { count: intermediate, percentage: total > 0 ? ((intermediate / total) * 100).toFixed(1) : 0 },
                    advanced: { count: advanced, percentage: total > 0 ? ((advanced / total) * 100).toFixed(1) : 0 }
                }
            }
        });

    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê',
            error: error.message
        });
    }
});

module.exports = router;
