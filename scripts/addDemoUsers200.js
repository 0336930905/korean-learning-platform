const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/korea-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Danh sách tên Việt Nam phổ biến
const vietnameseNames = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
    'Vũ Thị Phương', 'Đặng Văn Giang', 'Bùi Thị Hoa', 'Đỗ Văn Khang', 'Lý Thị Lan',
    'Ngô Văn Minh', 'Tôn Thị Nga', 'Mai Văn Phúc', 'Đinh Thị Quỳnh', 'Chu Văn Sơn',
    'Phan Thị Trang', 'Võ Văn Tài', 'Đào Thị Uyên', 'Trịnh Văn Vinh', 'Lưu Thị Yến',
    'Kiều Văn Bảo', 'Hồ Thị Cẩm', 'Dương Văn Đức', 'Lâm Thị Hằng', 'Nông Văn Hùng',
    'Từ Thị Kim', 'Ông Văn Long', 'Điều Thị Mai', 'Thân Văn Nam', 'Phùng Thị Oanh',
    'Cao Văn Phong', 'Hà Thị Quân', 'Lạc Văn Rồng', 'Đoàn Thị Sương', 'Thiều Văn Tuấn',
    'Ưng Thị Vân', 'Nghiêm Văn Xuân', 'Lưỡng Thị Yên', 'Vương Văn Ân', 'Khúc Thị Bảo'
];

// Mở rộng danh sách họ và tên
const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Văn', 'Thị', 'Đức', 'Minh', 'Hữu', 'Công', 'Quang', 'Tuấn', 'Hùng', 'Khắc'];
const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phương', 'Giang', 'Hoa', 'Khang', 'Lan', 'Minh', 'Nga', 'Phúc', 'Quỳnh', 'Sơn', 'Trang', 'Tài', 'Uyên', 'Vinh', 'Yến', 'Đạt', 'Hạnh', 'Khánh', 'Linh', 'Nam', 'Oanh', 'Phong', 'Quân', 'Sáng', 'Tùng', 'Vy', 'Xuân', 'Yên', 'Ánh', 'Bảo', 'Chi', 'Đông', 'Hằng', 'Kim', 'Lâm'];

function generateRandomName() {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    return `${surname} ${middleName} ${firstName}`;
}

function generateRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Tạo email unique
function generateUniqueEmail(index, date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'edu.vn', 'student.hust.edu.vn'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `demo${index}_${day}${month}@${domain}`;
}

