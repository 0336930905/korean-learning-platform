const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getMessages = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        
        // Get contacts based on user role
        let userQuery = {};
        if (req.user.role === 'student') {
            userQuery.role = { $in: ['teacher', 'admin'] };
        } else if (req.user.role === 'teacher') {
            userQuery.role = { $in: ['student', 'admin'] };
        } else if (req.user.role === 'admin') {
            userQuery.role = { $ne: 'admin' };
        }

        // First get all messages to determine last activity
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: ['$receiver', userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    lastActivity: { $first: '$createdAt' }
                }
            },
            {
                $sort: { lastActivity: -1 }
            }
        ]);

        // Get all potential contacts
        const contacts = await User.find({
            _id: { $ne: userId },
            ...userQuery
        }).select('fullName role profileImage').lean();

        // Combine contacts with conversation data and sort
        const formattedContacts = contacts
            .map(contact => {
                const conversation = conversations.find(c => 
                    c._id.toString() === contact._id.toString()
                );
                
                return {
                    user: {
                        _id: contact._id,
                        fullName: contact.fullName,
                        role: contact.role,
                        profileImage: contact.profileImage || '/images/default-avatar.png'
                    },
                    lastMessage: conversation?.lastMessage || null,
                    unreadCount: conversation?.unreadCount || 0,
                    lastActivity: conversation?.lastActivity || new Date(0) // Use oldest date if no messages
                };
            })
            .sort((a, b) => {
                // First sort by unread messages
                if (a.unreadCount !== b.unreadCount) {
                    return b.unreadCount - a.unreadCount;
                }
                // Then sort by last activity
                return b.lastActivity - a.lastActivity;
            });

        console.log('Sorted contacts:', formattedContacts.map(c => ({
            name: c.user.fullName,
            lastActivity: c.lastActivity,
            unreadCount: c.unreadCount
        })));

        res.render(`${req.user.role}/messages`, {
            user: req.user,
            contacts: formattedContacts,
            currentUrl: `/${req.user.role}/messages`
        });

    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải tin nhắn',
            error: error.message,
            user: req.user
        });
    }
};

exports.getChatMessages = async (req, res) => {
    try {
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid other user ID'
            });
        }
        
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const otherUserId = new mongoose.Types.ObjectId(req.params.userId);
        
        console.log('Fetching messages between:', {
            teacher: userId,
            student: otherUserId
        });

        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { 
                            sender: userId,
                            receiver: otherUserId 
                        },
                        { 
                            sender: otherUserId,
                            receiver: userId 
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiver',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            {
                $addFields: {
                    senderInfo: { $arrayElemAt: ['$senderInfo', 0] },
                    receiverInfo: { $arrayElemAt: ['$receiverInfo', 0] }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    isRead: 1,
                    sender: '$senderInfo._id',
                    senderName: '$senderInfo.fullName',
                    senderRole: '$senderInfo.role',
                    receiver: '$receiverInfo._id',
                    receiverName: '$receiverInfo.fullName',
                    receiverRole: '$receiverInfo.role'
                }
            },
            {
                $sort: { createdAt: 1 }
            }
        ]);

        console.log('Found messages:', messages.length);

        // Mark messages as read
        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: userId,
                isRead: false
            },
            { $set: { isRead: true } }
        );

        res.json(messages);
    } catch (error) {
        console.error('Error getting chat messages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi tải tin nhắn' 
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const message = new Message({
            sender: new mongoose.Types.ObjectId(req.user._id),
            receiver: new mongoose.Types.ObjectId(receiverId),
            content: content,
            createdAt: new Date()
        });

        await message.save();

        // Update last activity timestamp for both users
        await User.updateMany(
            { 
                _id: { 
                    $in: [
                        new mongoose.Types.ObjectId(req.user._id),
                        new mongoose.Types.ObjectId(receiverId)
                    ]
                }
            },
            { $set: { lastMessageAt: new Date() } }
        );

        // Emit socket event with additional data
        req.app.io.to(receiverId).emit('new_message', {
            senderId: req.user._id,
            receiverId: receiverId,
            content: content,
            createdAt: message.createdAt,
            senderName: req.user.fullName
        });

        res.json({ success: true, message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra khi gửi tin nhắn' 
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        await Message.updateMany(
            {
                sender: new mongoose.Types.ObjectId(senderId),
                receiver: new mongoose.Types.ObjectId(req.user._id),
                isRead: false
            },
            { $set: { isRead: true } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đánh dấu tin nhắn đã đọc'
        });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedBy: new mongoose.Types.ObjectId(req.user._id) }
        });

        res.json({
            success: true,
            message: 'Đã xóa tin nhắn'
        });
    } catch (error) {
        console.error('Error in deleteMessage:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa tin nhắn'
        });
    }
};