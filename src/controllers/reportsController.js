const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Class = require('../models/class');
const Assignment = require('../models/Assignment');
const ClassTest = require('../models/ClassTest');
const Submission = require('../models/submission');
const Course = require('../models/Course');
const mongoose = require('mongoose'); // Thêm dòng này

// Show reports page
exports.showReports = async (req, res) => {
    try {
        res.render('admin/reports', {
            title: 'Báo cáo thống kê',
            user: req.user
        });
    } catch (error) {
        console.error('Error showing reports:', error);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải trang báo cáo' });
    }
};

// Get revenue report
exports.getRevenueReport = async (req, res) => {
    try {
        const { dateRange, startDate, endDate } = req.query;
        
        // Build date filter based on request
        let dateFilter = { status: 'paid' };
        let matchStage = { status: 'paid' };
        
        if (dateRange && dateRange !== 'all') {
            const now = new Date();
            let filterStartDate;
            
            switch (dateRange) {
                case '7days':
                    filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '3months':
                    filterStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case '6months':
                    filterStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                    break;
                case '1year':
                    filterStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        filterStartDate = new Date(startDate);
                        const filterEndDate = new Date(endDate);
                        filterEndDate.setHours(23, 59, 59, 999);
                        dateFilter.paidAt = { $gte: filterStartDate, $lte: filterEndDate };
                        matchStage.paidAt = { $gte: filterStartDate, $lte: filterEndDate };
                    }
                    break;
            }
            
            if (dateRange !== 'custom' && filterStartDate) {
                dateFilter.paidAt = { $gte: filterStartDate };
                matchStage.paidAt = { $gte: filterStartDate };
            }
        }

        // Tổng doanh thu
        const revenueOverview = await Invoice.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' }
                }
            }
        ]);

        // Doanh thu theo ngày cho 30 ngày gần nhất (cho biểu đồ mới)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailyRevenue = await Invoice.aggregate([
            {
                $match: { 
                    status: 'paid',
                    paidAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paidAt' },
                        month: { $month: '$paidAt' },
                        day: { $dayOfMonth: '$paidAt' }
                    },
                    totalRevenue: { $sum: '$amount' },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Doanh thu theo tháng (cho báo cáo tổng quan)
        const revenueByMonth = await Invoice.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $year: '$paidAt' },
                        month: { $month: '$paidAt' }
                    },
                    totalRevenue: { $sum: '$amount' },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Doanh thu theo phương thức thanh toán
        const revenueByPaymentMethod = await Invoice.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Doanh thu theo khóa học
        const revenueByCourse = await Invoice.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            {
                $unwind: '$courseInfo'
            },
            {
                $group: {
                    _id: '$course',
                    courseName: { $first: '$courseInfo.title' },
                    totalRevenue: { $sum: '$amount' },
                    totalSales: { $sum: 1 }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: revenueOverview[0] || { total: 0, count: 0, average: 0 },
                dailyRevenue, // Dữ liệu mới cho biểu đồ 30 ngày
                revenueByMonth,
                revenueByPaymentMethod,
                revenueByCourse,
                dateFilter: { dateRange, startDate, endDate }
            }
        });
    } catch (error) {
        console.error('Error getting revenue report:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải báo cáo doanh thu' });
    }
};

// Get course revenue report với time filter
exports.getCourseRevenueReport = async (req, res) => {
    try {
        const { timeFilter, startDate, endDate } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (timeFilter && timeFilter !== 'all') {
            const now = new Date();
            let filterStartDate;
            
            if (timeFilter === 'custom' && startDate && endDate) {
                // Custom date range
                filterStartDate = new Date(startDate);
                const filterEndDate = new Date(endDate);
                filterEndDate.setHours(23, 59, 59, 999); // End of day
                
                dateFilter = {
                    status: 'paid',
                    paidAt: { 
                        $gte: filterStartDate,
                        $lte: filterEndDate
                    }
                };
            } else {
                // Preset time ranges
                switch (timeFilter) {
                    case '7days':
                        filterStartDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                        break;
                    case '30days':
                        filterStartDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                        break;
                    case '3months':
                        filterStartDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                        break;
                    case '6months':
                        filterStartDate = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
                        break;
                    case '1year':
                        filterStartDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
                        break;
                    default:
                        filterStartDate = null;
                }
                
                if (filterStartDate) {
                    dateFilter = {
                        status: 'paid',
                        paidAt: { $gte: filterStartDate }
                    };
                } else {
                    dateFilter = { status: 'paid' };
                }
            }
        } else {
            dateFilter = { status: 'paid' };
        }

        // Doanh thu theo khóa học với filter
        const revenueByCourse = await Invoice.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            {
                $unwind: '$courseInfo'
            },
            {
                $group: {
                    _id: '$course',
                    courseName: { $first: '$courseInfo.title' },
                    totalRevenue: { $sum: '$amount' },
                    totalSales: { $sum: 1 }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $limit: 20 // Giới hạn 20 khóa học hàng đầu
            }
        ]);

        res.json({
            success: true,
            data: revenueByCourse
        });
    } catch (error) {
        console.error('Error getting course revenue report:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải báo cáo doanh thu khóa học' });
    }
};

