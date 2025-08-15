const FAQ = require('../models/FAQ');
const Course = require('../models/Course');
const Class = require('../models/class');
const User = require('../models/User');

class FAQChatbot {
    constructor() {
        this.name = "Korea_AI";
        this.welcomeMessages = [
            "Xin chào! Tôi là Korea_AI - trợ lý tư vấn khóa học tiếng Hàn của bạn! 👋",
            "Chào mừng bạn đến với Korea_DB! Tôi sẽ giúp bạn tìm hiểu về các khóa học tiếng Hàn 🇰🇷",
            "Annyeonghaseyo! Tôi là Korea_AI, sẵn sàng hỗ trợ bạn về mọi thông tin khóa học! ✨"
        ];
        
        this.defaultResponses = [
            "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về **giá khóa học**, **lịch lớp học**, **cách nộp bài tập**, **thông tin giảng viên** hay **cách chấm điểm**! 😊",
            "Hmm, câu hỏi này hơi khó hiểu. Hãy thử hỏi về **đăng ký lớp học**, **assignment**, **submission** hoặc **progress tracking** nhé! 🤔",
            "Tôi có thể giúp bạn về hệ thống học tập **Korea_DB** - nơi học offline với nộp bài online. Bạn muốn biết gì về **classes**, **assignments**, **grading** hay **course enrollment**? 💡"
        ];

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
        // Kiểm tra nếu text không phải là string
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

    // Phân tích ý định của câu hỏi
    analyzeIntent(message) {
        const normalizedMessage = this.normalizeText(message);
        
        // Kiểm tra lời chào
        if (this.greetings.some(greeting => normalizedMessage.includes(greeting))) {
            return { type: 'greeting', confidence: 1.0 };
        }

        // Kiểm tra lời tạm biệt
        if (this.goodbyes.some(goodbye => normalizedMessage.includes(goodbye))) {
            return { type: 'goodbye', confidence: 1.0 };
        }

        // Phân tích category dựa trên keywords và thực tế Korea_DB (offline learning với online submission)
        const categoryKeywords = {
            'Học phí': ['học phí', 'giá', 'tiền', 'chi phí', 'phí', 'cost', 'price', 'trả góp', 'hoàn tiền', 'giảm giá', 'đóng tiền', 'thanh toán'],
            'Lịch học': ['lịch học', 'thời gian', 'buổi học', 'schedule', 'giờ học', 'ngày học', 'ca học', 'startdate', 'enddate', 'days'],
            'Giảng viên': ['giảng viên', 'thầy', 'cô', 'teacher', 'người dạy', 'instructor', 'fullname', 'role'],
            'Chứng chỉ': ['chứng chỉ', 'certificate', 'bằng cấp', 'hoàn thành', 'tốt nghiệp', 'topik', 'cấp độ', 'completed'],
            'Hỗ trợ': ['hỗ trợ', 'giúp đỡ', 'tư vấn', 'support', 'emergency', 'liên hệ', 'phone'],
            'Hình thức học': ['offline', 'trực tiếp', 'tại lớp', 'hình thức', 'cách học', 'classroom', 'status'],
            'Lớp học': ['lớp học', 'số lượng', 'học viên', 'class', 'nhóm', 'maxstudents', 'students', 'enrollment'],
            'Tuyển sinh': ['tuyển sinh', 'đăng ký', 'admission', 'register', 'enrollment', 'pending', 'request', 'dang ky tai khoan', 'tao tai khoan', 'lap tai khoan'],
            'Khóa học': ['khóa học', 'course', 'curriculum', 'chương trình', 'level', 'category', 'duration'],
            'Bài tập': ['bài tập', 'assignment', 'submission', 'nộp bài', 'chấm điểm', 'grade', 'score', 'homework'],
            'Hệ thống': ['korea_db', 'hệ thống', 'platform', 'website', 'progress', 'tracking', 'user']
        };

        let bestMatch = { category: null, confidence: 0 };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            const matches = keywords.filter(keyword => 
                normalizedMessage.includes(this.normalizeText(keyword))
            ).length;
            
            const confidence = matches / keywords.length;
            
            if (confidence > bestMatch.confidence) {
                bestMatch = { category, confidence };
            }
        }

        return { 
            type: 'question', 
            category: bestMatch.category, 
            confidence: bestMatch.confidence 
        };
    }

