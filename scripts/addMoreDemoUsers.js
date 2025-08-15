const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

// Kết nối MongoDB
async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Korea_DB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Kết nối MongoDB thành công');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
}

// Danh sách tên mẫu
const names = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
    'Vũ Thị Phương', 'Đặng Văn Giang', 'Bùi Thị Hương', 'Ngô Văn Inh', 'Lý Thị Khánh',
    'Đinh Văn Long', 'Đỗ Thị Mai', 'Trương Văn Nam', 'Phan Thị Oanh', 'Võ Văn Phúc',
    'Tạ Thị Quỳnh', 'Lưu Văn Sơn', 'Chu Thị Thảo', 'Nguyễn Văn Tùng', 'Lê Thị Uyên',
    'Trần Văn Việt', 'Phạm Thị Xuân', 'Hoàng Văn Yên', 'Vũ Thị Zung', 'Đặng Văn Bách',
    'Bùi Thị Cẩm', 'Ngô Văn Đức', 'Lý Thị Nga', 'Đinh Văn Hải', 'Đỗ Thị Kim',
    'Trương Văn Lâm', 'Phan Thị Minh', 'Võ Văn Nhân', 'Tạ Thị Oanh', 'Lưu Văn Phong',
    'Chu Thị Quyên', 'Nguyễn Văn Rồng', 'Lê Thị Sen', 'Trần Văn Tuấn', 'Phạm Thị Vân',
    'Hoàng Thị Lan', 'Đặng Văn Minh', 'Bùi Thị Hoa', 'Ngô Văn Tân', 'Lý Thị Thu',
    'Đinh Văn Phong', 'Đỗ Thị Hương', 'Trương Văn Đức', 'Phan Thị Linh', 'Võ Văn Hùng'
];

// Danh sách địa chỉ
const addresses = [
    'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Biên Hòa', 'Nha Trang', 'Huế', 'Buôn Ma Thuột', 'Quy Nhon',
    'Vũng Tàu', 'Nam Định', 'Phan Thiết', 'Long Xuyên', 'Thanh Hóa',
    'Thái Nguyên', 'Quảng Ninh', 'Nghệ An', 'Bắc Giang', 'Vĩnh Phúc',
    'Hải Dương', 'Bắc Ninh', 'Lạng Sơn', 'Cao Bằng', 'Lào Cai'
];

// Tạo email ngẫu nhiên
function generateEmail(name, index) {
    const cleanName = name.toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');
    
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'email.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    // Thêm timestamp để đảm bảo unique
    const timestamp = Date.now().toString().slice(-4);
    
    return `${cleanName}${index}${timestamp}@${domain}`;
}

// Tạo ngày ngẫu nhiên trong khoảng thời gian
function getRandomDateInRange(start, end) {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
}

// Kiểm tra dữ liệu hiện tại
async function checkCurrentData() {
    try {
        console.log('📊 KIỂM TRA DỮ LIỆU HIỆN TẠI:\n');
        
        const totalUsers = await User.countDocuments();
        console.log(`👥 Tổng số tài khoản hiện tại: ${totalUsers}`);
        
        // Kiểm tra admin accounts
        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log(`👑 Số admin: ${adminCount}`);
        
        // Kiểm tra teacher accounts
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        console.log(`👨‍🏫 Số giáo viên: ${teacherCount}`);
        
        // Kiểm tra student accounts
        const studentCount = await User.countDocuments({ role: 'student' });
        console.log(`🎓 Số học viên: ${studentCount}`);
        
        // Kiểm tra demo accounts hiện tại
        const demoCount = await User.countDocuments({ 
            $or: [
                { fullName: /Demo\d+/i },
                { email: /demo|test/i }
            ]
        });
        console.log(`🎯 Số tài khoản demo hiện tại: ${demoCount}\n`);
        
        return { totalUsers, adminCount, teacherCount, studentCount, demoCount };
    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra dữ liệu hiện tại:', error);
        throw error;
    }
}

