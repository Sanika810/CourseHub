// ========================
// FILE 10: backend/routes/courseRoutes.js (Additional file)
// ========================
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:courseId', courseController.getCourseWithRatings);

module.exports = router;