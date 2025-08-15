const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// =============================================
// QUẢN LÝ TÀI KHOẢN - USER MANAGEMENT
// =============================================

// Thêm tài khoản mới
exports.addUser = async (req, res) => {
    console.log('🚀 ADD USER CONTROLLER STARTED');
    console.log('📊 Request body:', req.body);
    
    // Get user from both sources
    const user = req.user || req.session.user;
    console.log('👤 Current admin user:', user ? user.email : 'No user');
    console.log('👤 User role:', user ? user.role : 'No role');
    
    try {
        const { email, password, fullName, role, level, phone, address, koreanLevel } = req.body;
        
        console.log('📋 Extracted fields:');
        console.log('  - Email:', email);
        console.log('  - Password length:', password ? password.length : 0);
        console.log('  - Full Name:', fullName);
        console.log('  - Role:', role);
        console.log('  - Level:', level);
        console.log('  - Phone:', phone);
        console.log('  - Address:', address);
        console.log('  - Korean Level:', koreanLevel);
        
        // Validation
        if (!email || !password || !fullName) {
            console.log('❌ Validation failed: Missing required fields');
            return res.render('admin/addUser', {
                user: user,
                error: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                formData: req.body
            });
        }

        console.log('✅ Basic validation passed');

        // Kiểm tra email đã tồn tại
        console.log('🔍 Checking if email exists...');
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ Email already exists:', email);
            return res.render('admin/addUser', {
                user: user,
                error: 'Email đã tồn tại trong hệ thống',
                formData: req.body
            });
        }

        console.log('✅ Email is unique');

        // Hash password
        console.log('🔐 Hashing password...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✅ Password hashed successfully');

        // Tạo user mới
        console.log('👤 Creating new user object...');
        const newUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            fullName: fullName.trim(),
            role: role || 'student',
            level: level || 'beginner',
            phone: phone || '',
            address: address || '',
            koreanLevel: koreanLevel || '',
            joinedDate: new Date(),
            lastActive: new Date(),
            isActive: true,
            emailVerified: false
        });

        console.log('💾 Saving user to database...');
        await newUser.save();
        console.log('✅ User saved successfully with ID:', newUser._id);

        // Log activity
        console.log(`📝 New user created: ${newUser.email} by admin: ${user ? user.email : 'Unknown'} at ${new Date()}`);

        req.flash('success', 'Tạo tài khoản thành công');
        console.log('🎉 SUCCESS: Redirecting to account management');
        res.redirect('/account-management');
        
    } catch (error) {
        console.error('❌ ADD USER ERROR:', error);
        console.error('Error stack:', error.stack);
        res.render('admin/addUser', {
            user: user,
            error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.',
            formData: req.body
        });
    }
};

