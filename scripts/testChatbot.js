const mongoose = require('mongoose');
const faqChatbot = require('../src/controllers/faqChatbotController');

// Connect to database
mongoose.connect('mongodb://localhost:27017/korea_learning', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Danh sách các câu hỏi cần test
const testQuestions = [
    "Giá các khóa học tiếng Hàn bao nhiêu?",
    "Có chính sách hoàn tiền không?",
    "Một lớp học có bao nhiêu học viên?",
    "Có thể trả góp học phí không?",
    "Có chứng chỉ hoàn thành không?",
    "Học phí như thế nào?",
    "Sĩ số lớp ra sao?",
    "Hoàn phí được không?"
];

async function testChatbot() {
    console.log('🧪 Bắt đầu test chatbot với các câu hỏi...\n');
    
    // Đợi kết nối database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n${i + 1}. 🤔 Câu hỏi: "${question}"`);
        console.log('─'.repeat(60));
        
        try {
            const response = await faqChatbot.handleMessage(question);
            
            if (response.success && response.data.type !== 'no_match') {
                console.log('✅ Trả lời được!');
                console.log('📝 Nội dung:', response.data.message.substring(0, 200) + '...');
                console.log('🏷️  Loại:', response.data.type);
                if (response.data.category) {
                    console.log('📂 Danh mục:', response.data.category);
                }
            } else {
                console.log('❌ Không tìm thấy câu trả lời phù hợp');
                if (response.data && response.data.message) {
                    console.log('💬 Phản hồi mặc định:', response.data.message.substring(0, 100) + '...');
                }
            }
        } catch (error) {
            console.log('🚨 Lỗi:', error.message);
        }
        
        // Đợi một chút để dễ đọc
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 Hoàn thành test!');
    mongoose.connection.close();
}

testChatbot();
