const mongoose = require('mongoose');
const FAQ = require('../src/models/FAQ');

const faqData = [
    // 5 câu hỏi cụ thể của user
    {
        question: "Có chứng chỉ hoàn thành không?",
        answer: "**Có!** Chúng tôi cấp chứng chỉ hoàn thành cho tất cả học viên kết thúc khóa học.\n\n🏆 **Loại chứng chỉ:**\n- Chứng nhận hoàn thành khóa học từ Korea_DB\n- Chứng chỉ có giá trị chính thức\n- Được công nhận bởi các doanh nghiệp\n\n📜 **Điều kiện nhận chứng chỉ:**\n- Tham gia đầy đủ ít nhất 80% buổi học\n- Hoàn thành các bài tập và kiểm tra\n- Đạt điểm trung bình từ 6.0 trở lên\n\n⏰ **Thời gian cấp:** 1-2 tuần sau khi hoàn thành khóa học",
        category: "Chứng chỉ",
        keywords: ["chứng chỉ", "hoàn thành", "certificate", "bằng cấp", "công nhận"],
        priority: 5
    },
    {
        question: "Giá các khóa học tiếng Hàn bao nhiêu?",
        answer: "💰 **Học phí các khóa học tiếng Hàn:**\n\n📚 **Khóa cơ bản (A1-A2):** 2.500.000 - 3.500.000 VNĐ\n🚀 **Khóa trung cấp (B1-B2):** 3.500.000 - 4.500.000 VNĐ\n🎯 **Khóa nâng cao (C1-C2):** 4.500.000 - 5.500.000 VNĐ\n🏆 **Khóa luyện thi TOPIK:** 3.000.000 - 4.000.000 VNĐ\n💼 **Tiếng Hàn thương mại:** 5.000.000 - 6.000.000 VNĐ\n\n🎁 **Ưu đãi đặc biệt:**\n- Giảm 10% cho học viên đăng ký sớm\n- Giảm 15% khi đăng ký 2 khóa trở lên\n- Giảm 20% cho nhóm từ 3 người\n\n💡 *Học phí đã bao gồm tài liệu học tập*",
        category: "Học phí",
        keywords: ["giá", "học phí", "chi phí", "tiền", "cost", "price", "bao nhiêu"],
        priority: 5
    },
    {
        question: "Một lớp học có bao nhiêu học viên?",
        answer: "👥 **Sĩ số lớp học tại Korea_DB:**\n\n📊 **Lớp tiêu chuẩn:** 8-12 học viên/lớp\n🎯 **Lớp nhỏ:** 4-6 học viên/lớp (phụ phí 20%)\n👑 **Lớp VIP:** 1-3 học viên/lớp (phụ phí 50%)\n\n✅ **Ưu điểm sĩ số nhỏ:**\n- Được chú ý và hỗ trợ cá nhân nhiều hơn\n- Có nhiều cơ hội thực hành giao tiếp\n- Tiến độ học nhanh và hiệu quả\n- Không khí học tập thân thiện\n\n📝 **Lưu ý:** Chúng tôi cam kết không quá 15 học viên/lớp để đảm bảo chất lượng giảng dạy",
        category: "Lớp học",
        keywords: ["sĩ số", "lớp học", "học viên", "bao nhiêu người", "class size"],
        priority: 4
    },
    {
        question: "Có thể trả góp học phí không?",
        answer: "💳 **Có! Chúng tôi hỗ trợ trả góp học phí linh hoạt:**\n\n📋 **Các gói trả góp:**\n- **Trả 2 kỳ:** 50% khi đăng ký + 50% sau 1 tháng\n- **Trả 3 kỳ:** 40% + 30% + 30% (mỗi tháng)\n- **Trả 4 kỳ:** 30% + 25% + 25% + 20%\n\n✅ **Điều kiện:**\n- Đặt cọc tối thiểu 30% khi đăng ký\n- Có giấy tờ tùy thân hợp lệ\n- Cam kết hoàn thành khóa học\n\n🎁 **Ưu đãi:** Không tính lãi suất cho gói trả 2-3 kỳ\n💰 **Phí dịch vụ:** 100.000 VNĐ cho gói trả 4 kỳ\n\n📞 **Liên hệ:** Tư vấn viên sẽ hỗ trợ thủ tục trả góp",
        category: "Học phí",
        keywords: ["trả góp", "góp", "chia nhỏ", "installment", "payment plan"],
        priority: 4
    },
    {
        question: "Có chính sách hoàn tiền không?",
        answer: "🔄 **Có! Chúng tôi có chính sách hoàn tiền rõ ràng:**\n\n💯 **Hoàn tiền 100%:**\n- Hủy trước khi khóa học bắt đầu (trừ phí xử lý 200.000 VNĐ)\n- Trung tâm hủy khóa do không đủ sĩ số\n\n🔢 **Hoàn tiền theo tỷ lệ:**\n- **Tuần 1:** Hoàn 80% học phí\n- **Tuần 2:** Hoàn 60% học phí  \n- **Tuần 3:** Hoàn 40% học phí\n- **Sau tuần 4:** Không hoàn tiền\n\n⚠️ **Điều kiện hoàn tiền:**\n- Có lý do chính đáng (ốm đau, công tác...)\n- Thông báo bằng văn bản\n- Còn giữ hóa đơn và hợp đồng\n\n⏰ **Thời gian xử lý:** 7-14 ngày làm việc",
        category: "Học phí",
        keywords: ["hoàn tiền", "hoàn phí", "refund", "hủy khóa", "chính sách"],
        priority: 4
    },
    
    // Thêm một số FAQ phổ biến khác để chatbot hoạt động tốt hơn
    {
        question: "Lịch học như thế nào?",
        answer: "📅 **Lịch học linh hoạt tại Korea_DB:**\n\n🌅 **Ca sáng:** 8:00-10:00 hoặc 10:15-12:15\n🌞 **Ca chiều:** 14:00-16:00 hoặc 16:15-18:15  \n🌙 **Ca tối:** 18:30-20:30 hoặc 20:45-22:45\n\n📊 **Tần suất:** 3 buổi/tuần (Thứ 2-4-6 hoặc Thứ 3-5-7)\n⏰ **Thời lượng:** 2 tiếng/buổi\n📚 **Tổng thời gian khóa:** 3-4 tháng\n\n🔄 **Linh hoạt:** Có thể chuyển ca học khi cần thiết",
        category: "Lịch học",
        keywords: ["lịch học", "thời gian", "ca học", "schedule", "buổi học"],
        priority: 5
    },
    {
        question: "Giảng viên như thế nào?",
        answer: "👨‍🏫 **Đội ngũ giảng viên chuyên nghiệp:**\n\n🎓 **Trình độ:**\n- Tốt nghiệp chuyên ngành Hàn Quốc học\n- Có chứng chỉ TOPIK level 6\n- Kinh nghiệm giảng dạy 3+ năm\n\n🇰🇷 **Giảng viên người Hàn:**\n- 30% giảng viên là người Hàn Quốc\n- Phát âm chuẩn, văn hóa địa phương\n- Hỗ trợ giao tiếp thực tế\n\n✨ **Phương pháp giảng dạy:**\n- Tương tác 2 chiều\n- Kết hợp game và hoạt động nhóm\n- Thực hành giao tiếp thực tế",
        category: "Giảng viên",
        keywords: ["giảng viên", "thầy cô", "teacher", "người Hàn", "trình độ"],
        priority: 5
    },
    {
        question: "Cách đăng ký học như thế nào?",
        answer: "📝 **Quy trình đăng ký đơn giản:**\n\n**Bước 1:** Tư vấn và kiểm tra trình độ\n**Bước 2:** Chọn khóa học phù hợp\n**Bước 3:** Điền form đăng ký\n**Bước 4:** Đóng học phí\n**Bước 5:** Nhận lịch học và tài liệu\n\n📋 **Giấy tờ cần thiết:**\n- CMND/CCCD photo\n- 2 ảnh 3x4\n- Hợp đồng học tập\n\n💻 **Đăng ký online:** Có hỗ trợ đăng ký qua website\n📞 **Hotline:** 1900-xxxx (8:00-20:00)",
        category: "Tuyển sinh",
        keywords: ["đăng ký", "tham gia", "registration", "thủ tục", "giấy tờ"],
        priority: 5
    },
    {
        question: "Có hỗ trợ học online không?",
        answer: "💻 **Có! Chúng tôi hỗ trợ học online hiện đại:**\n\n📱 **Nền tảng học:**\n- Zoom/Google Meet chất lượng HD\n- App học tập riêng cho Korea_DB\n- Tài liệu số tương tác\n\n🔄 **Hình thức học:**\n- **Online 100%:** Học hoàn toàn trực tuyến\n- **Blended:** Kết hợp online + offline\n- **Hỗ trợ:** Ghi lại bài học để ôn tập\n\n✅ **Ưu điểm:**\n- Tiết kiệm thời gian di chuyển\n- Học mọi lúc, mọi nơi\n- Tương tác trực tiếp với giảng viên\n- Học phí ưu đãi hơn 10%",
        category: "Hình thức học",
        keywords: ["online", "trực tuyến", "zoom", "học từ xa", "digital"],
        priority: 4
    },
    {
        question: "Có những khóa học nào?",
        answer: "📚 **Các khóa học đa dạng tại Korea_DB:**\n\n🌱 **Khóa cơ bản (A1-A2):**\n- Bảng chữ cái Hangeul\n- Từ vựng và ngữ pháp cơ bản\n- Giao tiếp hàng ngày\n\n🚀 **Khóa trung-nâng cao (B1-C2):**\n- Ngữ pháp phức tạp\n- Từ vựng chuyên ngành\n- Kỹ năng đọc-viết-nghe-nói\n\n🎯 **Khóa chuyên biệt:**\n- Luyện thi TOPIK\n- Tiếng Hàn thương mại\n- Tiếng Hàn du lịch\n- Khóa cho trẻ em\n\n🎨 **Khóa văn hóa:** Tìm hiểu văn hóa Hàn Quốc",
        category: "Khóa học",
        keywords: ["khóa học", "course", "chương trình", "TOPIK", "cơ bản", "nâng cao"],
        priority: 5
    }
];

