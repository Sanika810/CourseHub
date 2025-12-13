// ========================
// FILE 9: backend/controllers/courseController.js (Additional file)
// ========================
const Course = require('../models/Course');

// Get course details with ratings
exports.getCourseWithRatings = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .select('-__v')
      .populate('instructor', 'name email bio');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses with average ratings
exports.getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const courses = await Course.find()
      .select('title description price averageRatings totalReviews')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Course.countDocuments();
    
    res.json({
      courses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCourses: count
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};