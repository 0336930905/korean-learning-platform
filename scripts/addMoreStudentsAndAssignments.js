const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../src/models/User');
const Class = require('../src/models/class');
const Course = require('../src/models/Course');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/submission');
const Invoice = require('../src/models/Invoice');

// Kết nối database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Korea_DB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const TARGET_CLASS_ID = '687ec78caaf9af5e925a344e';

async function addMoreDemoData() {
    try {
        console.log('🚀 Bắt đầu thêm 10 học viên và 10 bài tập demo...');

        // 1. Kiểm tra lớp học có tồn tại không
        const targetClass = await Class.findById(TARGET_CLASS_ID).populate('course');
        if (!targetClass) {
            console.log('❌ Không tìm thấy lớp học với ID:', TARGET_CLASS_ID);
            return;
        }

        console.log('✅ Tìm thấy lớp học:', targetClass.name);
        console.log('📚 Khóa học:', targetClass.course.title);

        // 2. Tạo 10 học viên demo mới
        const newDemoStudents = [
            {
                email: 'vuthihuong.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Vũ Thị Hương',
                role: 'student',
                level: 'beginner',
                gender: 'female',
                dateOfBirth: new Date('1999-12-10'),
                phone: '0956789012',
                address: 'Hà Nội',
                koreanLevel: 'TOPIK 1',
                learningGoal: 'Làm việc tại Hàn Quốc',
                interests: ['K-beauty', 'K-food', 'Travel'],
                averageScore: 8.0,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'tranvanduc.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Trần Văn Đức',
                role: 'student',
                level: 'intermediate',
                gender: 'male',
                dateOfBirth: new Date('1997-08-25'),
                phone: '0967890123',
                address: 'TP.HCM',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Thi lên TOPIK 4',
                interests: ['Technology', 'Korean History', 'Sports'],
                averageScore: 7.8,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'lethilan.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Lê Thị Lan',
                role: 'student',
                level: 'beginner',
                gender: 'female',
                dateOfBirth: new Date('2000-03-18'),
                phone: '0978901234',
                address: 'Đà Nẵng',
                koreanLevel: '',
                learningGoal: 'Xem phim Hàn không cần phụ đề',
                interests: ['K-drama', 'K-pop', 'Shopping'],
                averageScore: 6.5,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'phamvanminh.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Phạm Văn Minh',
                role: 'student',
                level: 'advanced',
                gender: 'male',
                dateOfBirth: new Date('1995-06-12'),
                phone: '0989012345',
                address: 'Hải Phòng',
                koreanLevel: 'TOPIK 3',
                learningGoal: 'Đạt TOPIK 6',
                interests: ['Business', 'Literature', 'Art'],
                averageScore: 9.2,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'ngothithuy.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Ngô Thị Thủy',
                role: 'student',
                level: 'intermediate',
                gender: 'female',
                dateOfBirth: new Date('1998-11-05'),
                phone: '0990123456',
                address: 'Cần Thơ',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Du học Hàn Quốc năm sau',
                interests: ['Education', 'Culture', 'Language'],
                averageScore: 8.7,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'dobinhtran.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Đỗ Bình Trần',
                role: 'student',
                level: 'beginner',
                gender: 'male',
                dateOfBirth: new Date('2001-01-20'),
                phone: '0912345670',
                address: 'Huế',
                koreanLevel: 'TOPIK 1',
                learningGoal: 'Giao tiếp thành thạo',
                interests: ['Gaming', 'Anime', 'Music'],
                averageScore: 7.2,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'buithiyen.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Bùi Thị Yến',
                role: 'student',
                level: 'intermediate',
                gender: 'female',
                dateOfBirth: new Date('1996-09-14'),
                phone: '0923456781',
                address: 'Nha Trang',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Làm việc trong công ty Hàn',
                interests: ['Fashion', 'Design', 'Photography'],
                averageScore: 8.1,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'vuvanhai.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Vũ Văn Hải',
                role: 'student',
                level: 'advanced',
                gender: 'male',
                dateOfBirth: new Date('1994-12-03'),
                phone: '0934567892',
                address: 'Vũng Tàu',
                koreanLevel: 'TOPIK 4',
                learningGoal: 'Trở thành thông dịch viên',
                interests: ['Translation', 'Literature', 'Politics'],
                averageScore: 9.5,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'hoangthingoc.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Hoàng Thị Ngọc',
                role: 'student',
                level: 'beginner',
                gender: 'female',
                dateOfBirth: new Date('2000-07-28'),
                phone: '0945678903',
                address: 'Quảng Ninh',
                koreanLevel: '',
                learningGoal: 'Hiểu văn hóa Hàn Quốc',
                interests: ['Traditional culture', 'Food', 'Travel'],
                averageScore: 6.8,
                isActive: true,
                emailVerified: true
            },
            {
                email: 'lydinhkhanh.demo@gmail.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Lý Đình Khánh',
                role: 'student',
                level: 'intermediate',
                gender: 'male',
                dateOfBirth: new Date('1999-04-16'),
                phone: '0956789014',
                address: 'Thái Nguyên',
                koreanLevel: 'TOPIK 2',
                learningGoal: 'Học bổng du học Hàn',
                interests: ['Science', 'Research', 'Innovation'],
                averageScore: 8.3,
                isActive: true,
                emailVerified: true
            }
        ];

        // Tạo học viên mới
        const createdNewStudents = [];
        for (const studentData of newDemoStudents) {
            let existingStudent = await User.findOne({ email: studentData.email });
            if (!existingStudent) {
                const newStudent = new User(studentData);
                existingStudent = await newStudent.save();
                console.log('✅ Tạo học viên mới:', existingStudent.fullName);
            } else {
                console.log('📝 Học viên đã tồn tại:', existingStudent.fullName);
            }
            createdNewStudents.push(existingStudent);
        }

        // 3. Thêm học viên vào lớp và tạo hóa đơn thanh toán
        const coursePrice = targetClass.course.price;
        
        for (const student of createdNewStudents) {
            if (!targetClass.students.includes(student._id)) {
                targetClass.students.push(student._id);
                console.log('➕ Thêm học viên vào lớp:', student.fullName);
            }

            // Tạo hóa đơn thanh toán
            const existingInvoice = await Invoice.findOne({
                student: student._id,
                course: targetClass.course._id
            });

            if (!existingInvoice) {
                const invoice = new Invoice({
                    student: student._id,
                    course: targetClass.course._id,
                    amount: coursePrice,
                    paymentMethod: ['zalopay_app', 'zalopay_qr', 'zalopay_cc', 'zalopay_atm'][Math.floor(Math.random() * 4)],
                    status: 'paid',
                    transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                    paidAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000)
                });
                await invoice.save();
                console.log('💰 Tạo hóa đơn thanh toán cho:', student.fullName);
            }
        }

        await targetClass.save();

        // 4. Xóa assignments cũ chưa được chấm điểm
        console.log('\n🗑️ Xóa bài tập cũ chưa được chấm điểm...');
        const oldAssignments = await Assignment.find({ class: TARGET_CLASS_ID });
        
        for (const assignment of oldAssignments) {
            // Xóa submissions liên quan
            await Submission.deleteMany({ assignment: assignment._id });
            await Assignment.findByIdAndDelete(assignment._id);
            console.log('🗑️ Đã xóa bài tập:', assignment.title);
        }

        // 5. Tạo 10 bài tập mới với submissions đã chấm điểm
        console.log('\n📝 Tạo 10 bài tập mới...');
        const assignmentTitles = [
            'Bài tập 1: Học bảng chữ cái Hangul',
            'Bài tập 2: Từ vựng về gia đình',
            'Bài tập 3: Ngữ pháp thì hiện tại',
            'Bài tập 4: Hội thoại chào hỏi',
            'Bài tập 5: Số đếm và thời gian',
            'Bài tập 6: Từ vựng về màu sắc',
            'Bài tập 7: Ngữ pháp sở hữu cách',
            'Bài tập 8: Hội thoại mua sắm',
            'Bài tập 9: Từ vựng về thức ăn',
            'Bài tập 10: Bài kiểm tra tổng hợp'
        ];

        const assignmentDescriptions = [
            'Viết và phát âm 40 chữ cái cơ bản của tiếng Hàn',
            'Học thuộc 20 từ vựng về các thành viên trong gia đình',
            'Chia động từ ở thì hiện tại và tạo 10 câu ví dụ',
            'Thực hành hội thoại chào hỏi và giới thiệu bản thân',
            'Đọc và viết số từ 1-100, nói giờ và ngày tháng',
            'Học 15 từ vựng về màu sắc và mô tả đồ vật',
            'Sử dụng sở hữu cách 의 trong câu và làm bài tập',
            'Thực hành hội thoại mua sắm tại cửa hàng',
            'Học 25 từ vựng về thức ăn và đồ uống Hàn Quốc',
            'Kiểm tra tổng hợp kiến thức đã học trong 9 bài trước'
        ];

        // Lấy tất cả học viên trong lớp
        const allStudents = await User.find({ _id: { $in: targetClass.students } });
        
        for (let i = 0; i < 10; i++) {
            // Tạo assignment
            const assignment = new Assignment({
                title: assignmentTitles[i],
                description: assignmentDescriptions[i],
                dueDate: new Date(Date.now() - (10 - i) * 7 * 24 * 60 * 60 * 1000), // 10 tuần trước đến 1 tuần trước
                class: TARGET_CLASS_ID,
                createdBy: targetClass.teacher,
                maxScore: 10,
                status: 'active'
            });

            const savedAssignment = await assignment.save();
            targetClass.assignments.push(savedAssignment._id);
            console.log('📝 Tạo bài tập:', assignmentTitles[i]);

            // Tạo submissions cho từng học viên với điểm ngẫu nhiên
            let totalScore = 0;
            let submissionCount = 0;

            for (const student of allStudents) {
                // 90% học viên nộp bài
                if (Math.random() > 0.1) {
                    const score = Math.round((5 + Math.random() * 5) * 10) / 10; // Điểm từ 5.0 đến 10.0
                    const isLate = Math.random() > 0.8; // 20% nộp muộn
                    
                    const submission = new Submission({
                        assignment: savedAssignment._id,
                        student: student._id,
                        fileName: `baitap_${i + 1}_${student.fullName.replace(/\s+/g, '')}.pdf`,
                        fileType: 'application/pdf',
                        submittedAt: new Date(savedAssignment.dueDate.getTime() + (isLate ? Math.random() * 3 * 24 * 60 * 60 * 1000 : -Math.random() * 24 * 60 * 60 * 1000)),
                        status: 'graded',
                        grade: {
                            score: score,
                            percentage: (score / 10) * 100,
                            feedback: generateFeedback(score),
                            gradedAt: new Date(savedAssignment.dueDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
                            gradedBy: targetClass.teacher
                        },
                        isLate: isLate
                    });

                    await submission.save();
                    totalScore += score;
                    submissionCount++;
                }
            }

            // Cập nhật statistics cho assignment
            const averageScore = submissionCount > 0 ? totalScore / submissionCount : 0;
            await Assignment.findByIdAndUpdate(savedAssignment._id, {
                $set: {
                    'submissionStats.totalSubmissions': submissionCount,
                    'submissionStats.gradedSubmissions': submissionCount,
                    'submissionStats.averageScore': averageScore
                }
            });

            console.log(`   📊 ${submissionCount}/${allStudents.length} học viên nộp bài, điểm TB: ${averageScore.toFixed(1)}`);
        }

        await targetClass.save();

        console.log('\n🎉 HOÀN THÀNH! Đã thêm dữ liệu demo:');
        console.log(`👥 Thêm ${createdNewStudents.length} học viên mới`);
        console.log(`📝 Tạo 10 bài tập với submissions đã chấm điểm`);
        console.log(`💰 Tạo ${createdNewStudents.length} hóa đơn thanh toán`);
        console.log(`🎯 Tổng số học viên trong lớp: ${targetClass.students.length}`);

    } catch (error) {
        console.error('❌ Lỗi khi thêm dữ liệu demo:', error);
    } finally {
        mongoose.connection.close();
    }
}

function generateFeedback(score) {
    if (score >= 9) return 'Xuất sắc! Bài làm rất tốt, nắm vững kiến thức.';
    if (score >= 8) return 'Tốt! Bài làm khá ổn, cần chú ý một vài chi tiết nhỏ.';
    if (score >= 7) return 'Khá! Đã hiểu bài nhưng cần luyện tập thêm.';
    if (score >= 6) return 'Đạt! Cần ôn tập và cải thiện kỹ năng.';
    return 'Cần cố gắng hơn! Hãy ôn tập kỹ và hỏi thầy cô khi có thắc mắc.';
}

// Chạy script
addMoreDemoData();
