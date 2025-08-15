const FAQ = require('../models/FAQ');
const faqData = require('../data/faqData.json');

class FAQChatbot {
    constructor() {
        this.name = "Tư vấn AI";
        this.welcomeMessages = [
            "Xin chào! Tôi là Tư vấn AI - trợ lý tư vấn khóa học tiếng Hàn của bạn! 👋",
            "Chào mừng bạn đến với Korea_DB! Tôi sẽ giúp bạn tìm hiểu về các khóa học tiếng Hàn 🇰🇷",
            "Annyeonghaseyo! Tôi là Tư vấn AI, sẵn sàng hỗ trợ bạn về mọi thông tin khóa học! ✨"
        ];
        
        this.defaultResponse = "Xin lỗi, tôi không tìm thấy câu trả lời phù hợp trong hệ thống FAQ. Bạn có thể hỏi câu hỏi khác hoặc liên hệ tư vấn viên để được hỗ trợ tốt hơn! 😊";

        this.greetings = [
            'xin chào', 'chào', 'hello', 'hi', 'annyeong', 'annyeonghaseyo', 
            'chào bạn', 'xin chào bạn', 'korea_ai'
        ];

        this.goodbyes = [
            'tạm biệt', 'bye', 'goodbye', 'chào tạm biệt', 'hẹn gặp lại', 
            'cảm ơn', 'thank you', 'thanks'
        ];
    }

