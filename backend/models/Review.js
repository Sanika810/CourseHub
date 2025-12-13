const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  contentQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  instructorQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  valueForMoney: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  text: {
    type: String,
    trim: true,
    default: ''
  },
  pros: {
    type: String,
    trim: true,
    default: ''
  },
  cons: {
    type: String,
    trim: true,
    default: ''
  },
  helpfulCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// FIXED: Index with partial filter to prevent null duplicates
reviewSchema.index({ course: 1, user: 1 }, { 
  unique: true,
  partialFilterExpression: {
    course: { $exists: true, $ne: null },
    user: { $exists: true, $ne: null }
  }
});

module.exports = mongoose.model('Review', reviewSchema);