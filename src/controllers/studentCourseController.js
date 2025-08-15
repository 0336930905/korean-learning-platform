const Course = require('../models/Course');
const User = require('../models/User');
const Invoice = require('../models/Invoice'); // Ensure this model exists

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'active' })
      .populate('instructor', 'fullName');
    const user = await User.findById(req.user.id);
    const userEnrolledIds = courses
      .filter(c => c.enrolledStudents.includes(user._id))
      .map(c => c._id.toString());

    res.render('student/courses', { 
      courses, 
      userEnrolledIds,
      user: req.user || user
    });
  } catch (err) {
    console.error('Error in getAllCourses:', err);
    res.status(500).render('error', { 
      message: 'Lỗi khi tải danh sách khóa học',
      user: req.user
    });
  }
};

exports.purchaseCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy khóa học' 
            });
        }

        // Check if user already purchased the course
        const existingInvoice = await Invoice.findOne({
            student: req.user._id,
            course: courseId,
            status: 'paid'
        });

        if (existingInvoice) {
            return res.redirect(`/courses/${courseId}`);
        }

        // Create new invoice
        const invoice = new Invoice({
            student: req.user._id,
            course: courseId,
            amount: course.price,
            paymentMethod: 'zalopay_app',
            status: 'pending'
        });
        await invoice.save();

        // Render payment page with invoice details
        res.render('student/payment', {
            user: req.user,
            course: course,
            invoiceId: invoice._id,
            amount: course.price
        });

    } catch (error) {
        console.error('Purchase course error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi xử lý thanh toán' 
        });
    }
};

exports.confirmPayment = async (req, res) => {
  const { invoiceId } = req.body;

  try {
    const invoice = await Invoice.findById(invoiceId).populate('course');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Simulate payment confirmation (replace with actual payment gateway logic)
    const paymentSuccessful = true; // Replace with real payment status

    if (paymentSuccessful) {
      // Mark the invoice as paid
      invoice.status = 'paid';
      await invoice.save();

      // Enroll the student in the course
      const course = await Course.findById(invoice.course._id);
      course.enrolledStudents.push(invoice.student);
      await course.save();

      // Update the user's progress
      await User.findByIdAndUpdate(invoice.student, {
        $addToSet: { 'progress.completedCourses': course._id },
      });

      res.render('student/confirmation', { course, invoice });
    } else {
      res.status(400).json({ message: 'Payment failed. Please try again.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    // Find the logged-in user
    const userId = req.user.id;

    // Fetch courses where the user is in the enrolledStudents list
    const enrolledCourses = await Course.find({ enrolledStudents: userId });

    // Render the myCourses.ejs view with the enrolled courses
    res.render('student/myCourses', { enrolledCourses });
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải danh sách khóa học của bạn' });
  }
};