    // Tìm kiếm FAQ phù hợp và truy cập database thực tế
    async searchFAQ(message, intent) {
        try {
            const normalizedQuery = this.normalizeText(message);
            let faqs = [];
            let realData = null;

            // Tìm kiếm trong FAQ database trước
            if (intent.category) {
                faqs = await FAQ.find({ 
                    category: intent.category,
                    isActive: true,
                    $or: [
                        { question: { $regex: normalizedQuery, $options: 'i' } },
                        { answer: { $regex: normalizedQuery, $options: 'i' } },
                        { keywords: { $in: [normalizedQuery] } }
                    ]
                }).sort({ priority: -1, viewCount: -1 }).limit(3);
            }

            // Nếu không tìm thấy FAQ hoặc cần thông tin thực tế, truy cập database
            if (faqs.length === 0 || intent.category) {
                realData = await this.getRealDatabaseInfo(message, intent);
            }

            // Fallback: tìm kiếm text search nếu chưa có kết quả
            if (faqs.length === 0 && !realData) {
                faqs = await FAQ.find({
                    $text: { $search: normalizedQuery },
                    isActive: true
                })
                    .sort({ viewCount: -1, priority: -1 })
                    .limit(3);
            }

            return { faqs, realData };
        } catch (error) {
            console.error('Error searching FAQ:', error);
            return { faqs: [], realData: null };
        }
    }

