const Attendance = require('../models/Attendance');
const Class = require('../models/class');
const User = require('../models/User');
const mongoose = require('mongoose');

// Hiển thị trang điểm danh chính với dropdown
exports.getAttendancePage = async (req, res) => {
    try {
        // Lấy danh sách lớp học của giáo viên
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course', 'title')
            .populate('students', 'fullName email avatar')
            .sort({ name: 1 });

        // Lấy classId từ query parameter nếu có
        const selectedClassId = req.query.classId || null;
        let selectedClass = null;
        let attendanceData = null;

        if (selectedClassId && mongoose.Types.ObjectId.isValid(selectedClassId)) {
            selectedClass = classes.find(cls => cls._id.toString() === selectedClassId);
            if (selectedClass) {
                attendanceData = await getAttendanceDataForClass(selectedClassId);
            }
        }

        res.render('teacher/attendance', {
            user: req.user,
            classes: classes,
            selectedClass: selectedClass,
            attendanceData: attendanceData,
            selectedClassId: selectedClassId,
            currentDate: new Date().toISOString().split('T')[0]
        });

    } catch (error) {
        console.error('Error loading attendance page:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang điểm danh',
            user: req.user,
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// API lấy dữ liệu điểm danh cho lớp cụ thể
exports.getClassAttendanceData = async (req, res) => {
    try {
        const classId = req.params.classId;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'ID lớp học không hợp lệ'
            });
        }

        // Lấy thông tin lớp học
        const classData = await Class.findById(classId)
            .populate('course', 'title')
            .populate('students', 'fullName email avatar')
            .populate('teacher', 'fullName');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Kiểm tra quyền truy cập
        if (classData.teacher._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập lớp học này'
            });
        }

        const attendanceData = await getAttendanceDataForClass(classId);

        res.json({
            success: true,
            classData: classData,
            attendanceData: attendanceData
        });

    } catch (error) {
        console.error('Error loading class attendance data:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải dữ liệu điểm danh'
        });
    }
};

// Hàm helper để lấy dữ liệu điểm danh của lớp
async function getAttendanceDataForClass(classId) {
    try {
        const classData = await Class.findById(classId)
            .populate('students', 'fullName email avatar');

        if (!classData) {
            return null;
        }

        // Tạo danh sách các ngày điểm danh
        const attendanceDates = Attendance.generateAttendanceDates(
            classData.startDate,
            classData.endDate,
            classData.schedule?.days || []
        );

        // Lấy dữ liệu điểm danh hiện có
        const existingAttendance = await Attendance.find({
            class: classId
        }).populate('student', 'fullName');

        // Tạo map để dễ dàng tra cứu điểm danh
        const attendanceMap = {};
        existingAttendance.forEach(record => {
            const key = `${record.student._id}_${record.date.toISOString().split('T')[0]}`;
            attendanceMap[key] = record;
        });

        // Tính thống kê cho từng học sinh
        const studentsWithStats = await Promise.all(
            classData.students.map(async (student) => {
                const stats = await Attendance.getStudentAttendanceStats(classId, student._id);
                return {
                    ...student.toObject(),
                    attendanceStats: stats
                };
            })
        );

        return {
            attendanceDates,
            attendanceMap,
            students: studentsWithStats
        };

    } catch (error) {
        console.error('Error getting attendance data for class:', error);
        return null;
    }
}