// Tạo 200 tài khoản demo mới (không xóa dữ liệu cũ)
async function addMoreDemoUsers() {
    try {
        console.log('🚀 BẮT ĐẦU THÊM 200 TÀI KHOẢN DEMO MỚI...\n');
        
        // Lấy số thứ tự bắt đầu từ số demo user hiện tại
        const existingDemoCount = await User.countDocuments({ 
            fullName: /Demo\d+/i 
        });
        
        const startIndex = existingDemoCount + 1;
        console.log(`📝 Bắt đầu từ số thứ tự: ${startIndex}`);
        
        const users = [];
        const startDate = new Date('2025-07-01');
        const endDate = new Date('2025-07-28T23:59:59'); // Mở rộng đến hôm nay
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        for (let i = 0; i < 200; i++) {
            const currentIndex = startIndex + i;
            const name = names[Math.floor(Math.random() * names.length)];
            const address = addresses[Math.floor(Math.random() * addresses.length)];
            const gender = ['male', 'female', 'other', ''][Math.floor(Math.random() * 4)];
            const koreanLevel = ['', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'][Math.floor(Math.random() * 7)];
            const level = ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)];
            
            // Tạo ngày sinh ngẫu nhiên (18-60 tuổi)
            const birthYear = 2025 - (18 + Math.floor(Math.random() * 42));
            const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            
            // Tạo ngày tạo tài khoản ngẫu nhiên trong khoảng thời gian mở rộng
            const createdAt = getRandomDateInRange(startDate, endDate);
            
            const user = {
                email: generateEmail(name, currentIndex),
                password: hashedPassword,
                fullName: `${name} Demo${currentIndex}`,
                role: 'student',
                level: level,
                gender: gender,
                dateOfBirth: dateOfBirth,
                address: address,
                koreanLevel: koreanLevel,
                phone: `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                learningGoal: ['Giao tiếp cơ bản', 'Du học Hàn Quốc', 'Làm việc tại Hàn Quốc', 'Sở thích cá nhân', 'Phát triển nghề nghiệp'][Math.floor(Math.random() * 5)],
                interests: ['K-pop', 'K-drama', 'Văn hóa Hàn', 'Ẩm thực', 'Du lịch', 'Âm nhạc', 'Phim ảnh'].slice(0, Math.floor(Math.random() * 4) + 1),
                isActive: true,
                emailVerified: true,
                totalPoints: Math.floor(Math.random() * 1500),
                averageScore: Math.floor(Math.random() * 10) + 1,
                lastActive: createdAt,
                createdAt: createdAt,
                updatedAt: createdAt
            };
            
            users.push(user);
            
            // Log progress mỗi 50 users
            if ((i + 1) % 50 === 0) {
                console.log(`⏳ Đã chuẩn bị ${i + 1}/200 tài khoản...`);
            }
        }
        
        // Thêm users vào database
        console.log('\n💾 Đang thêm tài khoản vào database...');
        const insertResult = await User.insertMany(users);
        console.log(`✅ Đã thêm thành công ${insertResult.length} tài khoản demo mới!\n`);
        
        return insertResult.length;
    } catch (error) {
        console.error('❌ Lỗi khi thêm dữ liệu demo:', error);
        throw error;
    }
}

// Thống kê sau khi thêm
async function generateFinalStats() {
    try {
        console.log('📊 THỐNG KÊ SAU KHI THÊM DỮ LIỆU:\n');
        
        // 1. Tổng quan
        const totalUsers = await User.countDocuments();
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const teacherUsers = await User.countDocuments({ role: 'teacher' });
        const studentUsers = await User.countDocuments({ role: 'student' });
        
        console.log('👥 TỔNG QUAN USERS:');
        console.log(`- Tổng số tài khoản: ${totalUsers}`);
        console.log(`- Admin: ${adminUsers}`);
        console.log(`- Giáo viên: ${teacherUsers}`);
        console.log(`- Học viên: ${studentUsers}\n`);
        
        // 2. Demo users
        const demoUsers = await User.countDocuments({ 
            fullName: /Demo\d+/i 
        });
        console.log(`🎯 Tổng tài khoản demo: ${demoUsers}\n`);
        
        // 3. Thống kê theo thời gian (30 ngày gần nhất)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailyStats = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);
        
        console.log('📈 ĐĂNG KÝ 30 NGÀY GẦN NHẤT:');
        let totalLast30Days = 0;
        dailyStats.forEach(stat => {
            console.log(`📅 ${stat._id.day}/${stat._id.month}/${stat._id.year}: ${stat.count} đăng ký`);
            totalLast30Days += stat.count;
        });
        console.log(`📊 Tổng 30 ngày: ${totalLast30Days} đăng ký\n`);
        
        // 4. Thống kê giới tính
        const genderStats = await User.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        console.log('👥 THỐNG KÊ GIỚI TÍNH:');
        genderStats.forEach(stat => {
            const genderName = stat._id === 'male' ? 'Nam' : 
                             stat._id === 'female' ? 'Nữ' : 
                             stat._id === 'other' ? 'Khác' : 'Chưa xác định';
            const percentage = ((stat.count / totalUsers) * 100).toFixed(1);
            console.log(`👤 ${genderName}: ${stat.count} người (${percentage}%)`);
        });
        console.log();
        
        // 5. Sample users mới
        const newUsers = await User.find({ 
            fullName: /Demo\d+/i 
        }).sort({ createdAt: -1 }).limit(5).select('fullName email gender level koreanLevel createdAt');
        
        console.log('📋 MẪU TÀI KHOẢN MỚI (5 tài khoản gần nhất):');
        newUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Giới tính: ${user.gender || 'Chưa xác định'}`);
            console.log(`   📚 Level: ${user.level}`);
            console.log(`   🇰🇷 Korean Level: ${user.koreanLevel || 'Chưa xác định'}`);
            console.log(`   📅 Ngày tạo: ${user.createdAt.toLocaleDateString('vi-VN')}`);
            console.log();
        });
        
        console.log('🎯 KẾT LUẬN:');
        console.log('✅ Đã khôi phục và giữ nguyên dữ liệu cũ');
        console.log('✅ Đã thêm 200 tài khoản demo mới');
        console.log('✅ Dữ liệu phong phú cho biểu đồ 30 ngày');
        console.log('✅ Sẵn sàng cho demo tại http://localhost:3996/reports');
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo thống kê:', error);
    }
}

// Chạy script chính
async function main() {
    try {
        await connectDB();
        
        // 1. Kiểm tra dữ liệu hiện tại
        const currentStats = await checkCurrentData();
        
        // 2. Thêm 200 tài khoản demo mới (không xóa dữ liệu cũ)
        const addedCount = await addMoreDemoUsers();
        
        // 3. Tạo thống kê cuối cùng
        await generateFinalStats();
        
        console.log('\n🎉 HOÀN THÀNH:');
        console.log(`✅ Đã giữ nguyên ${currentStats.totalUsers} tài khoản cũ`);
        console.log(`✅ Đã thêm ${addedCount} tài khoản demo mới`);
        console.log(`✅ Tổng cộng: ${currentStats.totalUsers + addedCount} tài khoản`);
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình thực hiện:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔚 Hoàn thành script!');
        process.exit(0);
    }
}

main().catch(console.error);