    // Lấy thông tin thực tế từ database
    async getRealDatabaseInfo(message, intent) {
        try {
            // Đảm bảo message là string
            const normalizedMessage = this.normalizeText(message || '');
            const categories = intent.categories || [intent.category];
            
            for (const category of categories) {
                switch (category) {
                    case 'Học phí':
                        if (normalizedMessage.includes('gia') || normalizedMessage.includes('price') || normalizedMessage.includes('cost') || normalizedMessage.includes('hoc phi') || normalizedMessage.includes('tien')) {
                            const courses = await Course.find({ status: 'active' })
                                .populate('instructor', 'fullName')
                                .select('title description price duration level category')
                                .limit(5);
                            return { type: 'course_pricing', data: courses };
                        }
                        break;

                    case 'Lịch học':
                        if (normalizedMessage.includes('lich') || normalizedMessage.includes('schedule') || normalizedMessage.includes('linh hoat')) {
                            const classes = await Class.find({ status: 'active' })
                                .populate('teacher', 'fullName')
                                .populate('course', 'title')
                                .limit(3);
                            return { type: 'class_schedule', data: classes };
                        }
                        break;

                    case 'Lớp học':
                        if (normalizedMessage.includes('so luong') || normalizedMessage.includes('hoc vien') || normalizedMessage.includes('students')) {
                            const classes = await Class.find({ status: 'active' })
                                .populate('course', 'title')
                                .limit(3);
                            return { type: 'class_capacity', data: classes };
                        }
                        break;

                    case 'Giảng viên':
                        if (normalizedMessage.includes('thong tin') || normalizedMessage.includes('giang vien') || normalizedMessage.includes('teacher')) {
                            const teachers = await User.find({ role: 'teacher', isActive: true })
                                .select('fullName koreanLevel profileImage')
                                .limit(3);
                            return { type: 'teachers_info', data: teachers };
                        }
                        break;

                    case 'Khóa học':
                        if (normalizedMessage.includes('level') || normalizedMessage.includes('cap do') || normalizedMessage.includes('category')) {
                            const courses = await Course.find({ status: 'active' })
                                .populate('instructor', 'fullName')
                                .limit(5);
                            return { type: 'courses_info', data: courses };
                        }
                        break;

                    case 'Tuyển sinh':
                        if (normalizedMessage.includes('dang ky') || normalizedMessage.includes('tai khoan') || normalizedMessage.includes('register') || normalizedMessage.includes('tao tai khoan') || normalizedMessage.includes('lap tai khoan')) {
                            return { type: 'registration_info', data: { loginUrl: 'http://localhost:3996/login' } };
                        }
                        break;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting real database info:', error);
            return null;
        }
    }

    // Tạo response từ dữ liệu thực tế trong database
    generateRealDataResponse(realData) {
        try {
            switch (realData.type) {
                case 'course_pricing':
                    if (realData.data && realData.data.length > 0) {
                        let response = "💰 **Thông tin học phí các khóa học hiện tại:**\n\n";
                        realData.data.forEach((course, index) => {
                            const price = course.price ? course.price.toLocaleString('vi-VN') + ' VND' : 'Liên hệ để biết giá';
                            response += `**${index + 1}. ${course.title}**\n`;
                            response += `   💵 Học phí: ${price}\n`;
                            if (course.duration) response += `   ⏱️ Thời lượng: ${course.duration}\n`;
                            if (course.level) {
                                const levelDisplay = course.level === 'beginner' ? 'Sơ cấp' : 
                                                   course.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao';
                                response += `   📊 Trình độ: ${levelDisplay}\n`;
                            }
                            if (course.category) response += `   📚 Danh mục: ${course.category}\n`;
                            response += '\n';
                        });
                        response += "📞 *Liên hệ để được tư vấn chi tiết về học phí và chương trình học*";
                        return response;
                    }
                    break;

                case 'class_schedule':
                    if (realData.data && realData.data.length > 0) {
                        let response = "📅 **Lịch học các lớp đang hoạt động:**\n\n";
                        realData.data.forEach((classItem, index) => {
                            response += `**${index + 1}. ${classItem.course?.title || classItem.className}**\n`;
                            response += `   👨‍🏫 Giảng viên: ${classItem.teacher?.fullName || 'Chưa phân công'}\n`;
                            if (classItem.schedule) response += `   🕐 Lịch học: ${classItem.schedule}\n`;
                            if (classItem.startDate) response += `   📆 Ngày bắt đầu: ${new Date(classItem.startDate).toLocaleDateString('vi-VN')}\n`;
                            response += '\n';
                        });
                        response += "📲 *Liên hệ để được tư vấn lịch học phù hợp*";
                        return response;
                    }
                    break;

                case 'class_capacity':
                    if (realData.data && realData.data.length > 0) {
                        let response = "👥 **Thông tin sĩ số các lớp học:**\n\n";
                        realData.data.forEach((classItem, index) => {
                            const currentStudents = classItem.students?.length || 0;
                            response += `**${index + 1}. ${classItem.course?.title || classItem.className}**\n`;
                            response += `   👥 Sĩ số hiện tại: ${currentStudents}/${classItem.maxStudents || 'Không giới hạn'} học viên\n`;
                            if (classItem.startDate) response += `   📅 Bắt đầu: ${new Date(classItem.startDate).toLocaleDateString('vi-VN')}\n`;
                            response += '\n';
                        });
                        response += "🎯 *Lớp học nhỏ đảm bảo chất lượng giảng dạy tốt nhất*";
                        return response;
                    }
                    break;

                case 'teachers_info':
                    if (realData.data && realData.data.length > 0) {
                        let response = "👨‍🏫 **Thông tin đội ngũ giảng viên:**\n\n";
                        realData.data.forEach((teacher, index) => {
                            response += `**${index + 1}. ${teacher.fullName}**\n`;
                            if (teacher.koreanLevel) response += `   🏆 Trình độ tiếng Hàn: ${teacher.koreanLevel}\n`;
                            response += `   ✅ Giảng viên chính thức\n`;
                            response += '\n';
                        });
                        response += "🌟 *Đội ngũ giảng viên giàu kinh nghiệm và nhiệt tình*";
                        return response;
                    }
                    break;

                case 'courses_info':
                    if (realData.data && realData.data.length > 0) {
                        let response = "📚 **Danh sách các khóa học hiện có:**\n\n";
                        realData.data.forEach((course, index) => {
                            response += `**${index + 1}. ${course.title}**\n`;
                            if (course.description) response += `   📝 ${course.description.substring(0, 80)}...\n`;
                            if (course.level) response += `   📊 Trình độ: ${course.level}\n`;
                            if (course.instructor) response += `   👨‍🏫 Giảng viên: ${course.instructor.fullName}\n`;
                            response += '\n';
                        });
                        response += "🎓 *Đăng ký ngay để bắt đầu hành trình học tiếng Hàn*";
                        return response;
                    }
                    break;

                case 'registration_info':
                    if (realData.data && realData.data.loginUrl) {
                        let response = "🎓 **Đăng ký tài khoản học tiếng Hàn tại Korea_DB:**\n\n";
                        response += "✅ **Cách đăng ký:**\n";
                        response += "1. Truy cập link đăng ký: " + realData.data.loginUrl + "\n";
                        response += "2. Chọn 'Đăng ký tài khoản mới'\n";
                        response += "3. Điền thông tin cá nhân\n";
                        response += "4. Xác nhận email\n";
                        response += "5. Bắt đầu học ngay!\n\n";
                        response += "🌟 **Lợi ích khi đăng ký:**\n";
                        response += "• Truy cập đầy đủ các khóa học tiếng Hàn\n";
                        response += "• Học offline tại lớp với giảng viên chuyên nghiệp\n";
                        response += "• Nộp bài tập và theo dõi tiến độ online\n";
                        response += "• Hỗ trợ 24/7 từ đội ngũ tư vấn\n";
                        response += "• Chứng chỉ hoàn thành khóa học\n\n";
                        response += "📞 *Liên hệ ngay để được tư vấn miễn phí!*";
                        return response;
                    }
                    break;
            }
            return null;
        } catch (error) {
            console.error('Error generating real data response:', error);
            return null;
        }
    }

    // Tạo response chính
    generateResponse(faqs, intent, originalMessage, realData = null) {
        // Đảm bảo faqs là array
        faqs = Array.isArray(faqs) ? faqs : [];
        
        if (intent.type === 'greeting') {
            const welcome = this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
            return {
                type: 'greeting',
                message: welcome,
                suggestions: this.generateSuggestions([])
            };
        }

        if (intent.type === 'goodbye') {
            return {
                type: 'goodbye',
                message: "Cảm ơn bạn đã sử dụng dịch vụ tư vấn! Chúc bạn học tiếng Hàn vui vẻ! 안녕히 가세요! 👋✨",
                suggestions: ["Giới thiệu về Korea_DB", "Các khóa học hiện có", "Cách đăng ký học"]
            };
        }

        // Ưu tiên thông tin thực tế từ database
        if (realData) {
            const realResponse = this.generateRealDataResponse(realData);
            if (realResponse) {
                return {
                    type: 'database_answer',
                    message: realResponse,
                    suggestions: this.generateSuggestions(faqs),
                    source: 'real_database'
                };
            }
        }

        if (faqs.length === 0) {
            const defaultResponse = this.defaultResponses[Math.floor(Math.random() * this.defaultResponses.length)];
            return {
                type: 'default',
                message: defaultResponse,
                suggestions: this.generateSuggestions([])
            };
        }

        // Tạo response từ FAQs thông thường
        let response = "🤖 **Korea_AI trả lời:**\n\n";
        
        if (faqs.length === 1) {
            // Tăng view count
            faqs[0].incrementViewCount();
            response += `**Q: ${faqs[0].question}**\n\n`;
            response += `A: ${faqs[0].answer}\n\n`;
            response += `📂 *Danh mục: ${faqs[0].category}*`;
        } else {
            response += "Tôi tìm thấy một số thông tin có thể hữu ích:\n\n";
            faqs.forEach((faq, index) => {
                faq.incrementViewCount();
                response += `**${index + 1}. ${faq.question}**\n`;
                response += `${faq.answer.substring(0, 100)}...\n\n`;
            });
            response += "*Bạn muốn biết chi tiết câu nào? Hãy hỏi cụ thể hơn nhé!*";
        }

        const suggestions = this.generateSuggestions(faqs);

        return {
            type: 'answer',
            message: response,
            suggestions: suggestions,
            faqs: faqs.map(faq => ({
                id: faq._id,
                question: faq.question,
                answer: faq.answer,
                category: faq.category
            }))
        };
    }

    // Tạo gợi ý câu hỏi dựa trên hệ thống Korea_DB thực tế
    generateSuggestions(faqs) {
        const suggestions = [
            "💰 Giá các khóa học từ bao nhiêu?",
            "📅 Lịch học các lớp trong tuần?",
            "📝 Làm sao để nộp bài assignment?",
            "👨‍🏫 Thông tin về giảng viên lớp?",
            "📊 Hệ thống chấm điểm như thế nào?",
            "🎓 Cách đăng ký tham gia lớp học?",
            "👥 Có bao nhiêu học viên trong lớp?",
            "⏰ Thời gian bắt đầu và kết thúc khóa?",
            "📋 Assignment có deadline không?",
            "🔍 Cách theo dõi tiến độ học tập?",
            "🆕 Muốn đăng ký tài khoản mới?",
            "💳 Có thể trả góp học phí không?"
        ];

        // Lấy random 4 suggestions
        const shuffled = suggestions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }

    // Main method xử lý message
    async handleMessage(message) {
        try {
            // Đảm bảo message là string
            if (typeof message !== 'string' || !message.trim()) {
                return {
                    type: 'error',
                    message: "Vui lòng nhập câu hỏi của bạn! 🤔",
                    suggestions: this.generateSuggestions([])
                };
            }

            // Phân tích intent
            const intent = this.analyzeIntent(message);
            
            // Tìm kiếm FAQ và thông tin thực tế
            const { faqs, realData } = await this.searchFAQ(message, intent);
            
            // Tạo response
            const response = this.generateResponse(faqs, intent, message, realData);
            
            return response;
        } catch (error) {
            console.error('Error handling message:', error);
            return {
                type: 'error',
                message: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 😅",
                suggestions: this.generateSuggestions([])
            };
        }
    }

    // Method để lấy FAQ theo category
    async getFAQsByCategory(category) {
        try {
            return await FAQ.find({ 
                category: category, 
                isActive: true 
            }).sort({ priority: -1, viewCount: -1 });
        } catch (error) {
            console.error('Error getting FAQs by category:', error);
            return [];
        }
    }

    // Method để lấy FAQ phổ biến
    async getPopularFAQs(limit = 5) {
        try {
            return await FAQ.find({ 
                isActive: true 
            }).sort({ viewCount: -1, priority: -1 }).limit(limit);
        } catch (error) {
            console.error('Error getting popular FAQs:', error);
            return [];
        }
    }
}

module.exports = new FAQChatbot();
