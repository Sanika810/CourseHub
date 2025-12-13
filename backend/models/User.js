const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profile: {
    skills: { type: [String], default: [] },
    goals: { type: String, default: '' },
    weeklyHours: { type: Number, default: 10 }
  },
  savedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Create a fixed admin user on model initialization
userSchema.statics.ensureAdminExists = async function() {
  try {
    const adminEmail = 'budhesanika@gmail.com';
    const adminExists = await this.findOne({ email: adminEmail });
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Sanika810', 10);
      
      const adminUser = new this({
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
      console.log('✅ Fixed admin user created:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

module.exports = mongoose.model('User', userSchema);