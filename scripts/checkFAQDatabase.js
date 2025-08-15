const mongoose = require('mongoose');
const FAQ = require('../src/models/FAQ');

async function checkFAQs() {
    try {
        await mongoose.connect('mongodb://localhost:27017/korea_db');
        console.log('🔗 Đã kết nối MongoDB');
        
        const questions = [
            'Có chứng chỉ hoàn thành không?',
            'Giá các khóa học tiếng Hàn bao nhiêu?',
            'Một lớp học có bao nhiêu học viên?',
            'Có thể trả góp học phí không?',
            'Có chính sách hoàn tiền không?'
        ];
        
        console.log('🔍 Kiểm tra các câu hỏi trong database:');
        let missingQuestions = [];
        
        for (const question of questions) {
            // Tìm kiếm với regex linh hoạt hơn
            const faq = await FAQ.findOne({ 
                $or: [
                    { question: { $regex: question.replace(/[?]/g, '').replace(/\s+/g, '.*'), $options: 'i' }},
                    { keywords: { $in: question.split(' ').filter(word => word.length > 2) }}
                ]
            });
            
            console.log(`${faq ? '✅' : '❌'} ${question}`);
            if (faq) {
                console.log(`   Câu hỏi trong DB: ${faq.question}`);
                console.log(`   Category: ${faq.category}, Keywords: ${faq.keywords.join(', ')}`);
            } else {
                missingQuestions.push(question);
            }
        }
        
        const totalFAQs = await FAQ.countDocuments();
        console.log(`\n📊 Tổng số FAQ trong database: ${totalFAQs}`);
        
        if (missingQuestions.length > 0) {
            console.log('\n❌ Các câu hỏi còn thiếu:');
            missingQuestions.forEach(q => console.log(`   - ${q}`));
        } else {
            console.log('\n✅ Tất cả câu hỏi đã có trong database!');
        }
        
        // Hiển thị một số FAQ mẫu để kiểm tra
        console.log('\n📋 Một số FAQ hiện có:');
        const sampleFAQs = await FAQ.find().limit(5);
        sampleFAQs.forEach(faq => {
            console.log(`   - ${faq.question} (${faq.category})`);
        });
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

checkFAQs();