// Chỉnh sửa tài khoản
exports.editUser = async (req, res) => {
    console.log('=== EDIT USER DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', {
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept'],
        'x-csrf-token': req.headers['x-csrf-token']
    });
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    console.log('User ID from params:', req.params.id);
    
    try {
        const userId = req.params.id;
        const updateData = { ...req.body };

        // Validate userId
        if (!userId) {
            console.log('❌ Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        // Tìm user
        const user = await User.findById(userId);
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        console.log('✅ User found:', user.email);
        console.log('Original user data:', {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
            address: user.address
        });
        console.log('Update data received:', updateData);

        // Remove empty fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '' && key !== 'phone' && key !== 'address' && key !== 'profileImage') {
                console.log(`Removing empty field: ${key}`);
                delete updateData[key];
            }
        });

        // Special handling for some fields that can be empty
        const fieldsAllowEmpty = ['phone', 'address', 'emergencyContact', 'learningGoal'];
        fieldsAllowEmpty.forEach(field => {
            if (updateData[field] === '') {
                updateData[field] = '';
                console.log(`Allowing empty value for: ${field}`);
            }
        });

        console.log('Update data after cleanup:', updateData);

        // Handle checkbox values - Convert "on" to true, undefined to false
        if (updateData['notifications.email'] !== undefined) {
            updateData['notifications.email'] = updateData['notifications.email'] === 'on';
            console.log('📧 Converted notifications.email to:', updateData['notifications.email']);
        }
        
        if (updateData['notifications.push'] !== undefined) {
            updateData['notifications.push'] = updateData['notifications.push'] === 'on';
            console.log('📱 Converted notifications.push to:', updateData['notifications.push']);
        }

        // Handle nested object fields properly
        const nestedUpdates = {};
        Object.keys(updateData).forEach(key => {
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                if (!nestedUpdates[parent]) nestedUpdates[parent] = {};
                nestedUpdates[parent][child] = updateData[key];
                delete updateData[key];
            }
        });

        // Merge nested updates
        Object.keys(nestedUpdates).forEach(parent => {
            updateData[parent] = { ...nestedUpdates[parent] };
        });

        console.log('Update data after boolean conversion:', updateData);

        // Xử lý email - kiểm tra trùng lặp
        if (updateData.email && updateData.email !== user.email) {
            console.log('📧 Email change detected:', user.email, '->', updateData.email);
            const existingUser = await User.findOne({ 
                email: updateData.email.toLowerCase(),
                _id: { $ne: userId }
            });
            if (existingUser) {
                console.log('❌ Email already exists');
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại trong hệ thống'
                });
            }
            updateData.email = updateData.email.toLowerCase();
            console.log('✅ Email validation passed');
        } else {
            console.log('📧 No email change or same email');
        }

        // Xử lý fullName
        if (updateData.fullName) {
            updateData.fullName = updateData.fullName.trim();
            console.log('📝 FullName updated:', updateData.fullName);
        }

        // Xử lý profile image upload
        if (req.file) {
            updateData.profileImage = req.file.filename;
            console.log('🖼️ Profile image uploaded:', req.file.filename);
        }

        // Không cho phép cập nhật isActive từ editUser form
        if (updateData.hasOwnProperty('isActive')) {
            console.log('🔒 Removing isActive from update data');
            delete updateData.isActive;
        }

        // Cập nhật lastActive
        updateData.lastActive = new Date();

        console.log('📝 Final update data:', updateData);

        // Cập nhật thông tin user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true, 
                runValidators: true,
                select: '-password'
            }
        );

        if (!updatedUser) {
            console.log('❌ Update failed - user not found after update');
            return res.status(404).json({
                success: false,
                message: 'Không thể cập nhật người dùng'
            });
        }

        console.log('✅ User updated successfully:', {
            id: updatedUser._id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            lastActive: updatedUser.lastActive
        });

        // Log activity
        console.log(`User updated: ${updatedUser.email} by admin: ${req.user.email} at ${new Date()}`);

        console.log('✅ Update successful, checking response type...');
        console.log('XHR request:', !!req.xhr);
        console.log('Accept header:', req.headers.accept);
        console.log('X-Requested-With header:', req.headers['x-requested-with']);
        console.log('Content-Type header:', req.headers['content-type']);

        // Check if it's an AJAX request
        const isAjax = req.xhr || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                      (req.headers.accept && req.headers.accept.includes('application/json'));

        console.log('Is AJAX request:', isAjax);

        // Return JSON response for AJAX requests
        if (isAjax) {
            console.log('✅ Returning JSON response');
            return res.json({
                success: true,
                message: 'Cập nhật tài khoản thành công',
                user: updatedUser
            });
        }

        console.log('✅ Redirecting to account management');

        // Redirect for form submissions
        req.flash('success', 'Cập nhật tài khoản thành công');
        res.redirect('/account-management');
        
    } catch (error) {
        console.error('❌ Edit user error:', error);
        console.log('Error stack:', error.stack);
        
        // Check if it's an AJAX request for error handling too
        const isAjax = req.xhr || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                      (req.headers.accept && req.headers.accept.includes('application/json'));
        
        if (isAjax) {
            console.log('✅ Returning JSON error response');
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật tài khoản',
                error: error.message
            });
        }

        console.log('✅ Rendering error page');
        res.render('admin/editUser', {
            user: req.user,
            userToEdit: await User.findById(req.params.id),
            error: 'Có lỗi xảy ra khi cập nhật tài khoản',
            formData: req.body
        });
    }
};

