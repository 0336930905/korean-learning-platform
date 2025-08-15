const mongoose = require('mongoose');
const FAQ = require('../src/models/FAQ');

async function testFAQDatabase() {
    try {
        // Connect to database
        await mongoose.connect('mongodb://localhost:27017/korea_learning', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Kết nối database thành công');

        // Test 1: Kiểm tra số lượng FAQ
        const faqCount = await FAQ.countDocuments({ isActive: true });
        console.log('📊 Số lượng FAQ trong database:', faqCount);

        // Test 2: Lấy danh sách FAQ
        const faqs = await FAQ.find({ isActive: true }).limit(5);
        console.log('\n📋 Danh sách 5 FAQ đầu tiên:');
        faqs.forEach((faq, index) => {
            console.log(`${index + 1}. [${faq.category}] ${faq.question}`);
            console.log(`   Keywords: ${faq.keywords.join(', ')}`);
        });

        // Test 3: Tìm kiếm FAQ với các câu hỏi cụ thể
        const testQuestions = [
            'gia cac khoa hoc tieng han bao nhieu',
            'co chinh sach hoan tien khong',
            'mot lop hoc co bao nhieu hoc vien',
            'co the tra gop hoc phi khong',
            'co chung chi hoan thanh khong'
        ];

        console.log('\n🔍 Test tìm kiếm:');
        for (const question of testQuestions) {
            const results = await FAQ.find({
                $or: [
                    { question: { $regex: question, $options: 'i' } },
                    { keywords: { $in: [new RegExp(question, 'i')] } },
                    { answer: { $regex: question, $options: 'i' } }
                ],
                isActive: true
            });
            
            console.log(`\n❓ "${question}" → Tìm thấy: ${results.length} kết quả`);
            if (results.length > 0) {
                console.log(`   Tốt nhất: ${results[0].question}`);
            }
        }

        mongoose.connection.close();
        console.log('\n🎉 Test hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi:', error);
        mongoose.connection.close();
    }
}

testFAQDatabase();