// Get academic report
exports.getAcademicReport = async (req, res) => {
    try {
        const { classId } = req.query;
        const filter = classId ? { _id: new mongoose.Types.ObjectId(classId) } : {}; // Sửa lỗi ở đây

        // Lấy thông tin lớp học
        const classes = await Class.find(filter).populate('teacher course');
        
        let classOverview = null;
        if (classId) {
            const selectedClass = classes[0];
            if (selectedClass) {
                classOverview = {
                    name: selectedClass.name,
                    totalStudents: selectedClass.students.length,
                    maxStudents: selectedClass.maxStudents,
                    teacherName: selectedClass.teacher.fullName,
                    courseName: selectedClass.course.title
                };
            }
        }

        // Lấy thống kê bài tập
        const assignmentStats = await Assignment.aggregate([
            ...(classId ? [{ $match: { class: new mongoose.Types.ObjectId(classId) } }] : []), // Sửa lỗi ở đây
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'assignment',
                    as: 'submissions'
                }
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'class',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            {
                $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    title: 1,
                    maxScore: 1,
                    className: '$classInfo.name',
                    totalSubmissions: { $size: '$submissions' },
                    gradedSubmissions: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                cond: { 
                                    $and: [
                                        { $ne: ['$$this.grade', null] },
                                        { $ne: ['$$this.grade.score', null] },
                                        { $gte: ['$$this.grade.score', 0] }
                                    ]
                                }
                            }
                        }
                    },
                    averageScore: {
                        $avg: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$submissions',
                                        cond: { 
                                            $and: [
                                                { $ne: ['$$this.grade', null] },
                                                { $ne: ['$$this.grade.score', null] },
                                                { $gte: ['$$this.grade.score', 0] }
                                            ]
                                        }
                                    }
                                },
                                in: '$$this.grade.score'
                            }
                        }
                    }
                }
            }
        ]);

        // Lấy thống kê kiểm tra
        const testStats = await ClassTest.aggregate([
            ...(classId ? [{ $match: { class: new mongoose.Types.ObjectId(classId) } }] : []), // Sửa lỗi ở đây
            {
                $unwind: '$scores'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'scores.student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            {
                $unwind: '$studentInfo'
            },
            {
                $group: {
                    _id: '$scores.student',
                    studentName: { $first: '$studentInfo.fullName' },
                    totalTests: { $sum: 1 },
                    averageTestScore: { $avg: '$scores.score' },
                    maxTestScore: { $max: '$scores.score' },
                    minTestScore: { $min: '$scores.score' }
                }
            },
            {
                $sort: { averageTestScore: -1 }
            }
        ]);

        // Lấy thống kê học sinh chi tiết
        const studentStats = await User.aggregate([
            {
                $match: { role: 'student' }
            },
            ...(classId ? [{
                $lookup: {
                    from: 'classes',
                    localField: '_id',
                    foreignField: 'students',
                    as: 'classes'
                }
            }, {
                $match: { 'classes._id': new mongoose.Types.ObjectId(classId) } // Sửa lỗi ở đây
            }] : []),
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'student',
                    as: 'submissions'
                }
            },
            {
                $lookup: {
                    from: 'classtests',
                    let: { studentId: '$_id' },
                    pipeline: [
                        { $unwind: '$scores' },
                        { $match: { $expr: { $eq: ['$scores.student', '$$studentId'] } } },
                        ...(classId ? [{ $match: { class: new mongoose.Types.ObjectId(classId) } }] : []) // Sửa lỗi ở đây
                    ],
                    as: 'testScores'
                }
            },
            {
                $project: {
                    fullName: 1,
                    email: 1,
                    totalAssignments: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                cond: { $ne: ['$$this.grade.score', null] }
                            }
                        }
                    },
                    totalTests: { $size: '$testScores' },
                    assignmentAverage: {
                        $avg: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$submissions',
                                        cond: { $ne: ['$$this.grade.score', null] }
                                    }
                                },
                                in: '$$this.grade.score'
                            }
                        }
                    },
                    testAverage: { $avg: '$testScores.scores.score' },
                    onTimeSubmissions: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                cond: { $eq: ['$$this.isLate', false] }
                            }
                        }
                    },
                    lateSubmissions: {
                        $size: {
                            $filter: {
                                input: '$submissions',
                                cond: { $eq: ['$$this.isLate', true] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    overallAverage: {
                        $divide: [
                            {
                                $add: [
                                    { $ifNull: ['$assignmentAverage', 0] },
                                    { $ifNull: ['$testAverage', 0] }
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $addFields: {
                    performance: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$overallAverage', 9] }, then: 'Xuất sắc' },
                                { case: { $gte: ['$overallAverage', 8] }, then: 'Giỏi' },
                                { case: { $gte: ['$overallAverage', 6.5] }, then: 'Khá' },
                                { case: { $gte: ['$overallAverage', 5] }, then: 'Trung bình' }
                            ],
                            default: 'Yếu'
                        }
                    }
                }
            },
            {
                $addFields: {
                    studentName: '$fullName'
                }
            },
            {
                $sort: { overallAverage: -1 }
            }
        ]);

        // Lấy thống kê giới tính theo lớp
        const genderStats = await Class.aggregate([
            ...(classId ? [{ $match: { _id: new mongoose.Types.ObjectId(classId) } }] : []),
            {
                $lookup: {
                    from: 'users',
                    localField: 'students',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            {
                $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    className: '$name',
                    courseName: '$courseDetails.title',
                    male: {
                        $size: {
                            $filter: {
                                input: '$studentDetails',
                                cond: { $eq: ['$$this.gender', 'male'] }
                            }
                        }
                    },
                    female: {
                        $size: {
                            $filter: {
                                input: '$studentDetails',
                                cond: { $eq: ['$$this.gender', 'female'] }
                            }
                        }
                    },
                    other: {
                        $size: {
                            $filter: {
                                input: '$studentDetails',
                                cond: { 
                                    $and: [
                                        { $ne: ['$$this.gender', 'male'] },
                                        { $ne: ['$$this.gender', 'female'] }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $sort: { className: 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                classOverview,
                assignmentStats,
                testStats,
                studentStats,
                genderStats
            }
        });
    } catch (error) {
        console.error('Error getting academic report:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải báo cáo học lực' });
    }
};

// Get account statistics
exports.getAccountStats = async (req, res) => {
    try {
        // Tổng số tài khoản theo role
        const accountStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            total: 0,
            students: 0,
            teachers: 0,
            admins: 0
        };

        accountStats.forEach(stat => {
            stats.total += stat.count;
            if (stat._id === 'student') stats.students = stat.count;
            if (stat._id === 'teacher') stats.teachers = stat.count;
            if (stat._id === 'admin') stats.admins = stat.count;
        });

        // Phân bố theo level
        const usersByLevel = await User.aggregate([
            {
                $group: {
                    _id: '$level',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Phân bố theo trình độ tiếng Hàn
        const usersByKoreanLevel = await User.aggregate([
            {
                $group: {
                    _id: '$koreanLevel',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê đăng ký theo tháng (cho báo cáo tổng quan)
        const registrationStats = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Thống kê đăng ký theo ngày cho 30 ngày gần nhất (cho biểu đồ mới)
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

        // Thống kê giới tính
        const genderStats = await User.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                ...stats,
                usersByLevel,
                usersByKoreanLevel,
                registrationStats,
                dailyRegistrations,
                genderStats
            }
        });
    } catch (error) {
        console.error('Error getting account stats:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải thống kê tài khoản' });
    }
};

// Get classes for filter
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find({}, 'name').sort({ name: 1 });
        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải danh sách lớp' });
    }
};