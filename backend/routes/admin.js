// backend/routes/admin.js
const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending courses
router.get('/pending-courses', auth, adminAuth, async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' })
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all courses for admin
router.get('/all-courses', auth, adminAuth, async (req, res) => {
  try {
    const courses = await Course.find({}).populate('submittedBy', 'name email').sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve course
router.post('/courses/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved', 
        lastUpdated: new Date(),
        approvedAt: new Date(),
        approvedBy: req.userId
      },
      { new: true }
    ).populate('submittedBy');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create notification for the submitter
    if (typeof global.notifyCourseStatusChange === 'function') {
      await global.notifyCourseStatusChange(course, 'approved');
    }
    
    // Also notify admins that course was approved
    if (typeof global.notifyAdmins === 'function') {
      await global.notifyAdmins(
        'admin_alert',
        'Course Approved',
        `Course "${course.title}" has been approved by ${req.user?.name || 'Admin'}`,
        { courseId: course._id }
      );
    }
    
    res.json({ 
      success: true, 
      course,
      message: 'Course approved successfully' 
    });
  } catch (error) {
    console.error('Error approving course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reject course
router.post('/courses/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const reason = req.body.reason || '';
    
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected', 
        lastUpdated: new Date(),
        rejectedAt: new Date(),
        rejectedBy: req.userId,
        rejectionReason: reason
      },
      { new: true }
    ).populate('submittedBy');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create notification for the submitter
    if (typeof global.notifyCourseStatusChange === 'function') {
      await global.notifyCourseStatusChange(course, 'rejected', reason);
    }
    
    // Also notify admins that course was rejected
    if (typeof global.notifyAdmins === 'function') {
      await global.notifyAdmins(
        'admin_alert',
        'Course Rejected',
        `Course "${course.title}" has been rejected by ${req.user?.name || 'Admin'}. ${reason ? `Reason: ${reason}` : ''}`,
        { courseId: course._id }
      );
    }
    
    res.json({ 
      success: true, 
      course,
      message: 'Course rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', auth, adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Delete associated reviews
    await Review.deleteMany({ course: req.params.id });
    
    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update course status (alternative endpoint)
router.put('/courses/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = { 
      status, 
      lastUpdated: new Date() 
    };
    
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = req.userId;
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = req.userId;
      updateData.rejectionReason = reason || 'No reason provided';
    }
    
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('submittedBy');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create notification for the submitter
    if (typeof global.notifyCourseStatusChange === 'function') {
      await global.notifyCourseStatusChange(course, status, reason);
    }
    
    // Notify admins about status change
    if (typeof global.notifyAdmins === 'function') {
      await global.notifyAdmins(
        'admin_alert',
        `Course ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Course "${course.title}" has been ${status} by ${req.user?.name || 'Admin'}.`,
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

// Get dashboard stats (admin only)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const approvedCourses = await Course.countDocuments({ status: 'approved' });
    const pendingCourses = await Course.countDocuments({ status: 'pending' });
    const rejectedCourses = await Course.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Get recent activity
    const recentCourses = await Course.find({})
      .sort({ lastUpdated: -1 })
      .limit(5)
      .populate('submittedBy', 'name email');
    
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');
    
    res.json({
      totalCourses,
      approvedCourses,
      pendingCourses,
      rejectedCourses,
      totalUsers,
      totalReviews,
      recentCourses,
      recentUsers
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUBLIC STATS ENDPOINT (accessible without auth)
router.get('/public-stats', async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const approvedCourses = await Course.countDocuments({ status: 'approved' });
    const pendingCourses = await Course.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Calculate average rating from approved courses
    const approvedCoursesData = await Course.find({ status: 'approved', rating: { $gt: 0 } });
    const avgRating = approvedCoursesData.length > 0 
      ? (approvedCoursesData.reduce((sum, c) => sum + c.rating, 0) / approvedCoursesData.length).toFixed(1)
      : 0;
    
    // Get unique providers from approved courses
    const uniqueProviders = await Course.distinct('provider', { status: 'approved' });
    
    // Get unique instructors from approved courses
    const uniqueInstructors = await Course.distinct('instructor', { status: 'approved' });
    
    res.json({
      totalCourses,
      approvedCourses,
      pendingCourses,
      totalUsers,
      totalReviews,
      avgCourseRating: parseFloat(avgRating),
      totalProviders: uniqueProviders.length,
      totalInstructors: uniqueInstructors.length
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;