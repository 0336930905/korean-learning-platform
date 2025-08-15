const mongoose = require('mongoose');
const User = require('../src/models/User');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/korea-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function analyzeGenderStats() {
    try {
        console.log('🔍 Phân tích thống kê giới tính sau khi thêm 200 users demo...\n');
        
        // Thống kê tổng quan
        const totalUsers = await User.countDocuments();
        console.log(`📊 Tổng số users: ${totalUsers}`);
        
        // Thống kê theo giới tính
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
        
        console.log('\n⚧ Thống kê theo giới tính:');
        let totalGenderUsers = 0;
        genderStats.forEach(stat => {
            const genderLabel = stat._id === 'male' ? 'Nam' : 
                               stat._id === 'female' ? 'Nữ' : 
                               stat._id === 'other' ? 'Khác' : 
                               stat._id === '' || stat._id === null ? 'Chưa xác định' : stat._id;
            const percentage = ((stat.count / totalUsers) * 100).toFixed(2);
            console.log(`   ${genderLabel}: ${stat.count} (${percentage}%)`);
            totalGenderUsers += stat.count;
        });
        
        // Thống kê theo role
        console.log('\n👥 Thống kê theo vai trò:');
        const roleStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        roleStats.forEach(stat => {
            const roleLabel = stat._id === 'student' ? 'Học viên' : 
                             stat._id === 'teacher' ? 'Giáo viên' : 
                             stat._id === 'admin' ? 'Quản trị viên' : stat._id;
            const percentage = ((stat.count / totalUsers) * 100).toFixed(2);
            console.log(`   ${roleLabel}: ${stat.count} (${percentage}%)`);
        });
        
        // Thống kê users demo (email có chứa "demo")
        const demoUsers = await User.countDocuments({
            email: { $regex: /^demo\d+_/i }
        });
        console.log(`\n🎯 Users demo đã tạo: ${demoUsers}`);
        
        // Thống kê theo ngày tạo (30 ngày gần nhất)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailyRegistrations = await User.aggregate([
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
                    newRegistrations: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);
        
        console.log('\n📅 Đăng ký 30 ngày gần nhất (có dữ liệu):');
        let totalRecentRegistrations = 0;
        dailyRegistrations.forEach(day => {
            const date = `${day._id.day.toString().padStart(2, '0')}/${day._id.month.toString().padStart(2, '0')}/${day._id.year}`;
            console.log(`   ${date}: ${day.newRegistrations} users`);
            totalRecentRegistrations += day.newRegistrations;
        });
        console.log(`   📌 Tổng 30 ngày: ${totalRecentRegistrations} users`);
        
        // Kiểm tra API response format
        console.log('\n🔧 Định dạng API response cho gender stats:');
        console.log(JSON.stringify(genderStats, null, 2));
        
        console.log('\n✅ Phân tích hoàn tất!');
        console.log('💡 Dữ liệu này sẽ được sử dụng cho biểu đồ thống kê giới tính');
        
    } catch (error) {
        console.error('❌ Lỗi khi phân tích:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Chạy script
analyzeGenderStats();
