// Test API chatbot trực tiếp
const http = require('http');

async function testChatbotAPI(message) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ message });
        
        const options = {
            hostname: 'localhost',
            port: 3996,
            path: '/api/faq-chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Invalid JSON response: ' + data));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function testAll5Questions() {
    console.log('🧪 Testing chatbot API with 5 specific questions...\n');
    
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
            const response = await testChatbotAPI(question);
            
            if (response.success && response.data) {
                const { type, message, category } = response.data;
                console.log(`✅ Status: SUCCESS`);
                console.log(`📋 Type: ${type}`);
                if (category) console.log(`📂 Category: ${category}`);
                
                // Hiển thị answer ngắn gọn
                const answer = message.split('\n\n')[1] || message; // Lấy phần answer, bỏ question
                console.log(`💬 Answer: ${answer.substring(0, 150)}${answer.length > 150 ? '...' : ''}`);
                
                if (type === 'faq_answer') {
                    console.log('🎯 RESULT: Chatbot có thể trả lời câu hỏi này!');
                } else {
                    console.log('❌ RESULT: Chatbot không tìm thấy FAQ phù hợp');
                }
            } else {
                console.log('❌ Status: FAILED');
                console.log(`Error: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log('❌ Status: ERROR');
            console.log(`Error: ${error.message}`);
        }
        
        // Delay nhỏ giữa các request
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 SUMMARY:');
    console.log('✅ Tất cả 5 câu hỏi đã được test xong.');
    console.log('📝 Kiểm tra kết quả ở trên để xem chatbot có trả lời được không.');
}

// Chạy test
testAll5Questions().then(() => {
    console.log('\n🎉 Testing hoàn thành!');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Testing thất bại:', error.message);
    process.exit(1);
});
