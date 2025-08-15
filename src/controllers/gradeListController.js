const Class = require('../models/class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/submission');
const ClassTest = require('../models/ClassTest');
const User = require('../models/User');

exports.getGradeList = async (req, res) => {
    try {
        console.log('Loading grade list for teacher:', req.user._id);
        
        const selectedClassId = req.query.classId;

        // Get all classes taught by the teacher
        const classes = await Class.find({ teacher: req.user._id })
            .populate('course', 'title level')
            .populate('students', 'fullName email studentId avatar')
            .lean();

        console.log('Found classes:', classes.length);

        // If no class is selected, show class selection page
        if (!selectedClassId) {
            return res.render('teacher/grade_list', {
                user: req.user,
                classes: classes,
                selectedClass: null,
                studentsWithGrades: [],
                classStats: null,
                title: 'Bảng điểm tổng hợp',
                showClassSelection: true
            });
        }

        // Find the selected class
        const selectedClass = classes.find(c => c._id.toString() === selectedClassId);
        
        if (!selectedClass) {
            return res.render('teacher/grade_list', {
                user: req.user,
                classes: classes,
                selectedClass: null,
                studentsWithGrades: [],
                classStats: null,
                title: 'Bảng điểm tổng hợp',
                showClassSelection: true,
                error: 'Không tìm thấy lớp học được chọn'
            });
        }

        // Get all assignments for the selected class
        const assignments = await Assignment.find({
            class: selectedClassId
        }).lean();

        // Get all class tests for the selected class
        const classTests = await ClassTest.find({
            class: selectedClassId
        }).lean();

        // Get all submissions for the selected class
        const submissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) }
        })
        .populate('student', 'fullName email studentId avatar')
        .populate('assignment', 'title maxScore category')
        .lean();

        // Process student grades
        const studentsWithGrades = selectedClass.students.map(student => {
            // Get student's submissions
            const studentSubmissions = submissions.filter(sub => 
                sub.student && sub.student._id.toString() === student._id.toString()
            );

            // Get student's test scores
            const studentTestScores = classTests.map(test => {
                const scoreEntry = test.scores.find(score => 
                    score.student.toString() === student._id.toString()
                );
                return {
                    testId: test._id,
                    testName: test.testName,
                    score: scoreEntry ? scoreEntry.score : null,
                    maxScore: test.maxScore || 10,
                    date: test.testDate
                };
            });

            // Group submissions by category
            const submissionsByCategory = {
                speaking: studentSubmissions.filter(s => s.assignment?.category === 'speaking'),
                listening: studentSubmissions.filter(s => s.assignment?.category === 'listening'),
                writing: studentSubmissions.filter(s => s.assignment?.category === 'writing'),
                vocabulary: studentSubmissions.filter(s => s.assignment?.category === 'vocabulary'),
                other: studentSubmissions.filter(s => !s.assignment?.category || 
                    !['speaking', 'listening', 'writing', 'vocabulary'].includes(s.assignment.category))
            };

            // Calculate averages by category
            const categoryAverages = {};
            Object.keys(submissionsByCategory).forEach(category => {
                const categorySubmissions = submissionsByCategory[category];
                const gradedSubmissions = categorySubmissions.filter(s => s.grade && s.grade.score !== undefined);
                
                if (gradedSubmissions.length > 0) {
                    const total = gradedSubmissions.reduce((sum, s) => sum + s.grade.score, 0);
                    categoryAverages[category] = {
                        average: Math.round((total / gradedSubmissions.length) * 10) / 10,
                        count: gradedSubmissions.length,
                        totalSubmissions: categorySubmissions.length
                    };
                } else {
                    categoryAverages[category] = {
                        average: null,
                        count: 0,
                        totalSubmissions: categorySubmissions.length
                    };
                }
            });

            // Calculate test average
            const gradedTests = studentTestScores.filter(t => t.score !== null);
            const testAverage = gradedTests.length > 0 
                ? Math.round((gradedTests.reduce((sum, t) => sum + t.score, 0) / gradedTests.length) * 10) / 10
                : null;

            // Calculate overall assignment average
            const allGradedSubmissions = studentSubmissions.filter(s => s.grade && s.grade.score !== undefined);
            const assignmentAverage = allGradedSubmissions.length > 0
                ? Math.round((allGradedSubmissions.reduce((sum, s) => sum + s.grade.score, 0) / allGradedSubmissions.length) * 10) / 10
                : null;

            // Calculate final grade (60% tests, 40% assignments)
            let finalGrade = null;
            if (testAverage !== null && assignmentAverage !== null) {
                finalGrade = Math.round(((testAverage * 0.6) + (assignmentAverage * 0.4)) * 10) / 10;
            } else if (testAverage !== null) {
                finalGrade = testAverage;
            } else if (assignmentAverage !== null) {
                finalGrade = assignmentAverage;
            }

            return {
                ...student,
                submissions: studentSubmissions,
                testScores: studentTestScores,
                categoryAverages: categoryAverages,
                testAverage: testAverage,
                assignmentAverage: assignmentAverage,
                finalGrade: finalGrade,
                totalSubmissions: studentSubmissions.length,
                gradedSubmissions: allGradedSubmissions.length,
                totalTests: studentTestScores.length,
                gradedTests: gradedTests.length
            };
        });

        // Calculate class statistics
        const classStats = {
            totalStudents: studentsWithGrades.length,
            totalAssignments: assignments.length,
            totalTests: classTests.length,
            totalSubmissions: submissions.length,
            gradedSubmissions: submissions.filter(s => s.grade && s.grade.score !== undefined).length,
            averageGrade: null,
            gradeDistribution: {
                excellent: 0, // >= 8
                good: 0,      // 6-7.9
                average: 0,   // 4-5.9
                poor: 0       // < 4
            }
        };

        // Calculate class average and distribution
        const studentFinalGrades = studentsWithGrades
            .map(s => s.finalGrade)
            .filter(grade => grade !== null);

        if (studentFinalGrades.length > 0) {
            classStats.averageGrade = Math.round((studentFinalGrades.reduce((sum, grade) => sum + grade, 0) / studentFinalGrades.length) * 10) / 10;
            
            studentFinalGrades.forEach(grade => {
                if (grade >= 8) classStats.gradeDistribution.excellent++;
                else if (grade >= 6) classStats.gradeDistribution.good++;
                else if (grade >= 4) classStats.gradeDistribution.average++;
                else classStats.gradeDistribution.poor++;
            });
        }

        res.render('teacher/grade_list', {
            user: req.user,
            classes: classes, // Đảm bảo classes được truyền
            selectedClass: selectedClass,
            studentsWithGrades: studentsWithGrades,
            classStats: classStats,
            assignments: assignments,
            classTests: classTests,
            title: 'Bảng điểm tổng hợp',
            showClassSelection: false
        });

    } catch (error) {
        console.error('Error loading grade list:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải danh sách điểm',
            user: req.user,
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Export individual student grades
exports.exportStudentGrades = async (req, res) => {
    try {
        const { classId, format = 'excel' } = req.query;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin lớp học'
            });
        }

        const XLSX = require('xlsx');
        
        // Get class data
        const selectedClass = await Class.findById(classId)
            .populate('course', 'title level')
            .populate('students', 'fullName email studentId avatar gender')
            .populate('teacher', 'fullName email phone') // Thêm thông tin giáo viên
            .lean();

        if (!selectedClass) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lớp học'
            });
        }

        // Get assignments and tests (reuse logic from getGradeList)
        const assignments = await Assignment.find({ class: classId }).lean();
        const classTests = await ClassTest.find({ class: classId }).lean();
        
        // Get all submissions and test scores
        const submissions = await Submission.find({
            assignment: { $in: assignments.map(a => a._id) }
        }).populate('student assignment').lean();

        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // Prepare header with teacher info
        const headerData = [
            ['BẢNG ĐIỂM CHI TIẾT'],
            [''],
            [`Khóa học: ${selectedClass.course.title}`],
            [`Lớp: ${selectedClass.name}`],
            [`Cấp độ: ${selectedClass.course.level}`],
            [`Giáo viên: ${selectedClass.teacher.fullName}`],
            [`Email GV: ${selectedClass.teacher.email}`],
            [`Số điện thoại GV: ${selectedClass.teacher.phone || 'Chưa cập nhật'}`],
            [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
            [''],
            // Headers for student data
            [
                'STT',
                'Họ và tên',
                'Email',
                'Giới tính',
                ...assignments.map((a, i) => `BT${i + 1}`),
                ...classTests.map((t, i) => `KT${i + 1}`),
                'TB Bài tập',
                'TB Kiểm tra',
                'Điểm cuối kỳ'
            ]
        ];

        // Add student data
        selectedClass.students.forEach((student, index) => {
            const studentSubmissions = submissions.filter(s => 
                s.student._id.toString() === student._id.toString()
            );
            
            // Calculate assignment grades
            const assignmentGrades = assignments.map(assignment => {
                const submission = studentSubmissions.find(s => 
                    s.assignment._id.toString() === assignment._id.toString()
                );
                return submission && submission.grade ? parseFloat(submission.grade.score).toFixed(1) : 'N/A';
            });

            // Get test grades (placeholder - implement based on your test score structure)
            const testGrades = classTests.map(() => 'N/A'); // Implement test score logic

            // Calculate averages
            const validAssignmentScores = assignmentGrades.filter(g => g !== 'N/A').map(g => parseFloat(g));
            const assignmentAvg = validAssignmentScores.length > 0 
                ? (validAssignmentScores.reduce((a, b) => a + b, 0) / validAssignmentScores.length).toFixed(1)
                : 'N/A';

            const testAvg = 'N/A'; // Implement test average logic
            const finalGrade = 'N/A'; // Implement final grade logic

            // Gender formatting
            const genderText = student.gender === 'male' ? 'Nam' : 
                             student.gender === 'female' ? 'Nữ' : 
                             student.gender === 'other' ? 'Khác' : 'Không xác định';

            headerData.push([
                index + 1,
                student.fullName,
                student.email,
                genderText,
                ...assignmentGrades,
                ...testGrades,
                assignmentAvg,
                testAvg,
                finalGrade
            ]);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(headerData);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // STT
            { wch: 25 },  // Họ tên
            { wch: 30 },  // Email
            { wch: 10 },  // Giới tính
            ...Array(assignments.length).fill({ wch: 8 }),   // Assignment columns
            ...Array(classTests.length).fill({ wch: 8 }),    // Test columns
            { wch: 12 },  // TB Bài tập
            { wch: 12 },  // TB Kiểm tra
            { wch: 12 }   // Điểm cuối kỳ
        ];
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm');

        // Generate filename - sanitize special characters
        const sanitizedClassName = selectedClass.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `BangDiem_${sanitizedClassName}_${new Date().getTime()}.xlsx`;
        
        // Send file
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error exporting grades:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất file Excel'
        });
    }
};