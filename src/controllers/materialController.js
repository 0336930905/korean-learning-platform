const Material = require('../models/material');
const Class = require('../models/class');
const fs = require('fs');
const path = require('path');

const materialController = {
    getAllMaterials: async (req, res) => {
        try {
            // Get all materials for the logged-in teacher
            const materials = await Material.find({ teacher: req.user._id })
                .sort('-uploadedAt')
                .lean();

            console.log('Materials found:', materials); // Debug log

            // Group materials by category
            const materialsByCategory = {
                speaking: materials.filter(m => m.category === 'speaking'),
                listening: materials.filter(m => m.category === 'listening'),
                writing: materials.filter(m => m.category === 'writing'),
                vocabulary: materials.filter(m => m.category === 'vocabulary')
            };

            // Render the page with both grouped and raw materials data
            res.render('teacher/materials', {
                user: req.user,
                materials: materials,
                materialsByCategory: materialsByCategory,
                title: 'Tài liệu dạy học',
                path: '/teacher/materials',
                moment: require('moment')
            });

        } catch (error) {
            console.error('Error in getAllMaterials:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải trang tài liệu',
                user: req.user
            });
        }
    },

    uploadMaterial: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng chọn file để tải lên'
                });
            }

            // Create material without class field
            const material = await Material.create({
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                level: req.body.level,
                fileName: req.file.filename,
                originalName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                filePath: `public/uploads/materials/${req.file.filename}`,
                teacher: req.user._id,
                isPublic: true // Set default to public since no class is assigned
            });

            res.status(201).json({
                status: 'success',
                data: material
            });
        } catch (error) {
            console.error('Error in uploadMaterial:', error);
            res.status(500).json({
                status: 'error',
                message: 'Có lỗi xảy ra khi tải lên tài liệu: ' + error.message
            });
        }
    },

    deleteMaterial: async (req, res) => {
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

            const filePath = path.join(__dirname, '../../public/uploads/materials', material.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await Material.findByIdAndDelete(req.params.id);

            res.status(200).json({
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
    },

    downloadMaterial: async (req, res) => {
        try {
            const material = await Material.findById(req.params.id);

            if (!material) {
                return res.status(404).render('error', {
                    message: 'Không tìm thấy tài liệu',
                    user: req.user
                });
            }

            const filePath = path.join(__dirname, '../../public/uploads/materials', material.fileName);
            res.download(filePath, material.originalName);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải xuống tài liệu',
                user: req.user
            });
        }
    }
};

module.exports = materialController;