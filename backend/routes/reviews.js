const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');

// POST /api/reviews - Submit a review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { courseId, overallRating, contentQuality, instructorQuality, valueForMoney, reviewText } = req.body;
    const userId = req.userId;

    // Check if user already reviewed
    const existingReview = await Review.findOne({ userId, courseId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this course' });
    }

    // Create review
    const review = new Review({
      userId,
      courseId,
      overallRating,
      contentQuality,
      instructorQuality,
      valueForMoney,
      reviewText
    });

    await review.save();

    // Update course ratings
    await updateCourseRatings(courseId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reviews/course/:courseId - Get reviews for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const reviews = await Review.find({ courseId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const course = await Course.findById(courseId);
    
    res.json({
      success: true,
      reviews,
      course: {
        rating: course?.rating || 0,
        reviews: course?.reviews || 0,
        contentQuality: course?.contentQuality || 0,
        instructorQuality: course?.instructorQuality || 0,
        valueForMoney: course?.valueForMoney || 0
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update course ratings function
async function updateCourseRatings(courseId) {
  try {
    const reviews = await Review.find({ courseId });
    
    if (reviews.length === 0) {
      await Course.findByIdAndUpdate(courseId, {
        rating: 0,
        reviews: 0,
        contentQuality: 0,
        instructorQuality: 0,
        valueForMoney: 0,
        'ratingBreakdown.5': 0,
        'ratingBreakdown.4': 0,
        'ratingBreakdown.3': 0,
        'ratingBreakdown.2': 0,
        'ratingBreakdown.1': 0
      });
      return;
    }

    // Calculate totals
    let totalOverall = 0;
    let totalContent = 0;
    let totalInstructor = 0;
    let totalValue = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(review => {
      totalOverall += review.overallRating;
      totalContent += review.contentQuality;
      totalInstructor += review.instructorQuality;
      totalValue += review.valueForMoney;
      
      const roundedRating = Math.round(review.overallRating);
      distribution[roundedRating]++;
    });

    // Calculate averages
    const avgOverall = totalOverall / reviews.length;
    const avgContent = totalContent / reviews.length;
    const avgInstructor = totalInstructor / reviews.length;
    const avgValue = totalValue / reviews.length;

    // Update course
    await Course.findByIdAndUpdate(courseId, {
      rating: parseFloat(avgOverall.toFixed(1)),
      reviews: reviews.length,
      contentQuality: parseFloat(avgContent.toFixed(1)),
      instructorQuality: parseFloat(avgInstructor.toFixed(1)),
      valueForMoney: parseFloat(avgValue.toFixed(1)),
      'ratingBreakdown.5': distribution[5],
      'ratingBreakdown.4': distribution[4],
      'ratingBreakdown.3': distribution[3],
      'ratingBreakdown.2': distribution[2],
      'ratingBreakdown.1': distribution[1]
    });

    console.log(`✅ Updated ratings for course ${courseId}: Overall ${avgOverall.toFixed(1)}`);
  } catch (error) {
    console.error('❌ Error updating course ratings:', error);
  }
}

module.exports = router;