    // Chuẩn hóa text để tìm kiếm
    normalizeText(text) {
        if (typeof text !== 'string') {
            return '';
        }
        
        return text
            .toLowerCase()
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Kiểm tra loại tin nhắn (lời chào, tạm biệt, câu hỏi)
    detectMessageType(message) {
        const normalizedMessage = this.normalizeText(message);
        
        // Kiểm tra lời chào
        const isGreeting = this.greetings.some(greeting => {
            const normalizedGreeting = this.normalizeText(greeting);
            return normalizedMessage === normalizedGreeting || 
                   normalizedMessage.includes(normalizedGreeting);
        });
        
        if (isGreeting) {
            return 'greeting';
        }

        // Kiểm tra lời tạm biệt
        const isGoodbye = this.goodbyes.some(goodbye => {
            const normalizedGoodbye = this.normalizeText(goodbye);
            return normalizedMessage === normalizedGoodbye || 
                   normalizedMessage.includes(normalizedGoodbye);
        });
        
        if (isGoodbye) {
            return 'goodbye';
        }

        return 'question';
    }

    // Tính độ tương đồng giữa 2 chuỗi - cải thiện cho 5 câu hỏi cụ thể
    calculateSimilarity(str1, str2) {
        const s1 = this.normalizeText(str1);
        const s2 = this.normalizeText(str2);
        
        if (s1 === s2) return 1.0;
        
        // Kiểm tra exact match cho các câu hỏi quan trọng
        const exactMatches = [
            { pattern: /gia.*khoa.*hoc.*bao.*nhieu/, score: 1.0 },
            { pattern: /tra.*gop.*hoc.*phi/, score: 1.0 },
            { pattern: /mot.*lop.*hoc.*bao.*nhieu.*hoc.*vien/, score: 1.0 },
            { pattern: /chinh.*sach.*hoan.*tien/, score: 1.0 },
            { pattern: /chung.*chi.*hoan.*thanh/, score: 1.0 }
        ];

        for (const match of exactMatches) {
            if (match.pattern.test(s1) && match.pattern.test(s2)) {
                return match.score;
            }
        }
        
        // Kiểm tra chứa từ khóa
        const words1 = s1.split(' ').filter(w => w.length > 1);
        const words2 = s2.split(' ').filter(w => w.length > 1);
        
        let matchingWords = 0;
        let exactWords = 0;
        
        words1.forEach(word1 => {
            words2.forEach(word2 => {
                if (word1 === word2) {
                    exactWords++;
                } else if (word2.includes(word1) || word1.includes(word2)) {
                    matchingWords++;
                }
            });
        });
        
        // Tính điểm dựa trên exact matches và partial matches
        const exactScore = words1.length > 0 ? (exactWords * 2.0) / words1.length : 0;
        const partialScore = words1.length > 0 ? matchingWords / words1.length : 0;
        const keywordScore = Math.min(1.0, exactScore + partialScore * 0.5);
        
        // Kiểm tra chứa chuỗi con
        const substringScore = s2.includes(s1) || s1.includes(s2) ? 0.7 : 0;
        
        // Kiểm tra các từ khóa đặc biệt
        const specialKeywords = this.checkSpecialKeywords(s1, s2);
        
        return Math.max(keywordScore, substringScore, specialKeywords);
    }

    // Kiểm tra các từ khóa đặc biệt - cải thiện cho 5 câu hỏi
    checkSpecialKeywords(userQuery, faqText) {
        const specialMappings = {
            // Giá/học phí
            'gia': ['hoc phi', 'chi phi', 'tien', 'phi', 'bao nhieu', 'gia ca'],
            'hoc phi': ['gia', 'chi phi', 'tien', 'phi', 'bao nhieu'],
            'bao nhieu': ['gia', 'phi', 'chi phi', 'hoc phi', 'so luong', 'si so'],
            
            // Trả góp
            'tra gop': ['chia dot', 'thanh toan', 'gop phan', 'phan ky', 'tra tien'],
            'gop': ['tra gop', 'chia dot', 'thanh toan'],
            
            // Sĩ số lớp
            'si so': ['bao nhieu hoc vien', 'so luong', 'lop hoc', 'hoc vien'],
            'lop hoc': ['si so', 'hoc vien', 'so luong'],
            'hoc vien': ['si so', 'lop hoc', 'so luong'],
            
            // Hoàn tiền
            'hoan tien': ['hoan phi', 'chinh sach', 'huy hoc', 'tra lai'],
            'chinh sach': ['hoan tien', 'hoan phi', 'quy dinh'],
            
            // Chứng chỉ
            'chung chi': ['hoan thanh', 'bang cap', 'certificate', 'cong nhan'],
            'hoan thanh': ['chung chi', 'ket thuc', 'xong khoa hoc']
        };

        let score = 0;
        Object.keys(specialMappings).forEach(key => {
            if (userQuery.includes(key)) {
                specialMappings[key].forEach(synonym => {
                    if (faqText.includes(synonym)) {
                        score = Math.max(score, 0.9);
                    }
                });
            }
        });

        return score;
    }

    // Tìm FAQ phù hợp nhất
    async findBestMatchingFAQ(userMessage) {
        try {
            console.log('🔍 Searching for FAQ matching:', userMessage);
            
            let allFAQs = [];
            
            // Thử lấy từ database trước
            try {
                allFAQs = await FAQ.find({ isActive: true });
                console.log('📚 Found FAQs from database:', allFAQs.length);
            } catch (dbError) {
                console.log('⚠️ Database not available, using JSON data');
                // Sử dụng dữ liệu từ JSON file
                allFAQs = faqData.map(faq => ({
                    ...faq,
                    _id: faq.question,
                    isActive: true,
                    save: async function() {
                        console.log('Mock save called for JSON FAQ');
                        return Promise.resolve();
                    }
                }));
                console.log('📚 Found FAQs from JSON:', allFAQs.length);
            }
            
            if (allFAQs.length === 0) {
                return null;
            }

            let bestMatch = null;
            let bestScore = 0;
            const minScore = 0.15; // Giảm điểm tối thiểu để nhận diện được nhiều câu hỏi hơn

            // So sánh với từng FAQ
            allFAQs.forEach(faq => {
                // Tính điểm với question
                const questionScore = this.calculateSimilarity(userMessage, faq.question);
                
                // Tính điểm với keywords (nếu có)
                let keywordScore = 0;
                if (faq.keywords && faq.keywords.length > 0) {
                    faq.keywords.forEach(keyword => {
                        const score = this.calculateSimilarity(userMessage, keyword);
                        keywordScore = Math.max(keywordScore, score);
                    });
                }

                // Tính điểm với answer (trọng số thấp hơn)
                const answerScore = this.calculateSimilarity(userMessage, faq.answer) * 0.4;
                
                // Điểm tổng (ưu tiên question và keywords)
                let totalScore = Math.max(
                    questionScore * 1.0,
                    keywordScore * 0.95,
                    answerScore
                );

                // Bonus cho priority cao
                if (faq.priority && faq.priority >= 4) {
                    totalScore *= 1.1;
                }
                
                console.log(`📊 FAQ "${faq.question.substring(0, 50)}..." - Score: ${totalScore.toFixed(3)} (Q:${questionScore.toFixed(2)}, K:${keywordScore.toFixed(2)}, A:${answerScore.toFixed(2)})`);
                
                if (totalScore > bestScore && totalScore >= minScore) {
                    bestMatch = faq;
                    bestScore = totalScore;
                }
            });

            if (bestMatch) {
                console.log(`✅ Best match found with score ${bestScore.toFixed(3)}:`, bestMatch.question);
                // Tăng view count (chỉ cho database, JSON thì mock)
                if (bestMatch.viewCount !== undefined) {
                    bestMatch.viewCount += 1;
                    await bestMatch.save();
                }
            } else {
                console.log('❌ No suitable FAQ match found');
            }

            return bestMatch;
        } catch (error) {
            console.error('❌ Error in findBestMatchingFAQ:', error);
            return null;
        }
    }

    // Tạo response từ FAQ match
    async generateFAQResponse(faq) {
        if (!faq) {
            return {
                type: 'no_match',
                message: this.defaultResponse,
                suggestions: await this.generateSuggestions()
            };
        }

        return {
            type: 'faq_answer',
            message: `**${faq.question}**\n\n${faq.answer}`,
            category: faq.category,
            faqId: faq._id,
            suggestions: await this.generateSuggestions(faq._id)
        };
    }

    // Tạo gợi ý câu hỏi từ FAQ.question
    async generateSuggestions(excludeFaqId = null) {
        try {
            let randomFAQs = [];
            
            // Thử lấy từ database trước
            try {
                const query = excludeFaqId ? 
                    { isActive: true, _id: { $ne: excludeFaqId } } : 
                    { isActive: true };
                
                randomFAQs = await FAQ.aggregate([
                    { $match: query },
                    { $sample: { size: 10 } },
                    { $project: { question: 1 } }
                ]);
                console.log('📋 Generated suggestions from database:', randomFAQs.length);
            } catch (dbError) {
                console.log('⚠️ Using JSON data for suggestions');
                // Sử dụng dữ liệu từ JSON
                const filteredFAQs = faqData.filter(faq => faq.question !== excludeFaqId);
                randomFAQs = filteredFAQs
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 10)
                    .map(faq => ({ question: faq.question }));
                console.log('📋 Generated suggestions from JSON:', randomFAQs.length);
            }
            
            if (randomFAQs.length === 0) {
                // Fallback nếu không có FAQ nào
                return [
                    "💰 Giá các khóa học tiếng Hàn bao nhiêu?",
                    "📅 Lịch học như thế nào?",
                    "👨‍🏫 Thông tin giảng viên?",
                    "🎓 Cách đăng ký khóa học?"
                ];
            }
            
            // Lấy 4 suggestions ngẫu nhiên từ danh sách
            const shuffled = randomFAQs.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 4).map(faq => faq.question);
            
        } catch (error) {
            console.error('❌ Error generating suggestions:', error);
            // Fallback suggestions nếu có lỗi
            return [
                "💰 Giá các khóa học tiếng Hàn bao nhiêu?",
                "📅 Lịch học như thế nào?", 
                "👨‍🏫 Thông tin giảng viên?",
                "🎓 Cách đăng ký khóa học?"
            ];
        }
    }

    // Main method xử lý message
    async handleMessage(message, context = null) {
        try {
            console.log('💬 Handling message:', message);
            
            if (!message || message.trim() === '') {
                return {
                    success: false,
                    error: 'Message is required'
                };
            }

            const messageType = this.detectMessageType(message);
            console.log('📋 Message type:', messageType);

            // Xử lý lời chào
            if (messageType === 'greeting') {
                const randomWelcome = this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
                return {
                    success: true,
                    data: {
                        type: 'greeting',
                        message: randomWelcome,
                        suggestions: await this.generateSuggestions()
                    }
                };
            }

            // Xử lý lời tạm biệt
            if (messageType === 'goodbye') {
                return {
                    success: true,
                    data: {
                        type: 'goodbye',
                        message: "Cảm ơn bạn đã sử dụng dịch vụ tư vấn! Chúc bạn học tập hiệu quả! 👋🇰🇷",
                        suggestions: []
                    }
                };
            }

            // Xử lý câu hỏi - tìm FAQ phù hợp
            const matchedFAQ = await this.findBestMatchingFAQ(message);
            const response = await this.generateFAQResponse(matchedFAQ);

            return {
                success: true,
                data: response
            };

        } catch (error) {
            console.error('❌ Error in handleMessage:', error);
            return {
                success: false,
                error: 'Internal server error',
                data: {
                    type: 'error',
                    message: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 😓",
                    suggestions: await this.generateSuggestions()
                }
            };
        }
    }

    // Method để lấy FAQ theo category
    async getFAQsByCategory(category) {
        try {
            let faqs = [];
            
            try {
                faqs = await FAQ.find({ 
                    category: category, 
                    isActive: true 
                }).sort({ priority: -1, viewCount: -1 });
            } catch (dbError) {
                // Sử dụng JSON data nếu database không có
                faqs = faqData.filter(faq => faq.category === category);
            }
            
            return faqs;
        } catch (error) {
            console.error('❌ Error in getFAQsByCategory:', error);
            return [];
        }
    }

    // Method để lấy FAQ phổ biến
    async getPopularFAQs(limit = 5) {
        try {
            let faqs = [];
            
            try {
                faqs = await FAQ.find({ isActive: true })
                    .sort({ viewCount: -1, helpfulCount: -1 })
                    .limit(limit);
            } catch (dbError) {
                // Sử dụng JSON data nếu database không có
                faqs = faqData
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, limit);
            }
            
            return faqs;
        } catch (error) {
            console.error('❌ Error in getPopularFAQs:', error);
            return [];
        }
    }
}

module.exports = new FAQChatbot();
