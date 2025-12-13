const mongoose = require('mongoose');

// Predefined thumbnails for different categories
const categoryThumbnails = {
  'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  'Machine Learning': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
  'Data Science': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
  'Cloud': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
  'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
  'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
  'Business': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
  'Default': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
};

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  provider: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  duration: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  language: { type: String, default: 'English' },
  tags: { type: [String], default: [] },
  category: { type: String, required: true },
  skills: { type: [String], default: [] },
  syllabus: [{ title: String, topics: [String] }],
  thumbnail: { type: String },
  url: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  ratingBreakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  contentQuality: { type: Number, default: 0, min: 0, max: 5 },
  instructorQuality: { type: Number, default: 0, min: 0, max: 5 },
  valueForMoney: { type: Number, default: 0, min: 0, max: 5 },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// Auto-assign thumbnail based on category
courseSchema.pre('save', function(next) {
  if (!this.thumbnail || this.thumbnail === '') {
    // Find matching category
    const mainCategory = this.tags && this.tags.length > 0 
      ? this.tags[0] 
      : this.category || 'Default';
    
    let thumbnail = categoryThumbnails.Default;
    
    // Check each category
    for (const [category, url] of Object.entries(categoryThumbnails)) {
      if (mainCategory.toLowerCase().includes(category.toLowerCase()) ||
          (this.tags && this.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase())))) {
        thumbnail = url;
        break;
      }
    }
    
    this.thumbnail = thumbnail + '?w=400';
  }
  
  next();
});

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);