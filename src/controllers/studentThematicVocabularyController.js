const ThematicVocabulary = require('../models/ThematicVocabulary');

exports.getStudentVocabularyList = async (req, res) => {
    try {
        // Fetch all vocabulary themes grouped by level
        const vocabularies = await ThematicVocabulary.find()
            .populate('createdBy', 'fullName')
            .sort({ level: 1, theme: 1 });

        // Group vocabularies by level
        const groupedVocabularies = {
            basic: vocabularies.filter(v => v.level === 'basic'),
            intermediate: vocabularies.filter(v => v.level === 'intermediate'),
            advanced: vocabularies.filter(v => v.level === 'advanced')
        };

        // Calculate statistics
        const totalThemes = vocabularies.length;
        const totalWords = vocabularies.reduce((sum, vocab) => sum + vocab.words.length, 0);
        const completedWords = 0; // You can implement progress tracking later

        res.render('student/student_thematic_vocabulary', {
            user: req.user,
            vocabularies: groupedVocabularies,
            stats: {
                totalThemes,
                totalWords,
                completedWords
            },
            currentUrl: '/student/thematic-vocabulary'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Error loading vocabulary themes',
            error: error.message,
            user: req.user
        });
    }
};

exports.getThemeWords = async (req, res) => {
    try {
        const vocabulary = await ThematicVocabulary.findById(req.params.themeId)
            .select('words theme');

        if (!vocabulary) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chủ đề từ vựng'
            });
        }

        // Map các từ với đầy đủ thông tin
        const words = vocabulary.words.map(word => ({
            _id: word._id,
            korean: word.korean,
            meaning: word.meaning,
            pronunciation: word.pronunciation,
            imageUrl: word.imageUrl
        }));

        if (words.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Chủ đề này chưa có từ vựng'
            });
        }

        res.json({
            success: true,
            theme: vocabulary.theme,
            words: words
        });

    } catch (error) {
        console.error('Error getting theme words:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải từ vựng theo chủ đề'
        });
    }
};

exports.getRandomWords = async (req, res) => {
    try {
        // Lấy tất cả từ vựng từ tất cả chủ đề
        const vocabularies = await ThematicVocabulary.find()
            .select('words');
        
        // Gộp tất cả từ vựng từ các chủ đề
        let allWords = vocabularies.reduce((acc, vocab) => {
            const words = vocab.words.map(word => ({
                _id: word._id,
                korean: word.korean,
                meaning: word.meaning, 
                pronunciation: word.pronunciation,
                imageUrl: word.imageUrl
            }));
            return [...acc, ...words];
        }, []);

        // Kiểm tra số lượng từ
        if (allWords.length < 4) {
            return res.status(404).json({
                success: false,
                message: 'Không đủ từ vựng để tạo bài ôn tập'
            });
        }

        // Trộn ngẫu nhiên và lấy 20 từ hoặc tất cả nếu ít hơn 20
        allWords = allWords.sort(() => 0.5 - Math.random());
        const selectedWords = allWords.slice(0, Math.min(20, allWords.length));

        res.json({
            success: true,
            words: selectedWords
        });

    } catch (error) {
        console.error('Error getting random words:', error);
        res.status(500).json({
            success: false, 
            message: 'Có lỗi xảy ra khi tải từ vựng ngẫu nhiên'
        });
    }
};

// Thêm các phương thức mới
exports.showThemeReview = async (req, res) => {
    try {
        const themeId = req.params.themeId;
        const currentIndex = parseInt(req.query.index) || 0;
        
        const vocabulary = await ThematicVocabulary.findById(themeId);
        if (!vocabulary) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy chủ đề từ vựng',
                user: req.user 
            });
        }

        // Check if vocabulary has words
        if (!vocabulary.words || vocabulary.words.length === 0) {
            return res.status(404).render('error', {
                message: 'Chủ đề này chưa có từ vựng',
                user: req.user
            });
        }

        const currentWord = vocabulary.words[currentIndex];
        const isLastWord = currentIndex >= vocabulary.words.length - 1;

        // Add console.log for debugging
        console.log('Rendering theme review with:', {
            themeId,
            currentIndex,
            totalWords: vocabulary.words.length,
            currentWord
        });

        res.render('student/theme_review', {
            user: req.user,
            word: currentWord,
            currentIndex,
            totalWords: vocabulary.words.length,
            nextIndex: currentIndex + 1,
            isLastWord,
            themeId,
            theme: vocabulary.theme
        });

    } catch (error) {
        console.error('Error in showThemeReview:', error);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải dữ liệu',
            user: req.user 
        });
    }
};

exports.showRandomReview = async (req, res) => {
    try {
        const currentIndex = parseInt(req.query.index) || 0;
        
        // Lấy hoặc tạo danh sách từ ngẫu nhiên trong session
        if (!req.session.randomWords) {
            const vocabularies = await ThematicVocabulary.find();
            const allWords = vocabularies.flatMap(vocab => vocab.words);
            
            if (allWords.length < 4) {
                return res.status(404).render('error', {
                    message: 'Không đủ từ vựng để tạo bài ôn tập',
                    user: req.user
                });
            }

            // Lấy 20 từ ngẫu nhiên
            req.session.randomWords = allWords
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(20, allWords.length));
        }

        const words = req.session.randomWords;
        const currentWord = words[currentIndex];
        const isLastWord = currentIndex >= words.length - 1;

        // Reset session khi hoàn thành
        if (isLastWord) {
            req.session.randomWords = null;
        }

        res.render('student/random_review', {
            user: req.user,
            word: currentWord,
            currentIndex,
            totalWords: words.length,
            nextIndex: currentIndex + 1,
            isLastWord
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { 
            message: 'Có lỗi xảy ra khi tải dữ liệu',
            user: req.user 
        });
    }
};

// Reset random words route
exports.resetRandomReview = async (req, res) => {
    try {
        req.session.randomWords = null;
        res.redirect('/student/review/random');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi reset bài ôn tập',
            user: req.user
        });
    }
};