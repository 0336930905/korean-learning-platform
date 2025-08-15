const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Make sure all functions are properly exported
module.exports = {
    // Update login function to check isActive
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.render('login', { 
                    message: 'Email hoặc mật khẩu không đúng!',
                    type: 'danger'  // Specify type for error
                });
            }

            // Check if account is active
            if (!user.isActive) {
                let message = 'Tài khoản của bạn đã bị khóa.';
                if (user.blockReason) {
                    message += ` Lý do: ${user.blockReason}`;
                }
                message += ' Vui lòng liên hệ quản trị viên để được hỗ trợ.';
                
                return res.render('login', { 
                    message: message,
                    type: 'danger'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.render('login', { 
                    message: 'Email hoặc mật khẩu không đúng!',
                    type: 'danger'  // Specify type for error
                });
            }

            req.login(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.render('login', { message: 'Lỗi đăng nhập!' });
                }

                if (!req.session) {
                    req.session = {};
                }
                
                req.session.user = {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                };

                switch (user.role) {
                    case 'admin':
                        return res.redirect('/dashboard/admin');
                    case 'teacher':
                        return res.redirect('/dashboard/teacher');
                    default:
                        return res.redirect('/dashboard/student');
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.render('login', { 
                message: 'Lỗi server!',
                type: 'danger'  // Specify type for error
            });
        }
    },

    logout: (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                res.redirect('/login');
            });
        });
    },

    googleCallback: (req, res) => {
        console.log("User info from Google login:", req.user); // Kiểm tra dữ liệu user

        if (!req.session) {
            req.session = {};
        }

        req.session.user = { 
            id: req.user._id, 
            email: req.user.email, 
            fullName: req.user.fullName, 
            role: req.user.role 
        };

        console.log("User role:", req.user.role); // In ra role để kiểm tra

        switch (req.user.role) {
            case 'admin':
                return res.redirect('/dashboard/admin');
            case 'teacher':
                return res.redirect('/dashboard/teacher');
            default:
                return res.redirect('/dashboard/student');
        }
    },

    addUser: async (req, res) => {
        const { email, password, fullName, phone, role, address, koreanLevel } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            fullName,
            phone,
            role,
            address,
            koreanLevel
        });
        await newUser.save();
        res.redirect('/account-management');
    },

    // Add register function
    register: async (req, res) => {
        try {
            const { fullName, email, password, confirmPassword, gender } = req.body;

            // Validate input
            if (!fullName || !email || !password || !confirmPassword || !gender) {
                return res.render('login', {
                    message: 'Vui lòng điền đầy đủ thông tin!',
                    type: 'danger'
                });
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                return res.render('login', {
                    message: 'Mật khẩu nhập lại không khớp!',
                    type: 'danger'
                });
            }

            // Check if email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.render('login', {
                    message: 'Email đã được sử dụng!',
                    type: 'danger'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = new User({
                fullName,
                email,
                password: hashedPassword,
                gender,
                role: 'student', // Default role
                isActive: true
            });

            await newUser.save();

            res.render('login', {
                message: 'Đăng ký thành công! Vui lòng đăng nhập.',
                type: 'success'
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.render('login', {
                message: 'Lỗi đăng ký! Vui lòng thử lại.',
                type: 'danger'
            });
        }
    }
};