// =============================================
// QUẢN LÝ TRẠNG THÁI TÀI KHOẢN - LOCK/UNLOCK
// =============================================

// Khóa/Mở khóa tài khoản - CODE MỚI HOÀN TOÀN
exports.toggleUserStatus = async (req, res) => {
    console.log('=== TOGGLE USER STATUS - NEW CODE ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Current admin user:', req.user.email);
    
    try {
        const userId = req.params.id;
        
        // Validation cơ bản
        if (!userId) {
            console.log('❌ Invalid userId');
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        // Tìm user cần toggle
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        console.log('✅ Target user found:', {
            email: targetUser.email,
            currentStatus: targetUser.isActive ? 'Active' : 'Inactive',
            role: targetUser.role
        });

        // Security checks
        if (targetUser.role === 'admin' && req.user.role !== 'admin') {
            console.log('❌ Permission denied: trying to modify admin account');
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thay đổi trạng thái tài khoản admin'
            });
        }

        if (targetUser._id.toString() === req.user._id.toString()) {
            console.log('❌ Self-modification attempt');
            return res.status(403).json({
                success: false,
                message: 'Không thể thay đổi trạng thái tài khoản của chính mình'
            });
        }

        // Nếu đang khóa admin cuối cùng
        if (targetUser.role === 'admin' && targetUser.isActive) {
            const activeAdminCount = await User.countDocuments({ 
                role: 'admin', 
                isActive: true 
            });
            if (activeAdminCount <= 1) {
                console.log('❌ Cannot block last active admin');
                return res.status(403).json({
                    success: false,
                    message: 'Không thể khóa tài khoản admin cuối cùng'
                });
            }
        }

        // Lấy lý do khóa từ request body
        const { blockReason } = req.body;
        const currentStatus = targetUser.isActive;
        const newStatus = !currentStatus;

        console.log('📝 Status change:', {
            from: currentStatus ? 'Active' : 'Inactive',
            to: newStatus ? 'Active' : 'Inactive',
            blockReason: blockReason || 'N/A'
        });

        // Nếu đang khóa tài khoản và không có lý do
        if (currentStatus && !blockReason) {
            console.log('❌ Block reason required');
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do khóa tài khoản'
            });
        }

        // Cập nhật trạng thái
        const updateData = {
            isActive: newStatus,
            lastActive: new Date()
        };

        // Nếu khóa tài khoản
        if (!newStatus) {
            updateData.blockReason = blockReason;
            updateData.blockDate = new Date();
            updateData.blockedBy = req.user._id;
        } else {
            // Nếu mở khóa tài khoản
            updateData.blockReason = '';
            updateData.blockDate = null;
            updateData.blockedBy = null;
        }

        console.log('💾 Updating user with data:', updateData);

        // Thực hiện cập nhật
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.log('❌ Update failed');
            return res.status(500).json({
                success: false,
                message: 'Không thể cập nhật trạng thái người dùng'
            });
        }

        // Audit log
        const action = newStatus ? 'UNLOCKED' : 'LOCKED';
        const auditMessage = `[ACCOUNT ${action}] Admin: ${req.user.email} | Target: ${updatedUser.email} | Reason: ${blockReason || 'Unlock'} | Time: ${new Date().toISOString()}`;
        console.log(auditMessage);

        // Chuẩn bị response data
        const responseData = {
            userId: updatedUser._id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            isActive: updatedUser.isActive,
            previousStatus: currentStatus,
            blockReason: updatedUser.blockReason || '',
            blockDate: updatedUser.blockDate,
            blockedBy: updatedUser.blockedBy,
            changedBy: req.user.fullName,
            timestamp: new Date()
        };

        console.log('✅ Success response:', responseData);

        return res.json({
            success: true,
            message: `Tài khoản ${updatedUser.email} đã được ${newStatus ? 'kích hoạt' : 'khóa'} thành công`,
            data: responseData
        });

    } catch (error) {
        console.error('❌ Toggle user status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thay đổi trạng thái tài khoản',
            error: error.message
        });
    }
};

// =============================================
// QUẢN LÝ MẬT KHẨU - PASSWORD MANAGEMENT
// =============================================

