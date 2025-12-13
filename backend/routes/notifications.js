const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create notification (for internal use)
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data
    });
    
    await notification.save();
    res.json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;