// Test đơn giản cho 5 câu hỏi
const faqData = require('../src/data/faqData.json');

console.log('🔍 Checking FAQ data for 5 specific questions...\n');

const questions = [
    'Giá các khóa học tiếng Hàn bao nhiêu?',
    'Có thể trả góp học phí không?',
    'Một lớp học có bao nhiêu học viên?',
    'Có chính sách hoàn tiền không?',
    'Có chứng chỉ hoàn thành không?'
];

questions.forEach((question, index) => {
    console.log(`${index + 1}. ${question}`);
    
    // Tìm FAQ phù hợp
    const matchingFAQ = faqData.find(faq => {
        return faq.question.toLowerCase().includes(question.toLowerCase().substring(0, 10)) ||
               question.toLowerCase().includes(faq.question.toLowerCase().substring(0, 10));
    });
    
    if (matchingFAQ) {
        console.log(`   ✅ Found: "${matchingFAQ.question}"`);
        console.log(`   📂 Category: ${matchingFAQ.category}`);
    } else {
        console.log('   ❌ Not found in FAQ data');
    }
    console.log('');
});

console.log(`📊 Total FAQs in database: ${faqData.length}`);
console.log('\n📋 All FAQ questions:');
faqData.forEach((faq, index) => {
    console.log(`${index + 1}. ${faq.question} (${faq.category})`);
});
