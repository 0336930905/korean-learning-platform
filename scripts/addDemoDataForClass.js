const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../src/models/User');
const Class = require('../src/models/class');
const Course = require('../src/models/Course');
const Document = require('../src/models/document');
const ClassTest = require('../src/models/ClassTest');
const Invoice = require('../src/models/Invoice');
const Assignment = require('../src/models/Assignment');

// Kết nối database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Korea_DB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const TARGET_CLASS_ID = '687ec78caaf9af5e925a344e';

async function addDemoData() {
    try {
        console.log('🚀 Bắt đầu thêm dữ liệu demo cho lớp học...');

        // 1. Kiểm tra lớp học có tồn tại không
        const targetClass = await Class.findById(TARGET_CLASS_ID).populate('course');
        if (!targetClass) {
            console.log('❌ Không tìm thấy lớp học với ID:', TARGET_CLASS_ID);
            return;
        }

        console.log('✅ Tìm thấy lớp học:', targetClass.name);
        console.log('📚 Khóa học:', targetClass.course.title);

        // 2. Tạo học viên demo (nếu chưa có)
        const demoStudents = [
            {
                email: 'nguyenvana.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Nguyễn Văn A',
                role: 'student',
                level: 'beginner',
                gender: 'male',
                dateOfBirth: new Date('1995-03-15'),
                phone: '0901234567',
                address: 'Hà Nội',
                koreanLevel: 'TOPIK 1',
                learningGoal: 'Giao tiếp cơ bản tiếng Hàn',
                interests: ['K-Pop', 'Phim Hàn', 'Du lịch'],
                averageScore: 7.5,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'tranthib.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Trần Thị B',
                role: 'student',
                level: 'beginner',
                gender: 'female',
                dateOfBirth: new Date('1998-07-22'),
                phone: '0912345678',
                address: 'TP.HCM',
                koreanLevel: 'TOPIK 1',
                learningGoal: 'Học để đi du học Hàn Quốc',
                interests: ['Drama Hàn', 'Ẩm thực Hàn', 'Văn hóa Hàn'],
                averageScore: 8.2,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'leminhtuan.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Lê Minh Tuấn',
                role: 'student',
                level: 'intermediate',
                gender: 'male',
                dateOfBirth: new Date('1997-11-08'),
                phone: '0923456789',
                address: 'Đà Nẵng',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Nâng cao trình độ tiếng Hàn',
                interests: ['Công nghệ', 'Game Hàn Quốc', 'Anime'],
                averageScore: 6.8,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'phamthimai.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Phạm Thị Mai',
                role: 'student',
                level: 'beginner',
                gender: 'female',
                dateOfBirth: new Date('1999-01-12'),
                phone: '0934567890',
                address: 'Hải Phòng',
                koreanLevel: '',
                learningGoal: 'Bắt đầu học tiếng Hàn từ cơ bản',
                interests: ['Beauty Hàn Quốc', 'Fashion', 'Music'],
                averageScore: 7.0,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'hoangvannam.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Hoàng Văn Nam',
                role: 'student',
                level: 'intermediate',
                gender: 'male',
                dateOfBirth: new Date('1996-05-30'),
                phone: '0945678901',
                address: 'Cần Thơ',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Chuẩn bị cho kỳ thi TOPIK 3',
                interests: ['Lịch sử Hàn Quốc', 'Taekwondo', 'Business'],
                averageScore: 8.5,
                isActive: true,
                emailVerified: true
            }
        ];

        const createdStudents = [];
        for (const studentData of demoStudents) {
            // Kiểm tra xem học viên đã tồn tại chưa
            let existingStudent = await User.findOne({ email: studentData.email });
            if (!existingStudent) {
                const newStudent = new User(studentData);
                existingStudent = await newStudent.save();
                console.log('✅ Tạo học viên mới:', existingStudent.fullName);
            } else {
                console.log('📝 Học viên đã tồn tại:', existingStudent.fullName);
            }
            createdStudents.push(existingStudent);
        }

        // 3. Thêm học viên vào lớp và tạo hóa đơn thanh toán
        const coursePrice = targetClass.course.price;
        
        for (const student of createdStudents) {
            // Kiểm tra xem học viên đã ở trong lớp chưa
            if (!targetClass.students.includes(student._id)) {
                targetClass.students.push(student._id);
                console.log('➕ Thêm học viên vào lớp:', student.fullName);
            }

            // Tạo hóa đơn thanh toán (đã thanh toán)
            const existingInvoice = await Invoice.findOne({
                student: student._id,
                course: targetClass.course._id
            });

            if (!existingInvoice) {
                const invoice = new Invoice({
                    student: student._id,
                    course: targetClass.course._id,
                    amount: coursePrice,
                    paymentMethod: ['zalopay_app', 'zalopay_qr', 'zalopay_cc'][Math.floor(Math.random() * 3)],
                    status: 'paid',
                    transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                    paidAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Ngẫu nhiên trong 30 ngày qua
                    createdAt: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000)
                });
                await invoice.save();
                console.log('💰 Tạo hóa đơn thanh toán cho:', student.fullName);
            }
        }

        // Lưu lớp học với danh sách học viên mới
        await targetClass.save();

        // 4. Tạo tài liệu cho lớp học
        const documents = [
            {
                class: targetClass._id,
                title: 'Bài giảng số 1 - Chào hỏi cơ bản',
                description: 'Tài liệu hướng dẫn các cách chào hỏi cơ bản trong tiếng Hàn',
                fileName: 'bai_giang_chao_hoi_co_ban.pdf',
                originalName: 'Bài giảng chào hỏi cơ bản.pdf',
                uploadedBy: targetClass.teacher,
                category: 'speaking'
            },
            {
                class: targetClass._id,
                title: 'Từ vựng bài 1 - Gia đình',
                description: 'Danh sách từ vựng về gia đình và các mối quan hệ',
                fileName: 'tu_vung_gia_dinh.pdf',
                originalName: 'Từ vựng gia đình.pdf',
                uploadedBy: targetClass.teacher,
                category: 'vocabulary'
            },
            {
                class: targetClass._id,
                title: 'Bài tập nghe - Hội thoại hàng ngày',
                description: 'Bài tập luyện nghe với các tình huống giao tiếp hàng ngày',
                fileName: 'bai_tap_nghe_hoi_thoai.mp3',
                originalName: 'Bài tập nghe hội thoại.mp3',
                uploadedBy: targetClass.teacher,
                category: 'listening'
            },
            {
                class: targetClass._id,
                title: 'Hướng dẫn viết Hangul',
                description: 'Tài liệu hướng dẫn cách viết bảng chữ cái Hangul',
                fileName: 'huong_dan_viet_hangul.pdf',
                originalName: 'Hướng dẫn viết Hangul.pdf',
                uploadedBy: targetClass.teacher,
                category: 'writing'
            },
            {
                class: targetClass._id,
                title: 'Ngữ pháp cơ bản - Thì hiện tại',
                description: 'Bài giảng về cách sử dụng thì hiện tại trong tiếng Hàn',
                fileName: 'ngu_phap_thi_hien_tai.pdf',
                originalName: 'Ngữ pháp thì hiện tại.pdf',
                uploadedBy: targetClass.teacher,
                category: 'vocabulary'
            }
        ];

        for (const docData of documents) {
            const existingDoc = await Document.findOne({
                class: docData.class,
                title: docData.title
            });

            if (!existingDoc) {
                const document = new Document(docData);
                await document.save();
                console.log('📄 Tạo tài liệu:', docData.title);
            } else {
                console.log('📄 Tài liệu đã tồn tại:', docData.title);
            }
        }

        // 5. Tạo bài kiểm tra với điểm số đã chấm
        const testData = {
            class: targetClass._id,
            testName: 'Kiểm tra giữa kỳ - Từ vựng và ngữ pháp cơ bản',
            testDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
            maxScore: 10,
            createdBy: targetClass.teacher,
            scores: []
        };

        // Tạo điểm cho từng học viên
        const gradeComments = [
            'Làm bài rất tốt, nắm vững kiến thức cơ bản',
            'Cần cải thiện phần ngữ pháp',
            'Từ vựng tốt, ngữ pháp cần luyện tập thêm',
            'Tiến bộ rõ rệt so với bài trước',
            'Cần ôn tập thêm và tham gia lớp tích cực hơn'
        ];

        for (let i = 0; i < createdStudents.length; i++) {
            const student = createdStudents[i];
            // Tạo điểm ngẫu nhiên trong khoảng hợp lý (5.5 - 9.5)
            const score = Math.round((5.5 + Math.random() * 4) * 10) / 10;
            
            testData.scores.push({
                student: student._id,
                score: score,
                notes: gradeComments[i] || 'Cần cố gắng hơn',
                gradedBy: targetClass.teacher,
                gradedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) // Chấm trong 3 ngày qua
            });
        }

        // Kiểm tra xem bài test đã tồn tại chưa
        const existingTest = await ClassTest.findOne({
            class: targetClass._id,
            testName: testData.testName
        });

        if (!existingTest) {
            const classTest = new ClassTest(testData);
            await classTest.save();
            console.log('📝 Tạo bài kiểm tra với điểm số đã chấm');
        } else {
            console.log('📝 Bài kiểm tra đã tồn tại');
        }

        // 6. Tạo thêm một bài kiểm tra khác
        const test2Data = {
            class: targetClass._id,
            testName: 'Bài kiểm tra speaking - Giao tiếp cơ bản',
            testDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 ngày trước
            maxScore: 10,
            createdBy: targetClass.teacher,
            scores: []
        };

        const speakingComments = [
            'Phát âm chuẩn, tự tin khi giao tiếp',
            'Cần luyện phát âm nhiều hơn',
            'Từ vựng phong phú, giao tiếp tự nhiên',
            'Cải thiện đáng kể về khả năng nghe hiểu',
            'Cần tự tin hơn khi nói'
        ];

        for (let i = 0; i < createdStudents.length; i++) {
            const student = createdStudents[i];
            // Điểm speaking thường khác với điểm viết
            const score = Math.round((6 + Math.random() * 3.5) * 10) / 10;
            
            test2Data.scores.push({
                student: student._id,
                score: score,
                notes: speakingComments[i] || 'Cần luyện tập thêm',
                gradedBy: targetClass.teacher,
                gradedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
            });
        }

        const existingTest2 = await ClassTest.findOne({
            class: targetClass._id,
            testName: test2Data.testName
        });

        if (!existingTest2) {
            const classTest2 = new ClassTest(test2Data);
            await classTest2.save();
            console.log('📝 Tạo bài kiểm tra speaking với điểm số đã chấm');
        } else {
            console.log('📝 Bài kiểm tra speaking đã tồn tại');
        }

        console.log('\n🎉 HOÀN THÀNH! Dữ liệu demo đã được thêm vào lớp học:');
        console.log(`📚 Lớp: ${targetClass.name}`);
        console.log(`👥 Số học viên: ${createdStudents.length}`);
        console.log(`📄 Tài liệu: ${documents.length} files`);
        console.log(`📝 Bài kiểm tra: 2 bài (đã chấm điểm)`);
        console.log(`💰 Hóa đơn: ${createdStudents.length} hóa đơn đã thanh toán`);

    } catch (error) {
        console.error('❌ Lỗi khi thêm dữ liệu demo:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Chạy script
addDemoData();
