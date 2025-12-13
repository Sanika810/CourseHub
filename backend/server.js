const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Helper function to create notifications
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      read: false
    });
    await notification.save();
    console.log(`✅ Notification created: ${title} for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Function to send notifications to all admins
const notifyAdmins = async (type, title, message, data = {}) => {
  try {
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await createNotification(admin._id, type, title, message, data);
    }
    
    console.log(`✅ Notified ${adminUsers.length} admin(s) about: ${title}`);
  } catch (error) {
    console.error('❌ Error notifying admins:', error);
  }
};

// NEW FUNCTION: Notify course submitter when status changes
const notifyCourseStatusChange = async (course, newStatus, reason = '') => {
  try {
    if (!course.submittedBy) return;
    
    const notificationType = `course_${newStatus}`;
    const notificationTitle = `Course ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
    
    let notificationMessage = '';
    if (newStatus === 'approved') {
      notificationMessage = `Your course "${course.title}" has been approved and is now live on CourseHub!`;
    } else if (newStatus === 'rejected') {
      notificationMessage = `Your course "${course.title}" has been rejected.`;
      if (reason) {
        notificationMessage += ` Reason: ${reason}`;
      } else {
        notificationMessage += ' Please review the guidelines and resubmit.';
      }
    } else if (newStatus === 'pending') {
      notificationMessage = `Your course "${course.title}" status has been updated to pending review.`;
    }
    
    await createNotification(
      course.submittedBy._id || course.submittedBy,
      notificationType,
      notificationTitle,
      notificationMessage,
      { courseId: course._id }
    );
    
    console.log(`✅ Notification sent to submitter: ${notificationTitle}`);
  } catch (error) {
    console.error('❌ Error notifying course status change:', error);
  }
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coursehub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Seed initial data
    await seedInitialData();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Seed initial data
async function seedInitialData() {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('👤 Creating default admin user...');
      
      // Create fixed admin user
      const hashedPassword = await bcrypt.hash('Sanika810', 10);
      const adminUser = new User({
        name: 'Sanika Admin',
        email: 'budhesanika@gmail.com',
        password: hashedPassword,
        role: 'admin',
        xp: 1000,
        badges: ['admin', 'founder', 'moderator'],
        profile: {
          skills: ['Administration', 'Management', 'Content Moderation'],
          goals: 'Manage CourseHub platform and ensure quality content',
          weeklyHours: 40
        }
      });
      
      await adminUser.save();
      console.log('✅ Admin user created:', adminUser.email);
      
      // Check if any courses exist
      const courseCount = await Course.countDocuments();
      
      if (courseCount === 0) {
        console.log('📚 Seeding initial courses...');
        
        // Create initial courses
        const initialCourses = [
          {
            title: 'Complete Web Development Bootcamp',
            instructor: 'Dr. Angela Yu',
            provider: 'Udemy',
            price: 84.99,
            duration: '65 hours',
            level: 'Beginner',
            rating: 4.7,
            reviews: 285432,
            thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
            tags: ['Web Development', 'JavaScript', 'React'],
            skills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'React'],
            description: 'Learn web development from scratch. Build real projects and become a professional developer.',
            ratingBreakdown: { 5: 68, 4: 20, 3: 8, 2: 3, 1: 1 },
            contentQuality: 4.8,
            instructorQuality: 4.9,
            valueForMoney: 4.6,
            url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
            status: 'approved',
            submittedBy: adminUser._id
          },
          {
            title: 'Machine Learning A-Z',
            instructor: 'Kirill Eremenko',
            provider: 'Udemy',
            price: 94.99,
            duration: '44 hours',
            level: 'Intermediate',
            rating: 4.5,
            reviews: 157890,
            thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
            tags: ['Machine Learning', 'Python', 'AI'],
            skills: ['Python', 'TensorFlow', 'Data Science'],
            description: 'Master Machine Learning with Python and build AI applications that solve real problems.',
            ratingBreakdown: { 5: 62, 4: 24, 3: 10, 2: 3, 1: 1 },
            contentQuality: 4.6,
            instructorQuality: 4.7,
            valueForMoney: 4.4,
            url: 'https://www.udemy.com/course/machinelearning/',
            status: 'approved',
            submittedBy: adminUser._id
          },
          {
            title: 'AWS Certified Solutions Architect',
            instructor: 'Stephane Maarek',
            provider: 'Udemy',
            price: 89.99,
            duration: '27 hours',
            level: 'Advanced',
            rating: 4.6,
            reviews: 98765,
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
            tags: ['AWS', 'Cloud', 'DevOps'],
            skills: ['AWS', 'Cloud Architecture', 'DevOps'],
            description: 'Pass the AWS certification exam and become a cloud expert with hands-on projects.',
            ratingBreakdown: { 5: 65, 4: 22, 3: 9, 2: 3, 1: 1 },
            contentQuality: 4.7,
            instructorQuality: 4.8,
            valueForMoney: 4.5,
            url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate/',
            status: 'approved',
            submittedBy: adminUser._id
          },
          {
            title: 'Python for Data Science',
            instructor: 'Jose Portilla',
            provider: 'Udemy',
            price: 79.99,
            duration: '25 hours',
            level: 'Beginner',
            rating: 4.6,
            reviews: 134567,
            thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
            tags: ['Python', 'Data Science', 'Analytics'],
            skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
            description: 'Learn Python for data analysis and visualization with real-world datasets.',
            ratingBreakdown: { 5: 67, 4: 21, 3: 8, 2: 3, 1: 1 },
            contentQuality: 4.7,
            instructorQuality: 4.8,
            valueForMoney: 4.5,
            url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
            status: 'approved',
            submittedBy: adminUser._id
          }
        ];
        
        await Course.insertMany(initialCourses);
        console.log(`✅ ${initialCourses.length} courses seeded`);
      }
    }
    
    // Ensure fixed admin exists
    await ensureFixedAdminExists();
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Ensure fixed admin exists
async function ensureFixedAdminExists() {
  try {
    const bcrypt = require('bcryptjs');
    
    const adminEmail = 'budhesanika@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('👑 Creating fixed admin user...');
      
      const hashedPassword = await bcrypt.hash('Sanika810', 10);
      
      const adminUser = new User({
        name: 'Sanika Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        xp: 1000,
        badges: ['admin', 'founder', 'moderator'],
        profile: {
          skills: ['Administration', 'Management', 'Content Moderation'],
          goals: 'Manage CourseHub platform and ensure quality content',
          weeklyHours: 40
        }
      });
      
      await adminUser.save();
      console.log('✅ Fixed admin created successfully!');
      console.log('   Email: budhesanika@gmail.com');
      console.log('   Password: Sanika810');
    } else {
      // Update admin user if exists
      existingAdmin.role = 'admin';
      existingAdmin.name = 'Sanika Admin';
      existingAdmin.xp = 1000;
      existingAdmin.badges = ['admin', 'founder', 'moderator'];
      
      await existingAdmin.save();
      console.log('✅ Fixed admin already exists and updated:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error ensuring admin exists:', error);
  }
}

// Make helper functions available globally
global.createNotification = createNotification;
global.notifyAdmins = notifyAdmins;
global.notifyCourseStatusChange = notifyCourseStatusChange;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      error: `Duplicate ${field} value detected. Please use a different value.` 
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: messages.join(', ') });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong! Please try again later.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export the app for testing
module.exports = app;