// Cập nhật điểm danh
exports.updateAttendance = async (req, res) => {
    try {
        const { classId, studentId, date, status, note = '' } = req.body;

        // Validate input
        if (!classId || !studentId || !date || !status) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'ID không hợp lệ'
            });
        }

        // Kiểm tra quyền truy cập
        const classData = await Class.findById(classId);
        if (!classData || classData.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền điểm danh lớp này'
            });
        }

        // Kiểm tra học sinh có trong lớp không
        if (!classData.students.includes(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Học sinh không thuộc lớp này'
            });
        }

        // Validate date
        const attendanceDate = new Date(date);
        if (attendanceDate < classData.startDate || attendanceDate > classData.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Ngày điểm danh không hợp lệ'
            });
        }

        // Cập nhật hoặc tạo mới điểm danh
        const attendance = await Attendance.findOneAndUpdate(
            {
                class: classId,
                student: studentId,
                date: attendanceDate
            },
            {
                status,
                note,
                markedBy: req.user._id,
                markedAt: new Date()
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        // Lấy thống kê mới cho học sinh
        const stats = await Attendance.getStudentAttendanceStats(classId, studentId);

        res.json({
            success: true,
            message: 'Cập nhật điểm danh thành công',
            attendance: {
                id: attendance._id,
                status: attendance.status,
                note: attendance.note,
                markedAt: attendance.markedAt
            },
            studentStats: stats
        });

    } catch (error) {
        console.error('Error updating attendance:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Điểm danh cho ngày này đã tồn tại'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật điểm danh'
        });
    }
};

// Lấy thống kê điểm danh tổng quan
exports.getAttendanceStats = async (req, res) => {
    try {
        const classId = req.params.classId;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'ID lớp học không hợp lệ'
            });
        }

        // Thống kê tổng quan
        const totalStats = await Attendance.aggregate([
            {
                $match: { class: new mongoose.Types.ObjectId(classId) }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê theo ngày
        const dailyStats = await Attendance.aggregate([
            {
                $match: { class: new mongoose.Types.ObjectId(classId) }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$date'
                            }
                        }
                    },
                    present: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                        }
                    },
                    absent: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                        }
                    },
                    late: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                        }
                    },
                    excused: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ]);

        res.json({
            success: true,
            totalStats,
            dailyStats
        });

    } catch (error) {
        console.error('Error getting attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thống kê điểm danh'
        });
    }
};

// Tự động điểm danh vắng cho các ngày chưa điểm danh
exports.autoMarkAbsent = async (req, res) => {
    try {
        const classId = req.params.classId;
        const targetDate = req.body.date;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'ID lớp học không hợp lệ'
            });
        }

        const classData = await Class.findById(classId);
        if (!classData || classData.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const attendanceDate = new Date(targetDate);
        
        // Lấy danh sách học sinh chưa được điểm danh trong ngày
        const existingAttendance = await Attendance.find({
            class: classId,
            date: attendanceDate
        }).select('student');

        const markedStudents = existingAttendance.map(a => a.student.toString());
        const unmarkedStudents = classData.students.filter(
            studentId => !markedStudents.includes(studentId.toString())
        );

        // Tự động điểm danh vắng cho các học sinh chưa được điểm danh
        const bulkOps = unmarkedStudents.map(studentId => ({
            insertOne: {
                document: {
                    class: classId,
                    student: studentId,
                    date: attendanceDate,
                    status: 'absent',
                    note: 'Tự động điểm danh vắng',
                    markedBy: req.user._id,
                    markedAt: new Date()
                }
            }
        }));

        if (bulkOps.length > 0) {
            await Attendance.bulkWrite(bulkOps);
        }

        res.json({
            success: true,
            message: `Đã tự động điểm danh vắng cho ${unmarkedStudents.length} học sinh`,
            markedCount: unmarkedStudents.length
        });

    } catch (error) {
        console.error('Error auto marking absent:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tự động điểm danh'
        });
    }
};

