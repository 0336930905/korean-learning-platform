const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'present' // Thay đổi từ 'absent' thành 'present'
    },
    note: {
        type: String,
        default: ''
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    markedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index để đảm bảo unique attendance per student per date per class
attendanceSchema.index({ class: 1, student: 1, date: 1 }, { unique: true });

// Static method để tạo các ngày điểm danh cho lớp học
attendanceSchema.statics.generateAttendanceDates = function(startDate, endDate, scheduleDays = []) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Nếu không có schedule days, tạo tất cả các ngày
    if (!scheduleDays || scheduleDays.length === 0) {
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    } else {
        // Map day names to numbers
        const dayMap = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        
        const scheduleDayNumbers = scheduleDays.map(day => dayMap[day]).filter(num => num !== undefined);
        
        while (current <= end) {
            if (scheduleDayNumbers.includes(current.getDay())) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }
    
    return dates;
};

// Instance method để lấy thống kê điểm danh của học sinh
attendanceSchema.statics.getStudentAttendanceStats = async function(classId, studentId) {
    const stats = await this.aggregate([
        {
            $match: {
                class: new mongoose.Types.ObjectId(classId),
                student: new mongoose.Types.ObjectId(studentId)
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0
    };
    
    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });
    
    result.attendanceRate = result.total > 0 ? Math.round((result.present / result.total) * 100) : 0;
    
    return result;
};

module.exports = mongoose.model('Attendance', attendanceSchema);