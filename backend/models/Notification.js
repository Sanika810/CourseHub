const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['course_pending', 'course_approved', 'course_rejected', 'new_review', 'admin_alert'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' }
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);