// Đặt lại mật khẩu - Enhanced security với modal và icon fa-key
exports.resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        // Tìm user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra quyền - Chỉ admin mới có thể reset password admin khác
        if (user.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền đặt lại mật khẩu cho quản trị viên'
            });
        }

        // Không cho phép reset password của chính mình
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không thể đặt lại mật khẩu của chính mình'
            });
        }

        // Tạo mật khẩu mới ngẫu nhiên mạnh (10 ký tự)
        const generateSecurePassword = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            let password = '';
            for (let i = 0; i < 10; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };

        const newPassword = generateSecurePassword();
        
        // Hash mật khẩu mới với salt cao
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Cập nhật mật khẩu và các token liên quan
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        user.lastActive = new Date();
        
        await user.save();

        // Log activity cho security audit
        console.log(`[SECURITY AUDIT] PASSWORD_RESET - Admin: ${req.user.email} | Target: ${user.email} | Time: ${new Date()} | IP: ${req.ip || 'Unknown'}`);

        // Trả về response với mật khẩu mới (sẽ hiển thị trong modal)
        return res.json({
            success: true,
            message: `Mật khẩu đã được đặt lại thành công cho tài khoản ${user.email}`,
            data: {
                newPassword: newPassword,
                userEmail: user.email,
                userName: user.fullName,
                resetBy: req.user.fullName,
                resetAt: new Date(),
                userId: user._id,
                modalTitle: 'Mật khẩu mới đã được tạo',
                modalMessage: 'Vui lòng lưu mật khẩu này và gửi cho người dùng:'
            }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi hệ thống khi đặt lại mật khẩu'
        });
    }
};

// Đổi mật khẩu - Cho modal change password với validation
exports.changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu xác nhận không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Tìm user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra quyền - Chỉ cho phép đổi password của chính mình hoặc admin
        if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thay đổi mật khẩu của người khác'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Kiểm tra mật khẩu mới có giống mật khẩu cũ không
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
            });
        }

        // Hash mật khẩu mới
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        user.password = hashedNewPassword;
        user.lastActive = new Date();
        await user.save();

        // Log activity
        console.log(`Password changed for user: ${user.email} by: ${req.user.email} at ${new Date()}`);

        return res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi hệ thống khi đổi mật khẩu'
        });
    }
};

// =============================================
// CÁC CHỨC NĂNG HỖ TRỢ KHÁC
// =============================================

// Xem chi tiết tài khoản
exports.viewUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy tài khoản' 
            });
        }
    } catch (error) {
        console.error('View user details error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi lấy thông tin tài khoản', 
            error: error.message 
        });
    }
};

// Xóa tài khoản
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Không cho phép xóa admin
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản quản trị viên'
            });
        }

        // Không cho phép tự xóa
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        await User.findByIdAndDelete(userId);

        console.log(`User deleted: ${user.email} by admin: ${req.user.email} at ${new Date()}`);
        
        res.redirect('/account-management');
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi xóa tài khoản', 
            error: error.message 
        });
    }
};

// Lấy tất cả tài khoản
exports.getAllUsers = async () => {
    try {
        return await User.find().select('-password').sort({ createdAt: -1 });
    } catch (error) {
        console.error('Get all users error:', error);
        return [];
    }
};

// Lấy tài khoản theo ID
exports.getUserById = async (id) => {
    try {
        return await User.findById(id).select('-password');
    } catch (error) {
        console.error('Get user by ID error:', error);
        return null;
    }
};

// Tìm kiếm tài khoản API
exports.searchUsersAPI = async (req, res) => {
    try {
        const { search, role, sortField, sortDirection, page = 1, limit = 10 } = req.query;
        let query = {};

        // Build search query
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        // Build sort options
        let sort = {};
        if (sortField) {
            sort[sortField] = sortDirection === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1; // Default sort by creation date
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalUsers: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Search users API error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tìm kiếm người dùng'
        });
    }
};

