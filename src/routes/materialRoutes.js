const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isTeacher } = require('../middleware/auth');
const Material = require('../models/material');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/materials';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.mp3'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Routes
router.get('/materials', isTeacher, async (req, res) => {
    try {
        const materials = await Material.find({ teacher: req.user._id })
            .sort('-uploadedAt')
            .lean();

        res.render('teacher/materials', {
            title: 'Tài liệu dạy học',
            user: req.user,
            materials: materials,
            path: '/teacher/materials'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tài liệu',
            user: req.user
        });
    }
});

router.post('/materials', isTeacher, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng chọn file để tải lên'
            });
        }

        const material = await Material.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            level: req.body.level,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: `uploads/materials/${req.file.filename}`,
            teacher: req.user._id,
            isPublic: true
        });

        res.status(201).json({
            status: 'success',
            data: material
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

router.get('/materials/:id', isTeacher, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy tài liệu'
            });
        }

        if (material.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền xem tài liệu này'
            });
        }

        res.json({
            status: 'success',
            data: material
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Có lỗi xảy ra khi tải thông tin tài liệu'
        });
    }
});

router.put('/materials/:id', isTeacher, upload.single('file'), async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy tài liệu'
            });
        }

        if (material.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền cập nhật tài liệu này'
            });
        }

        // Update basic fields
        material.title = req.body.title || material.title;
        material.description = req.body.description || material.description;
        material.category = req.body.category || material.category;
        material.level = req.body.level || material.level;
        material.lastModified = new Date();

        // If new file is uploaded, replace the old file
        if (req.file) {
            // Delete old file
            const oldFilePath = path.join(__dirname, '../../public', material.filePath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            // Update file info
            material.fileName = req.file.filename;
            material.originalName = req.file.originalname;
            material.fileType = req.file.mimetype;
            material.fileSize = req.file.size;
            material.filePath = `uploads/materials/${req.file.filename}`;
        }

        await material.save();

        res.json({
            status: 'success',
            data: material,
            message: 'Tài liệu đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Có lỗi xảy ra khi cập nhật tài liệu'
        });
    }
});

router.delete('/materials/:id', isTeacher, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy tài liệu'
            });
        }

        if (material.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền xóa tài liệu này'
            });
        }

        const filePath = path.join(__dirname, '../../public', material.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await material.deleteOne();

        res.json({
            status: 'success',
            message: 'Tài liệu đã được xóa thành công'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Có lỗi xảy ra khi xóa tài liệu'
        });
    }
});

router.get('/materials/:id/download', isTeacher, async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy tài liệu',
                user: req.user
            });
        }

        const filePath = path.join(__dirname, '../../public', material.filePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).render('error', {
                message: 'File không tồn tại',
                user: req.user
            });
        }

        // Increment download count
        material.downloadCount += 1;
        await material.save();

        res.download(filePath, material.originalName);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải xuống tài liệu',
            user: req.user
        });
    }
});

module.exports = router;