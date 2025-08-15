const mongoose = require('mongoose');
const User = require('../src/models/User');

// Kết nối MongoDB
async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/korea-db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Kết nối MongoDB thành công');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
}

async function checkAllData() {
    try {
        await connectDB();
        
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        console.log('🔍 KIỂM TRA DỮ LIỆU CHO BIỂU ĐỒ REGISTRATION\n');
        
        // 1. Thống kê tổng users
        const totalUsers = await User.countDocuments();
        console.log(`👥 Tổng số users: ${totalUsers}`);
        
        // 2. Users trong 30 ngày gần nhất
        const last30DaysUsers = await User.find({
            createdAt: { $gte: thirtyDaysAgo }
        }).sort({ createdAt: 1 });
        
        console.log(`📅 Users trong 30 ngày gần nhất: ${last30DaysUsers.length}`);
        
        // 3. Phân bố theo ngày (giống logic trong createRegistrationChart)
        console.log('\n📊 PHÂN BỐ ĐĂNG KÝ THEO NGÀY (30 ngày):');
        console.log('===========================================');
        
        const dailyRegistrations = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Count users created on this date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            const usersOnDate = await User.countDocuments({
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
            
            const dateStr = date.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit' 
            });
            
            dailyRegistrations.push({
                date: dateStr,
                count: usersOnDate
            });
            
            if (usersOnDate > 0) {
                const bar = '█'.repeat(Math.min(usersOnDate, 20));
                console.log(`${dateStr}: ${usersOnDate.toString().padStart(3, ' ')} người ${bar}`);
            }
        }
        
        // 4. Tổng tích lũy
        let cumulative = 0;
        console.log('\n📈 TỔNG TÍCH LŨY:');
        console.log('=================');
        dailyRegistrations.forEach(day => {
            cumulative += day.count;
            if (day.count > 0) {
                console.log(`${day.date}: +${day.count} → Tổng: ${cumulative}`);
            }
        });
        
        // 5. Data mẫu cho backend API
        console.log('\n🔧 DATA MẪU CHO API (dailyRegistrations):');
        console.log('=========================================');
        const sampleApiData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            const usersOnDate = await User.countDocuments({
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
            
            if (usersOnDate > 0) {
                sampleApiData.push({
                    _id: {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1, // 1-based
                        day: date.getDate()
                    },
                    newRegistrations: usersOnDate
                });
            }
        }
        
        console.log(JSON.stringify(sampleApiData.slice(0, 5), null, 2));
        console.log(`... và ${sampleApiData.length - 5} ngày khác`);
        
        // 6. Thống kê theo role
        console.log('\n👥 THỐNG KÊ THEO ROLE:');
        console.log('=====================');
        const roleStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        roleStats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} người`);
        });
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔚 Hoàn thành!');
    }
}

checkAllData();