// Xuất báo cáo điểm danh
exports.exportAttendanceReport = async (req, res) => {
    try {
        const classId = req.params.classId;
        
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'ID lớp học không hợp lệ'
            });
        }

        const classData = await Class.findById(classId)
            .populate('course', 'title')
            .populate('students', 'fullName email');

        if (!classData || classData.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xuất báo cáo này'
            });
        }

        // Tạo Excel report (cần cài đặt exceljs)
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo điểm danh');

        // Lấy tất cả dữ liệu điểm danh
        const attendanceData = await Attendance.find({ class: classId })
            .populate('student', 'fullName')
            .sort({ date: 1, 'student.fullName': 1 });

        // Tạo headers
        const dates = [...new Set(attendanceData.map(a => a.date.toISOString().split('T')[0]))].sort();
        const headers = ['Họ tên', 'Email', ...dates, 'Tổng có mặt', 'Tỷ lệ (%)'];
        
        worksheet.addRow(headers);

        // Thêm dữ liệu cho từng học sinh
        for (const student of classData.students) {
            const studentAttendance = attendanceData.filter(
                a => a.student._id.toString() === student._id.toString()
            );
            
            const row = [student.fullName, student.email];
            
            // Thêm trạng thái điểm danh cho từng ngày
            dates.forEach(date => {
                const record = studentAttendance.find(
                    a => a.date.toISOString().split('T')[0] === date
                );
                row.push(record ? record.status : 'absent');
            });
            
            // Tính thống kê
            const presentCount = studentAttendance.filter(a => a.status === 'present').length;
            const totalDays = dates.length;
            const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
            
            row.push(presentCount, `${attendanceRate}%`);
            worksheet.addRow(row);
        }

        // Style worksheet
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        };

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Diem_danh_${classData.name.replace(/\s+/g, '_')}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting attendance report:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất báo cáo'
        });
    }
};

// Thêm function mới để điểm danh tất cả có mặt
exports.markAllPresent = async (req, res) => {
    try {
        const classId = req.params.classId;
        const targetDate = req.body.date;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'ID lớp học không hợp lệ'
            });
        }

        const classData = await Class.findById(classId);
        if (!classData || classData.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const attendanceDate = new Date(targetDate);
        
        // Chuẩn bị bulk operations để cập nhật/tạo điểm danh cho tất cả học sinh
        const bulkOps = classData.students.map(studentId => ({
            updateOne: {
                filter: {
                    class: classId,
                    student: studentId,
                    date: attendanceDate
                },
                update: {
                    $set: {
                        status: 'present',
                        note: 'Tự động điểm danh có mặt tất cả',
                        markedBy: req.user._id,
                        markedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await Attendance.bulkWrite(bulkOps);
        }

        res.json({
            success: true,
            message: `Đã điểm danh có mặt cho ${classData.students.length} học sinh`,
            markedCount: classData.students.length
        });

    } catch (error) {
        console.error('Error marking all present:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi điểm danh'
        });
    }
};

// Cập nhật hàm getAttendanceDataForClass để sử dụng default 'present'
async function getAttendanceDataForClass(classId) {
    try {
        const classData = await Class.findById(classId)
            .populate('students', 'fullName email avatar');

        if (!classData) {
            return null;
        }

        // Tạo danh sách các ngày điểm danh
        const attendanceDates = Attendance.generateAttendanceDates(
            classData.startDate,
            classData.endDate,
            classData.schedule?.days || []
        );

        // Lấy dữ liệu điểm danh hiện có
        const existingAttendance = await Attendance.find({
            class: classId
        }).populate('student', 'fullName');

        // Tạo map để dễ dàng tra cứu điểm danh
        const attendanceMap = {};
        existingAttendance.forEach(record => {
            const key = `${record.student._id}_${record.date.toISOString().split('T')[0]}`;
            attendanceMap[key] = record;
        });

        // Tính thống kê cho từng học sinh
        const studentsWithStats = await Promise.all(
            classData.students.map(async (student) => {
                const stats = await Attendance.getStudentAttendanceStats(classId, student._id);
                return {
                    ...student.toObject(),
                    attendanceStats: stats
                };
            })
        );

        return {
            attendanceDates,
            attendanceMap,
            students: studentsWithStats
        };

    } catch (error) {
        console.error('Error getting attendance data for class:', error);
        return null;
    }
}