async function addFAQData() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/Korea_DB');
        console.log('✅ Đã kết nối thành công!');

        // Xóa dữ liệu cũ (nếu có)
        await FAQ.deleteMany({});
        console.log('🗑️ Đã xóa dữ liệu FAQ cũ');

        // Thêm dữ liệu mới
        console.log('📝 Đang thêm FAQ mới...');
        const result = await FAQ.insertMany(faqData);
        console.log(`✅ Đã thêm ${result.length} FAQ thành công!`);

        // Hiển thị thống kê
        const stats = await FAQ.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\n📊 Thống kê FAQ theo danh mục:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} câu hỏi`);
        });

        // Kiểm tra 5 câu hỏi cụ thể
        console.log('\n🔍 Kiểm tra 5 câu hỏi cụ thể:');
        const targetQuestions = [
            'Có chứng chỉ hoàn thành không?',
            'Giá các khóa học tiếng Hàn bao nhiêu?',
            'Một lớp học có bao nhiêu học viên?',
            'Có thể trả góp học phí không?',
            'Có chính sách hoàn tiền không?'
        ];

        for (const question of targetQuestions) {
            const faq = await FAQ.findOne({ question });
            console.log(`${faq ? '✅' : '❌'} ${question}`);
        }

        await mongoose.disconnect();
        console.log('\n🎉 Hoàn thành việc cập nhật database FAQ!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

addFAQData();
