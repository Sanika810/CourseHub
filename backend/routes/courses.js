const express = require('express');
const Course = require('../models/Course');
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all approved courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'approved' })
      .populate('submittedBy', 'name email')
      .sort({ rating: -1, reviews: -1 })
      .limit(50);
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// Search courses
router.get('/search', async (req, res) => {
  try {
    const { q, provider, level, minPrice, maxPrice, tags, category } = req.query;
    let query = { status: 'approved' };
    
    if (q) {
      query.$text = { $search: q };
    }
    if (provider) query.provider = provider;
    if (level) query.level = level;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (tags) query.tags = { $in: tags.split(',') };
    
    const courses = await Course.find(query)
      .populate('submittedBy', 'name email')
      .sort({ rating: -1, reviews: -1 })
      .limit(50);
    
    res.json(courses);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get course details with reviews
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('submittedBy', 'name email');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Fetch reviews with user details
    const reviews = await Review.find({ course: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      contentQuality: review.contentQuality,
      instructorQuality: review.instructorQuality,
      valueForMoney: review.valueForMoney,
      text: review.text,
      pros: review.pros,
      cons: review.cons,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      userId: {
        _id: review.user._id,
        name: review.user.name,
        email: review.user.email
      }
    }));
    
    res.json({ 
      course: course.toObject(),
      reviews: formattedReviews 
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Submit new course
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const courseData = {
      ...req.body,
      price: req.body.price && !isNaN(req.body.price) && req.body.price >= 0 ? Number(req.body.price) : 0,
      submittedBy: req.userId,
      status: req.userRole === 'admin' ? 'approved' : 'pending',
      rating: req.body.rating || 0,
      reviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      contentQuality: req.body.contentQuality || 0,
      instructorQuality: req.body.instructorQuality || 0,
      valueForMoney: req.body.valueForMoney || 0
    };
    
    const course = new Course(courseData);
    await course.save();
    
    // Populate for response
    await course.populate('submittedBy', 'name email');
    
    // Create notification for admin if user is not admin
    if (req.userRole !== 'admin') {
      // Use the global notifyAdmins function
      if (typeof global.notifyAdmins === 'function') {
        await global.notifyAdmins(
          'course_pending',
          'New Course Pending Review',
          `${user.name} submitted a new course: "${course.title}"`,
          { courseId: course._id, userId: user._id }
        );
      }
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error submitting course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add/update review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, contentQuality, instructorQuality, valueForMoney, text, pros, cons } = req.body;
    const courseId = req.params.id;
    const userId = req.userId;
    
    // Validate required fields
    if (!rating || !contentQuality || !instructorQuality || !valueForMoney) {
      return res.status(400).json({ error: 'All rating fields are required' });
    }
    
    // Get user and course
    const user = await User.findById(userId).select('name email');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for existing review
    let review = await Review.findOne({ course: courseId, user: userId });
    
    if (review) {
      // Update existing review
      review.rating = rating;
      review.contentQuality = contentQuality;
      review.instructorQuality = instructorQuality;
      review.valueForMoney = valueForMoney;
      review.text = text || '';
      review.pros = pros || '';
      review.cons = cons || '';
      await review.save();
    } else {
      // Create new review
      review = new Review({
        course: courseId,
        user: userId,
        rating,
        contentQuality,
        instructorQuality,
        valueForMoney,
        text: text || '',
        pros: pros || '',
        cons: cons || ''
      });
      await review.save();
      
      // Update course review count
      course.reviews = (course.reviews || 0) + 1;
      await course.save();
    }
    
    // Update course ratings
    const updatedCourse = await updateCourseRatings(courseId);
    
    // Get updated reviews with user details
    const updatedReviews = await Review.find({ course: courseId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Format reviews for response
    const formattedReviews = updatedReviews.map(rev => ({
      _id: rev._id,
      rating: rev.rating,
      contentQuality: rev.contentQuality,
      instructorQuality: rev.instructorQuality,
      valueForMoney: rev.valueForMoney,
      text: rev.text,
      pros: rev.pros,
      cons: rev.cons,
      helpfulCount: rev.helpfulCount,
      createdAt: rev.createdAt,
      userId: {
        _id: rev.user._id,
        name: rev.user.name,
        email: rev.user.email
      }
    }));
    
    res.json({ 
      success: true, 
      reviews: formattedReviews,
      course: updatedCourse.toObject()
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'You have already reviewed this course. Please update your existing review.' 
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Save/unsave course for user
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if course is already saved
    const isSaved = user.savedCourses.includes(courseId);
    
    if (isSaved) {
      // Unsave course
      user.savedCourses = user.savedCourses.filter(id => id.toString() !== courseId);
    } else {
      // Save course
      user.savedCourses.push(courseId);
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      saved: !isSaved,
      savedCourses: user.savedCourses 
    });
  } catch (error) {
    console.error('Error saving course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's saved courses
router.get('/user/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'savedCourses',
        populate: {
          path: 'submittedBy',
          select: 'name email'
        }
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.savedCourses || []);
  } catch (error) {
    console.error('Error fetching saved courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get courses submitted by user
router.get('/user/submitted', auth, async (req, res) => {
  try {
    const courses = await Course.find({ submittedBy: req.userId })
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching submitted courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get pending courses for user
router.get('/user/pending', auth, async (req, res) => {
  try {
    const courses = await Course.find({ 
      submittedBy: req.userId,
      status: 'pending'
    })
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching pending courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// NEW ENDPOINT: Update course status (for admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const courseId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Validate status
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Find and update course
    const course = await Course.findByIdAndUpdate(
      courseId,
      { 
        status,
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('submittedBy', 'name email');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create notification for the submitter
    if (course.submittedBy && typeof global.createNotification === 'function') {
      const notificationType = status === 'approved' ? 'course_approved' : 
                             status === 'rejected' ? 'course_rejected' : 'course_pending';
      const notificationTitle = status === 'approved' ? 'Course Approved' : 
                              status === 'rejected' ? 'Course Rejected' : 'Course Status Updated';
      const notificationMessage = status === 'approved' ? 
        `Your course "${course.title}" has been approved and is now live!` :
        status === 'rejected' ? 
        `Your course "${course.title}" has been rejected. Please review the guidelines and resubmit.` :
        `Your course "${course.title}" status has been updated to ${status}.`;
      
      await global.createNotification(
        course.submittedBy._id,
        notificationType,
        notificationTitle,
        notificationMessage,
        { courseId: course._id }
      );
    }
    
    res.json({ 
      success: true, 
      course,
      message: `Course ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to update course ratings
async function updateCourseRatings(courseId) {
  try {
    const reviews = await Review.find({ course: courseId });
    
    if (reviews.length === 0) {
      // Return course without updates
      const course = await Course.findById(courseId).populate('submittedBy', 'name email');
      return course;
    }
    
    const totalReviews = reviews.length;
    
    // Calculate averages
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const avgContentQuality = reviews.reduce((sum, r) => sum + r.contentQuality, 0) / totalReviews;
    const avgInstructorQuality = reviews.reduce((sum, r) => sum + r.instructorQuality, 0) / totalReviews;
    const avgValueForMoney = reviews.reduce((sum, r) => sum + r.valueForMoney, 0) / totalReviews;
    
    // Calculate rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingBreakdown[rating]++;
      }
    });
    
    // Convert to percentages
    Object.keys(ratingBreakdown).forEach(key => {
      ratingBreakdown[key] = Math.round((ratingBreakdown[key] / totalReviews) * 100);
    });
    
    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: totalReviews,
        contentQuality: parseFloat(avgContentQuality.toFixed(1)),
        instructorQuality: parseFloat(avgInstructorQuality.toFixed(1)),
        valueForMoney: parseFloat(avgValueForMoney.toFixed(1)),
        ratingBreakdown,
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('submittedBy', 'name email');
    
    return updatedCourse;
  } catch (error) {
    console.error('Error updating course ratings:', error);
    // Return the course without updates if there's an error
    const course = await Course.findById(courseId).populate('submittedBy', 'name email');
    return course;
  }
}

module.exports = router;