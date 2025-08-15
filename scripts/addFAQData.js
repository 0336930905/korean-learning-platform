const mongoose = require('mongoose');
const FAQ = require('../src/models/FAQ');

// Connect to database
mongoose.connect('mongodb://localhost:27017/korea_learning', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleFAQs = [
    {
        question: "Giá khóa học tiếng Hàn như thế nào?",
        answer: "Học phí các khóa học tiếng Hàn dao động từ 2.000.000 - 5.000.000 VNĐ tùy theo cấp độ và thời lượng khóa học. Chúng tôi có các chương trình ưu đãi cho học viên đăng ký sớm và học viên cũ.",
        category: "Học phí",
        keywords: ["giá", "học phí", "chi phí", "tiền", "phí", "bao nhiêu", "giá cả"],
        priority: 5
    },
    {
        question: "Giá các khóa học tiếng Hàn bao nhiêu?",
        answer: "Học phí chi tiết:\n- Khóa cơ bản (50 giờ): 2.500.000 VNĐ\n- Khóa trung cấp (60 giờ): 3.200.000 VNĐ\n- Khóa nâng cao (70 giờ): 4.000.000 VNĐ\n- Khóa TOPIK (40 giờ): 2.800.000 VNĐ\n\nCó thể thanh toán một lần hoặc chia làm 2-3 đợt.",
        category: "Học phí", 
        keywords: ["giá", "bao nhiêu", "học phí", "chi phí", "phí học"],
        priority: 5
    },
    {
        question: "Có chính sách hoàn tiền không?",
        answer: "Có, chúng tôi có chính sách hoàn tiền linh hoạt:\n- Hoàn 100% nếu hủy trước khi khai giảng 7 ngày\n- Hoàn 80% nếu hủy trong tuần đầu học\n- Hoàn 50% nếu hủy trong 2 tuần đầu\n- Sau 2 tuần không hoàn tiền\n\nTrường hợp đặc biệt sẽ được xem xét riêng.",
        category: "Học phí",
        keywords: ["hoàn tiền", "hoàn phí", "hủy học", "chính sách", "refund"],
        priority: 4
    },
    {
        question: "Có thể trả góp học phí không?",
        answer: "Có, chúng tôi hỗ trợ trả góp học phí:\n- Trả 2 đợt: 60% khi đăng ký, 40% sau 1 tháng học\n- Trả 3 đợt: 50% khi đăng ký, 30% sau 1 tháng, 20% sau 2 tháng\n- Không tính phí trả góp\n- Cần đóng tối thiểu 50% để bắt đầu học",
        category: "Học phí",
        keywords: ["trả góp", "chia đợt", "thanh toán", "góp phần", "phân kỳ"],
        priority: 4
    },
    {
        question: "Một lớp học có bao nhiêu học viên?",
        answer: "Sĩ số lớp học được thiết kế tối ưu:\n- Lớp cơ bản: 12-15 học viên\n- Lớp trung cấp: 10-12 học viên  \n- Lớp nâng cao: 8-10 học viên\n- Lớp TOPIK: 6-8 học viên\n- Lớp VIP: 1-4 học viên\n\nSĩ số nhỏ giúp giảng viên chú ý đến từng học viên.",
        category: "Lớp học",
        keywords: ["sĩ số", "bao nhiêu học viên", "số lượng", "lớp học", "học sinh"],
        priority: 4
    },
    {
        question: "Có chứng chỉ hoàn thành không?",
        answer: "Có, chúng tôi cấp chứng chỉ hoàn thành cho tất cả học viên:\n- Chứng chỉ hoàn thành khóa học (đạt 80% số buổi học)\n- Chứng chỉ có xếp loại (Xuất sắc, Giỏi, Khá, TB)\n- Được công nhận bởi Hiệp hội tiếng Hàn Việt Nam\n- Có thể sử dụng để xin việc hoặc du học\n- Cấp trong vòng 1 tuần sau khi hoàn thành khóa học",
        category: "Chứng chỉ",
        keywords: ["chứng chỉ", "hoàn thành", "bằng cấp", "certificate", "công nhận"],
        priority: 5
    },
    {
        question: "Lịch học ra sao?",
        answer: "Chúng tôi có nhiều ca học linh hoạt: sáng (8h-10h), chiều (14h-16h), tối (19h-21h). Mỗi tuần học 3 buổi, mỗi buổi 2 tiếng. Bạn có thể chọn lịch phù hợp với thời gian của mình.",
        category: "Lịch học",
        keywords: ["lịch", "thời gian", "ca học", "buổi", "giờ"],
        priority: 5
    },
    {
        question: "Thông tin về giảng viên?",
        answer: "Đội ngũ giảng viên của chúng tôi đều có trình độ cao, bao gồm cả giảng viên người Việt và người Hàn Quốc. Tất cả đều có bằng cấp chuyên môn và kinh nghiệm giảng dạy ít nhất 3 năm.",
        category: "Giảng viên",
        keywords: ["giảng viên", "thầy", "cô", "giáo viên", "người dạy"],
        priority: 5
    },
    {
        question: "Cách đăng ký học?",
        answer: "Bạn có thể đăng ký trực tiếp tại trung tâm, qua điện thoại hotline 0999.xxx.xxx hoặc đăng ký online trên website. Chúng tôi sẽ tư vấn chi tiết về khóa học phù hợp với trình độ của bạn.",
        category: "Tuyển sinh",
        keywords: ["đăng ký", "ghi danh", "tham gia", "học"],
        priority: 5
    },
    {
        question: "Tài liệu học tập như thế nào?",
        answer: "Chúng tôi sử dụng giáo trình chính thống từ Hàn Quốc kết hợp với tài liệu tự biên soạn. Học viên sẽ được cung cấp đầy đủ sách giáo khoa, audio, video và tài liệu bổ trợ.",
        category: "Khóa học",
        keywords: ["tài liệu", "sách", "giáo trình", "audio", "video"],
        priority: 4
    },
    {
        question: "Có hỗ trợ học online không?",
        answer: "Có, chúng tôi có hỗ trợ học online qua Zoom hoặc Google Meet. Học viên có thể tham gia lớp học trực tuyến nếu không thể đến trung tâm.",
        category: "Hình thức học",
        keywords: ["online", "trực tuyến", "zoom", "meet", "từ xa"],
        priority: 4
    },
    {
        question: "Sĩ số lớp học như thế nào?",
        answer: "Mỗi lớp học có tối đa 15 học viên để đảm bảo chất lượng giảng dạy. Giảng viên có thể chú ý đến từng học viên và tương tác hiệu quả.",
        category: "Lớp học",
        keywords: ["sĩ số", "số lượng", "học viên", "lớp"],
        priority: 3
    },
    {
        question: "Có hỗ trợ tư vấn sau khóa học không?",
        answer: "Có, chúng tôi hỗ trợ tư vấn học tập và nghề nghiệp sau khi hoàn thành khóa học. Bạn có thể liên hệ bất cứ lúc nào để được hỗ trợ.",
        category: "Hỗ trợ",
        keywords: ["tư vấn", "hỗ trợ", "sau khóa học", "nghề nghiệp"],
        priority: 3
    },
    {
        question: "Có bài tập về nhà không?",
        answer: "Có, sau mỗi buổi học sẽ có bài tập về nhà để củng cố kiến thức. Giảng viên sẽ kiểm tra và chữa bài tập ở buổi học tiếp theo.",
        category: "Bài tập",
        keywords: ["bài tập", "homework", "về nhà", "luyện tập"],
        priority: 3
    }
];

async function addFAQData() {
    try {
        console.log('🔄 Đang thêm dữ liệu FAQ mẫu...');
        
        // Clear existing FAQ data
        await FAQ.deleteMany({});
        console.log('🗑️ Đã xóa dữ liệu FAQ cũ');
        
        // Insert sample data
        const result = await FAQ.insertMany(sampleFAQs);
        console.log(`✅ Đã thêm ${result.length} FAQ thành công!`);
        
        // Display added FAQs
        result.forEach((faq, index) => {
            console.log(`${index + 1}. [${faq.category}] ${faq.question}`);
        });
        
        console.log('\n🎉 Hoàn thành! Bây giờ chatbot sẽ sử dụng dữ liệu từ cơ sở dữ liệu.');
        
    } catch (error) {
        console.error('❌ Lỗi khi thêm dữ liệu FAQ:', error);
    } finally {
        mongoose.connection.close();
    }
}

addFAQData();
