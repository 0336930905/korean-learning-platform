const express = require('express');
const router = express.Router();
const classTestController = require('../controllers/classTestController');
const { requireAuth } = require('../middleware/auth');

// Class test routes
router.get('/teacher/classTests', requireAuth, classTestController.getClassTests);
router.post('/teacher/classTests/add', requireAuth, classTestController.createClassTest);
router.get('/teacher/classTests/:id', requireAuth, classTestController.getTestDetails);
router.put('/teacher/classTests/:id', requireAuth, classTestController.updateClassTest);
router.delete('/teacher/classTests/:id', requireAuth, classTestController.deleteClassTest);

// Export the router
module.exports = router;