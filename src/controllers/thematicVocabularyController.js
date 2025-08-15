const ThematicVocabulary = require('../models/ThematicVocabulary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/vocabulary');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Create multer instance with configuration
const uploadConfig = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên file hình ảnh!'));
        }
    }
});

// Create separate upload middlewares for different purposes
const uploadSingle = uploadConfig.single('image');
const uploadFields = uploadConfig.fields([
    { name: 'themeImage', maxCount: 1 },
    { name: 'wordImage', maxCount: 1 }
]);

exports.getList = async (req, res) => {
    try {
        const { level = 'all', search = '' } = req.query;
        
        let query = {};
        if (level !== 'all') {
            query.level = level;
        }
        if (search) {
            query.theme = new RegExp(search, 'i');
        }

        const vocabularies = await ThematicVocabulary.find(query).sort('-createdAt');
        const stats = await calculateStats();

        res.render('teacher/thematic_vocabulary', {
            user: req.user,
            vocabularies,
            stats,
            level,
            search,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Error fetching vocabulary list:', error);
        // Instead of redirecting, render the same page with error
        res.status(500).render('teacher/thematic_vocabulary', {
            user: req.user,
            vocabularies: [],
            stats: {
                totalThemes: 0,
                totalWords: 0,
                advancedThemes: 0,
                recentThemes: 0
            },
            level: 'all',
            search: '',
            messages: {
                error: ['Có lỗi xảy ra khi tải danh sách từ vựng']
            }
        });
    }
};

exports.getCreateForm = (req, res) => {
    res.render('teacher/thematic_vocabulary_form', {
        user: req.user,
        vocabulary: null,
        messages: req.flash()
    });
};

exports.create = async (req, res) => {
    try {
        const { theme, level } = req.body;
        
        // Validation
        if (!theme || !level) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin chủ đề và cấp độ'
            });
        }

        if (!req.body.words) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng thêm ít nhất một từ vựng'
            });
        }

        let wordsData = JSON.parse(req.body.words);

        if (!Array.isArray(wordsData) || wordsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng thêm ít nhất một từ vựng'
            });
        }

        // Lấy themeImage
        const themeImageFile = req.files?.find(file => file.fieldname === 'themeImage');
        const themeImageUrl = themeImageFile ? `/uploads/vocabulary/${themeImageFile.filename}` : '';

        // Lấy word images
        const processedWords = [];
        for (let i = 0; i < wordsData.length; i++) {
            const word = wordsData[i];
            
            // Validate word data
            if (!word.korean || !word.meaning || !word.pronunciation) {
                return res.status(400).json({
                    success: false,
                    message: `Từ vựng thứ ${i + 1} thiếu thông tin bắt buộc`
                });
            }

            const wordImageFile = req.files?.find(file => file.fieldname === `wordImage_${i}`);
            const wordImageUrl = wordImageFile ? `/uploads/vocabulary/${wordImageFile.filename}` : '';

            processedWords.push({
                korean: word.korean.trim(),
                meaning: word.meaning.trim(),
                pronunciation: word.pronunciation.trim(),
                imageUrl: wordImageUrl
            });
        }

        // Tạo mới vocabulary
        const vocabulary = await ThematicVocabulary.create({
            theme: theme.trim(),
            level,
            imageUrl: themeImageUrl,
            words: processedWords,
            createdBy: req.user._id
        });

        res.json({
            success: true,
            message: 'Tạo chủ đề từ vựng thành công',
            vocabulary
        });
    } catch (error) {
        console.error('Error creating vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo chủ đề từ vựng',
            error: error.message
        });
    }
};

exports.getEditForm = async (req, res) => {
    try {
        const vocabulary = await ThematicVocabulary.findById(req.params.id);
        if (!vocabulary) {
            req.flash('error', 'Không tìm thấy chủ đề từ vựng');
            return res.redirect('/teacher/thematic-vocabulary');
        }

        res.render('teacher/thematic_vocabulary_form', {
            user: req.user,
            vocabulary,
            messages: req.flash()
        });
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra khi tải thông tin chủ đề');
        res.redirect('/teacher/thematic-vocabulary');
    }
};

