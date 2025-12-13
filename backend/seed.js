const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Course = require('./models/Course');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@coursehub.com',
      password: hashedPassword,
      role: 'admin',
      xp: 1000,
      badges: ['admin', 'pioneer'],
      profile: {
        skills: ['Management', 'Administration'],
        goals: 'Manage CourseHub platform',
        weeklyHours: 40
      }
    });

    await adminUser.save();
    console.log('Admin user created:', adminUser.email);

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
        status: 'approved',
        submittedBy: adminUser._id
      }
    ];

    await Course.insertMany(initialCourses);
    console.log(`${initialCourses.length} courses seeded`);

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();