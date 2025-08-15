const FAQChatbot = require('../src/controllers/faqChatbotController');

async function testSpecificQuestions() {
    console.log('🧪 Testing 5 specific questions...\n');
    
    const questions = [
        'Giá các khóa học tiếng Hàn bao nhiêu?',
        'Có thể trả góp học phí không?',
        'Một lớp học có bao nhiêu học viên?',
        'Có chính sách hoàn tiền không?',
        'Có chứng chỉ hoàn thành không?'
    ];
    
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`\n📝 Test ${i + 1}: "${question}"`);
        console.log('=' .repeat(60));
        
        try {
            const result = await FAQChatbot.handleMessage(question);
            
            if (result.success && result.data) {
                const { type, message, category } = result.data;
                console.log(`✅ Response Type: ${type}`);
                if (category) console.log(`📂 Category: ${category}`);
                console.log(`💬 Answer:\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`);
                
                if (type === 'faq_answer') {
                    console.log('🎯 SUCCESS: Found matching FAQ!');
                } else {
                    console.log('❌ FAILED: No matching FAQ found');
                }
            } else {
                console.log('❌ FAILED: Error in response');
                console.log('Error:', result.error);
            }
        } catch (error) {
            console.log('❌ FAILED: Exception occurred');
            console.log('Error:', error.message);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test completion summary:');
    console.log('All 5 questions have been tested.');
    console.log('Check above results to see which ones work correctly.');
}

// Chạy test
testSpecificQuestions().then(() => {
    console.log('\n✅ Testing completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
});