exports.update = async (req, res) => {
    try {
        const vocabularyId = req.params.id;
        const { theme, level } = req.body;

        // Find existing vocabulary
        const vocabulary = await ThematicVocabulary.findById(vocabularyId);
        if (!vocabulary) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chủ đề từ vựng'
            });
        }

        // Allow all teachers to update vocabulary (removed permission check)
        // Teachers can edit any vocabulary regardless of who created it

        // Parse words data - handle both JSON string and object
        let wordsData;
        if (typeof req.body.words === 'string') {
            try {
                wordsData = JSON.parse(req.body.words);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu từ vựng không hợp lệ'
                });
            }
        } else {
            wordsData = req.body.words || [];
        }

        // Validate words data
        if (!Array.isArray(wordsData) || wordsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng thêm ít nhất một từ vựng'
            });
        }

        // Update theme image if new one is uploaded
        if (req.files && req.files.find(file => file.fieldname === 'themeImage')) {
            const themeImage = req.files.find(file => file.fieldname === 'themeImage');
            // Delete old image if exists
            if (vocabulary.imageUrl) {
                const oldImagePath = path.join(__dirname, '../../public', vocabulary.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            vocabulary.imageUrl = `/uploads/vocabulary/${themeImage.filename}`;
        }

        // Process words and their images
        const processedWords = [];
        for (let i = 0; i < wordsData.length; i++) {
            const word = wordsData[i];
            
            // Validate required fields
            if (!word.korean || !word.meaning || !word.pronunciation) {
                return res.status(400).json({
                    success: false,
                    message: `Từ vựng thứ ${i + 1} thiếu thông tin bắt buộc`
                });
            }

            // Check for new image for this word
            const wordImageFile = req.files?.find(file => file.fieldname === `wordImage_${i}`);
            let imageUrl = word.existingImage || '';
            
            if (wordImageFile) {
                // Delete old image if exists
                if (word.existingImage) {
                    const oldImagePath = path.join(__dirname, '../../public', word.existingImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                imageUrl = `/uploads/vocabulary/${wordImageFile.filename}`;
            }

            processedWords.push({
                korean: word.korean.trim(),
                meaning: word.meaning.trim(),
                pronunciation: word.pronunciation.trim(),
                imageUrl: imageUrl
            });
        }

        // Update vocabulary data
        vocabulary.theme = theme.trim();
        vocabulary.level = level;
        vocabulary.words = processedWords;

        // Save changes
        await vocabulary.save();

        res.json({
            success: true,
            message: 'Cập nhật chủ đề từ vựng thành công',
            vocabulary: {
                _id: vocabulary._id,
                theme: vocabulary.theme,
                level: vocabulary.level,
                imageUrl: vocabulary.imageUrl,
                words: vocabulary.words
            }
        });

    } catch (error) {
        console.error('Error updating vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật chủ đề từ vựng',
            error: error.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const vocabulary = await ThematicVocabulary.findById(req.params.id);
        
        if (!vocabulary) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chủ đề từ vựng'
            });
        }

        // Allow all teachers to delete vocabulary (removed permission check)
        // Teachers can delete any vocabulary regardless of who created it

        // Delete associated theme image
        if (vocabulary.imageUrl) {
            const imagePath = path.join(__dirname, '../../public', vocabulary.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete associated word images
        vocabulary.words.forEach(word => {
            if (word.imageUrl) {
                const wordImagePath = path.join(__dirname, '../../public', word.imageUrl);
                if (fs.existsSync(wordImagePath)) {
                    fs.unlinkSync(wordImagePath);
                }
            }
        });

        // Use findByIdAndDelete for newer mongoose versions
        await ThematicVocabulary.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Xóa chủ đề từ vựng thành công'
        });
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa chủ đề từ vựng',
            error: error.message
        });
    }
};

exports.getDetails = async (req, res) => {
    try {
        const vocabulary = await ThematicVocabulary.findById(req.params.id);
        
        if (!vocabulary) {
            req.flash('error', 'Không tìm thấy chủ đề từ vựng');
            return res.redirect('/teacher/thematic-vocabulary');
        }

        res.render('teacher/thematic_vocabulary_details', {
            user: req.user,
            vocabulary,
            messages: req.flash()
        });
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra khi tải chi tiết chủ đề');
        res.redirect('/teacher/thematic-vocabulary');
    }
};

exports.getVocabularyData = async (req, res) => {
    try {
        const vocabulary = await ThematicVocabulary.findById(req.params.id)
            .populate('createdBy', 'fullName'); // Populate thêm thông tin người tạo

        if (!vocabulary) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chủ đề từ vựng'
            });
        }

        res.json({
            success: true,
            vocabulary: {
                _id: vocabulary._id,
                theme: vocabulary.theme,
                level: vocabulary.level,
                imageUrl: vocabulary.imageUrl,
                words: vocabulary.words.map(word => ({
                    _id: word._id,
                    korean: word.korean,
                    meaning: word.meaning,
                    pronunciation: word.pronunciation,
                    imageUrl: word.imageUrl
                }))
            }
        });
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải dữ liệu'
        });
    }
};

async function calculateStats() {
    const [totalThemes, advancedThemes, recentThemes] = await Promise.all([
        ThematicVocabulary.countDocuments(),
        ThematicVocabulary.countDocuments({ level: 'advanced' }),
        ThematicVocabulary.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
        })
    ]);

    const vocabularies = await ThematicVocabulary.find();
    const totalWords = vocabularies.reduce((sum, vocab) => sum + vocab.words.length, 0);

    return {
        totalThemes,
        totalWords,
        advancedThemes,
        recentThemes
    };
}