// Lấy thống kê
exports.getStats = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const studentCount = await User.countDocuments({ role: 'student' });
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        // Tính phần trăm
        const adminPercentage = totalUsers > 0 ? ((adminCount / totalUsers) * 100).toFixed(1) : '0.0';
        const teacherPercentage = totalUsers > 0 ? ((teacherCount / totalUsers) * 100).toFixed(1) : '0.0';
        const studentPercentage = totalUsers > 0 ? ((studentCount / totalUsers) * 100).toFixed(1) : '0.0';

        // Thống kê theo thời gian
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const newUsersThisWeek = await User.countDocuments({
            createdAt: { $gte: oneWeekAgo }
        });

        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: oneMonthAgo }
        });

        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 2);
        
        const newUsersPreviousMonth = await User.countDocuments({
            createdAt: { 
                $gte: previousMonth,
                $lt: oneMonthAgo
            }
        });

        const monthGrowthRate = newUsersPreviousMonth > 0 
            ? (((newUsersThisMonth - newUsersPreviousMonth) / newUsersPreviousMonth) * 100).toFixed(1)
            : '0.0';

        const weekGrowthRate = newUsersThisWeek > 0 ? '100.0' : '0.0'; // Simplified

        return {
            totalUsers,
            adminCount,
            teacherCount,
            studentCount,
            activeUsers,
            inactiveUsers,
            adminPercentage,
            teacherPercentage,
            studentPercentage,
            newUsersThisWeek,
            newUsersThisMonth,
            monthGrowthRate,
            weekGrowthRate
        };
        
    } catch (error) {
        console.error('Get stats error:', error);
        return {
            totalUsers: 0,
            adminCount: 0,
            teacherCount: 0,
            studentCount: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            adminPercentage: '0.0',
            teacherPercentage: '0.0',
            studentPercentage: '0.0',
            newUsersThisWeek: 0,
            newUsersThisMonth: 0,
            monthGrowthRate: '0.0',
            weekGrowthRate: '0.0'
        };
    }
};

// API cho stats
exports.getStatsAPI = async (req, res) => {
    try {
        const stats = await exports.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats API error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thống kê'
        });
    }
};

// Bulk actions cho nhiều user
exports.bulkAction = async (req, res) => {
    try {
        const { action, userIds } = req.body;
        
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có người dùng nào được chọn'
            });
        }

        let result;
        let message;

        switch (action) {
            case 'activate':
                result = await User.updateMany(
                    { _id: { $in: userIds }, role: { $ne: 'admin' } },
                    { isActive: true, lastActive: new Date() }
                );
                message = `Đã kích hoạt ${result.modifiedCount} tài khoản`;
                break;

            case 'deactivate':
                result = await User.updateMany(
                    { 
                        _id: { $in: userIds }, 
                        role: { $ne: 'admin' },
                        _id: { $ne: req.user._id } // Không cho phép khóa chính mình
                    },
                    { isActive: false, lastActive: new Date() }
                );
                message = `Đã khóa ${result.modifiedCount} tài khoản`;
                break;

            case 'delete':
                result = await User.deleteMany({
                    _id: { $in: userIds },
                    role: { $ne: 'admin' },
                    _id: { $ne: req.user._id } // Không cho phép xóa chính mình
                });
                message = `Đã xóa ${result.deletedCount} tài khoản`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Hành động không hợp lệ'
                });
        }

        console.log(`Bulk action ${action} performed by ${req.user.email} on ${userIds.length} users`);

        return res.json({
            success: true,
            message: message,
            affected: result.modifiedCount || result.deletedCount
        });

    } catch (error) {
        console.error('Bulk action error:', error);
        return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi thực hiện hành động'
        });
    }
};

// Xuất dữ liệu user
exports.exportUserData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password')
            .populate('enrolledCourses', 'title')
            .populate('submissions', 'assignment grade');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Tạo dữ liệu xuất
        const userData = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            phone: user.phone,
            address: user.address,
            koreanLevel: user.koreanLevel,
            joinedDate: user.joinedDate,
            lastActive: user.lastActive,
            isActive: user.isActive,
            enrolledCourses: user.enrolledCourses,
            submissions: user.submissions
        };

        res.json({
            success: true,
            data: userData,
            message: 'Xuất dữ liệu thành công'
        });

    } catch (error) {
        console.error('Export user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất dữ liệu'
        });
    }
};