async function createDemoUsers() {
    try {
        console.log('🚀 Bắt đầu tạo 200 tài khoản demo từ 01-07 đến 17-07...');
        
        // Xóa dữ liệu demo cũ nếu có (chỉ xóa users có email chứa "demo")
        await User.deleteMany({ 
            email: { $regex: /^demo\d+_/i }
        });
        
        const users = [];
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        // Khoảng thời gian: 01-07-2025 đến 17-07-2025
        const startDate = new Date('2025-07-01T00:00:00.000Z');
        const endDate = new Date('2025-07-17T23:59:59.999Z');
        const totalDays = 17; // 01-07 đến 17-07
        const usersPerDay = Math.floor(200 / totalDays); // ~11-12 users/day
        const remainingUsers = 200 % totalDays;
        
        let userIndex = 1;
        
        for (let day = 1; day <= totalDays; day++) {
            const currentDate = new Date(`2025-07-${day.toString().padStart(2, '0')}`);
            
            // Số user cho ngày này (phân bổ đều + số dư)
            let usersForThisDay = usersPerDay;
            if (day <= remainingUsers) {
                usersForThisDay += 1;
            }
            
            console.log(`📅 Ngày ${day}/07: Tạo ${usersForThisDay} users`);
            
            for (let i = 0; i < usersForThisDay; i++) {
                // Random thời gian trong ngày
                const randomHour = Math.floor(Math.random() * 24);
                const randomMinute = Math.floor(Math.random() * 60);
                const randomSecond = Math.floor(Math.random() * 60);
                
                const createdAt = new Date(currentDate);
                createdAt.setHours(randomHour, randomMinute, randomSecond);
                
                // Random role với tỷ lệ thực tế
                const roleRandom = Math.random();
                let role;
                if (roleRandom < 0.60) {
                    role = 'student'; // 60%
                } else if (roleRandom < 0.85) {
                    role = 'teacher'; // 25%
                } else {
                    role = 'admin'; // 15%
                }
                
                // Random gender
                const genderRandom = Math.random();
                let gender;
                if (genderRandom < 0.45) {
                    gender = 'female'; // 45%
                } else if (genderRandom < 0.85) {
                    gender = 'male'; // 40%
                } else if (genderRandom < 0.95) {
                    gender = 'other'; // 10%
                } else {
                    gender = ''; // 5% không xác định
                }
                
                // Random level
                const levels = ['beginner', 'intermediate', 'advanced'];
                const level = levels[Math.floor(Math.random() * levels.length)];
                
                // Random Korean level
                const koreanLevels = ['', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'];
                const koreanLevel = koreanLevels[Math.floor(Math.random() * koreanLevels.length)];
                
                // Random date of birth (20-35 tuổi)
                const birthYear = 2025 - (20 + Math.floor(Math.random() * 16));
                const birthMonth = Math.floor(Math.random() * 12) + 1;
                const birthDay = Math.floor(Math.random() * 28) + 1;
                const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay);
                
                const user = {
                    email: generateUniqueEmail(userIndex, createdAt),
                    password: hashedPassword,
                    fullName: generateRandomName(),
                    role: role,
                    level: level,
                    gender: gender,
                    koreanLevel: koreanLevel,
                    dateOfBirth: dateOfBirth,
                    joinedDate: createdAt,
                    lastLogin: generateRandomDate(createdAt, new Date()),
                    lastActive: generateRandomDate(createdAt, new Date()),
                    createdAt: createdAt,
                    updatedAt: createdAt,
                    isActive: Math.random() > 0.05, // 95% active
                    emailVerified: Math.random() > 0.1, // 90% verified
                    averageScore: Math.floor(Math.random() * 41) + 60, // 60-100 điểm
                    progress: {
                        totalPoints: Math.floor(Math.random() * 1000)
                    }
                };
                
                users.push(user);
                userIndex++;
            }
        }
        
        // Chèn tất cả users vào database
        console.log('💾 Đang lưu users vào database...');
        await User.insertMany(users);
        
        // Thống kê kết quả
        const stats = {
            total: users.length,
            byRole: {
                student: users.filter(u => u.role === 'student').length,
                teacher: users.filter(u => u.role === 'teacher').length,
                admin: users.filter(u => u.role === 'admin').length
            },
            byGender: {
                male: users.filter(u => u.gender === 'male').length,
                female: users.filter(u => u.gender === 'female').length,
                other: users.filter(u => u.gender === 'other').length,
                undefined: users.filter(u => u.gender === '').length
            },
            byDay: {}
        };
        
        // Thống kê theo ngày
        for (let day = 1; day <= 17; day++) {
            const dayUsers = users.filter(u => u.createdAt.getDate() === day);
            stats.byDay[`${day}/07`] = dayUsers.length;
        }
        
        console.log('\n✅ HOÀN THÀNH! Đã tạo 200 tài khoản demo');
        console.log('\n📊 THỐNG KÊ:');
        console.log(`📌 Tổng cộng: ${stats.total} users`);
        console.log('\n👥 Theo vai trò:');
        console.log(`   👨‍🎓 Student: ${stats.byRole.student}`);
        console.log(`   👨‍🏫 Teacher: ${stats.byRole.teacher}`);
        console.log(`   👨‍💼 Admin: ${stats.byRole.admin}`);
        console.log('\n⚧ Theo giới tính:');
        console.log(`   👨 Nam: ${stats.byGender.male}`);
        console.log(`   👩 Nữ: ${stats.byGender.female}`);
        console.log(`   🏳️‍🌈 Khác: ${stats.byGender.other}`);
        console.log(`   ❓ Không xác định: ${stats.byGender.undefined}`);
        console.log('\n📅 Theo ngày:');
        Object.entries(stats.byDay).forEach(([day, count]) => {
            console.log(`   ${day}: ${count} users`);
        });
        
        console.log('\n🎯 Dữ liệu đã được tạo từ 01/07/2025 đến 17/07/2025');
        console.log('🔐 Mật khẩu chung: demo123');
        console.log('📧 Format email: demo{số}_{ngày}{tháng}@domain.com');
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo users:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Chạy script
createDemoUsers();
