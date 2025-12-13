const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/coursehub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the User model
    const User = require('./models/User');
    
    // Find the admin user
    const admin = await User.findOne({ email: 'budhesanika@gmail.com' });
    
    if (admin) {
      console.log('✅ Found admin:', admin.name);
      console.log('Current role:', admin.role);
      
      // Update role to admin
      admin.role = 'admin';
      admin.name = 'Sanika Admin';
      
      // Reset password to Sanika810
      admin.password = await bcrypt.hash('Sanika810', 10);
      
      // Add admin badges
      admin.badges = ['admin', 'founder', 'moderator'];
      admin.xp = 1000;
      
      await admin.save();
      
      console.log('✅ ADMIN PASSWORD RESET SUCCESSFULLY!');
      console.log('======================================');
      console.log('Email: budhesanika@gmail.com');
      console.log('Password: Sanika810');
      console.log('Role: admin (was: ' + (admin._doc?.role || 'user') + ')');
      console.log('======================================');
      
      // Verify the password
      const testMatch = await bcrypt.compare('Sanika810', admin.password);
      console.log('✅ Password verification:', testMatch ? 'PASSED' : 'FAILED');
      
    } else {
      console.log('❌ Admin not found! Creating new one...');
      
      const hashedPassword = await bcrypt.hash('Sanika810', 10);
      
      const newAdmin = new User({
        name: 'Sanika Admin',
        email: 'budhesanika@gmail.com',
        password: hashedPassword,
        role: 'admin',
        xp: 1000,
        badges: ['admin', 'founder'],
        profile: {
          skills: ['Administration'],
          goals: 'Manage platform',
          weeklyHours: 40
        }
      });
      
      await newAdmin.save();
      console.log('✅ New admin created!');
    }
    
    console.log('\n✅ DONE! Now restart your backend and try login:');
    console.log('Email: budhesanika@gmail.com');
    console.log('Password: Sanika810');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();