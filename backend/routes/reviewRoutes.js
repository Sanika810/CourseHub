// ========================
// FILE 4: backend/routes/reviewRoutes.js
// ========================
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// All review routes require authentication
router.use(authMiddleware);

// Submit a review for a course
router.post('/courses/:courseId/reviews', reviewController.submitReview);

// Update a review
router.put('/reviews/:reviewId', reviewController.updateReview);

// Delete a review
router.delete('/reviews/:reviewId', reviewController.deleteReview);

// Get all reviews for a course (public route, no auth needed)
router.get('/courses/:courseId/reviews', reviewController.getCourseReviews);

module.exports = router;