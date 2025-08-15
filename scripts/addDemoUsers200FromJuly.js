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
    'Chu Thị Quyên', 'Nguyễn Văn Rồng', 'Lê Thị Sen', 'Trần Văn Tuấn', 'Phạm Thị Vân'
];

// Danh sách địa chỉ
const addresses = [
    'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Biên Hòa', 'Nha Trang', 'Huế', 'Buôn Ma Thuột', 'Quy Nhon',
    'Vũng Tàu', 'Nam Định', 'Phan Thiết', 'Long Xuyên', 'Thanh Hóa',
    'Thái Nguyên', 'Quảng Ninh', 'Nghệ An', 'Bắc Giang', 'Vĩnh Phúc'
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
    
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `${cleanName}${index}@${domain}`;
}

// Tạo ngày ngẫu nhiên trong khoảng thời gian
function getRandomDateInRange(start, end) {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
}

// Tạo dữ liệu người dùng demo
async function createDemoUsers() {
    try {
        console.log('🚀 Bắt đầu tạo 200 tài khoản demo từ 01-07 đến 17-07...');
        
        // Xóa tất cả user demo cũ (những user có email chứa 'demo' hoặc tên có số)
        const deleteResult = await User.deleteMany({
            $or: [
                { email: /demo|test|\d+@/ },
                { fullName: /\d/ }
            ]
        });
        console.log(`🗑️ Đã xóa ${deleteResult.deletedCount} tài khoản demo cũ`);
        
        const users = [];
        const startDate = new Date('2025-07-01');
        const endDate = new Date('2025-07-17T23:59:59');
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        for (let i = 1; i <= 200; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const address = addresses[Math.floor(Math.random() * addresses.length)];
            const gender = ['male', 'female', 'other'][Math.floor(Math.random() * 3)];
            const koreanLevel = ['', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'][Math.floor(Math.random() * 7)];
            const level = ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)];
            
            // Tạo ngày sinh ngẫu nhiên (18-60 tuổi)
            const birthYear = 2025 - (18 + Math.floor(Math.random() * 42));
            const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            
            // Tạo ngày tạo tài khoản ngẫu nhiên trong khoảng 01-07 đến 17-07
            const createdAt = getRandomDateInRange(startDate, endDate);
            
            const user = {
                email: generateEmail(name, i),
                password: hashedPassword,
                fullName: `${name} Demo${i}`,
                role: 'student',
                level: level,
                gender: gender,
                dateOfBirth: dateOfBirth,
                address: address,
                koreanLevel: koreanLevel,
                phone: `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                learningGoal: ['Giao tiếp cơ bản', 'Du học Hàn Quốc', 'Làm việc tại Hàn Quốc', 'Sở thích cá nhân'][Math.floor(Math.random() * 4)],
                interests: ['K-pop', 'K-drama', 'Văn hóa Hàn', 'Ẩm thực', 'Du lịch'].slice(0, Math.floor(Math.random() * 3) + 1),
                isActive: true,
                emailVerified: true,
                totalPoints: Math.floor(Math.random() * 1000),
                averageScore: Math.floor(Math.random() * 10) + 1,
                lastActive: createdAt,
                createdAt: createdAt,
                updatedAt: createdAt
            };
            
            users.push(user);
        }
        
        // Thêm users vào database
        const insertResult = await User.insertMany(users);
        console.log(`✅ Đã tạo thành công ${insertResult.length} tài khoản demo!`);
        
        // Thống kê theo ngày
        const stats = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$createdAt' },
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.day': 1 }
            }
        ]);
        
        console.log('\n📊 Thống kê tài khoản theo ngày:');
        stats.forEach(stat => {
            console.log(`Ngày ${stat._id.day}/07/2025: ${stat.count} tài khoản`);
        });
        
        // Thống kê theo giới tính
        const genderStats = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        console.log('\n👥 Thống kê theo giới tính:');
        genderStats.forEach(stat => {
            const genderName = stat._id === 'male' ? 'Nam' : 
                             stat._id === 'female' ? 'Nữ' : 
                             stat._id === 'other' ? 'Khác' : 'Chưa xác định';
            console.log(`${genderName}: ${stat.count} người`);
        });
        
        // Thống kê tổng
        const totalUsers = await User.countDocuments();
        console.log(`\n📈 Tổng số tài khoản trong hệ thống: ${totalUsers}`);
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu demo:', error);
    }
}

// Chạy script
async function main() {
    await connectDB();
    await createDemoUsers();
    await mongoose.disconnect();
    console.log('🔚 Hoàn thành tạo dữ liệu demo!');
    process.exit(0);
}

main().catch(console.error);
