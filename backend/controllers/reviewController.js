// ========================
// FILE 3: backend/controllers/reviewController.js
// ========================
const Review = require('../models/Review');
const Course = require('../models/Course');

// Submit a review
exports.submitReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { overallRating, contentQuality, instructorQuality, valueForMoney, reviewText } = req.body;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already reviewed this course
    const existingReview = await Review.findOne({ userId, courseId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }

    // Create new review
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

    // Update course average ratings
    await updateCourseRatings(courseId);

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { overallRating, contentQuality, instructorQuality, valueForMoney, reviewText } = req.body;
    const userId = req.user.id;

    // Find and update review
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Update review
    review.overallRating = overallRating || review.overallRating;
    review.contentQuality = contentQuality || review.contentQuality;
    review.instructorQuality = instructorQuality || review.instructorQuality;
    review.valueForMoney = valueForMoney || review.valueForMoney;
    review.reviewText = reviewText || review.reviewText;

    await review.save();

    // Update course average ratings
    await updateCourseRatings(review.courseId);

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find and delete review
    const review = await Review.findOneAndDelete({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Update course average ratings
    await updateCourseRatings(review.courseId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course reviews with averages
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Get course with average ratings
    const course = await Course.findById(courseId).select('averageRatings totalReviews');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all reviews for this course
    const reviews = await Review.find({ courseId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      courseId,
      averageRatings: course.averageRatings,
      totalReviews: course.totalReviews,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update course average ratings
async function updateCourseRatings(courseId) {
  try {
    // Aggregate all reviews for this course
    const reviews = await Review.find({ courseId });
    
    if (reviews.length === 0) {
      // No reviews, reset to defaults
      await Course.findByIdAndUpdate(courseId, {
        'averageRatings.overall': 0,
        'averageRatings.contentQuality': 0,
        'averageRatings.instructorQuality': 0,
        'averageRatings.valueForMoney': 0,
        totalReviews: 0,
        'ratingsDistribution.overall': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        'ratingsDistribution.contentQuality': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        'ratingsDistribution.instructorQuality': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        'ratingsDistribution.valueForMoney': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      return;
    }

    // Calculate averages
    const totals = reviews.reduce((acc, review) => {
      acc.overall += review.overallRating;
      acc.contentQuality += review.contentQuality;
      acc.instructorQuality += review.instructorQuality;
      acc.valueForMoney += review.valueForMoney;
      return acc;
    }, { overall: 0, contentQuality: 0, instructorQuality: 0, valueForMoney: 0 });

    // Calculate distribution
    const distribution = {
      overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      contentQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      instructorQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      valueForMoney: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    reviews.forEach(review => {
      distribution.overall[review.overallRating]++;
      distribution.contentQuality[review.contentQuality]++;
      distribution.instructorQuality[review.instructorQuality]++;
      distribution.valueForMoney[review.valueForMoney]++;
    });

    // Update course
    await Course.findByIdAndUpdate(courseId, {
      'averageRatings.overall': totals.overall / reviews.length,
      'averageRatings.contentQuality': totals.contentQuality / reviews.length,
      'averageRatings.instructorQuality': totals.instructorQuality / reviews.length,
      'averageRatings.valueForMoney': totals.valueForMoney / reviews.length,
      totalReviews: reviews.length,
      'ratingsDistribution.overall': distribution.overall,
      'ratingsDistribution.contentQuality': distribution.contentQuality,
      'ratingsDistribution.instructorQuality': distribution.instructorQuality,
      'ratingsDistribution.valueForMoney': distribution.valueForMoney
    });
  } catch (error) {
    console.error('Error updating course ratings:', error);
    throw error;
  }
}