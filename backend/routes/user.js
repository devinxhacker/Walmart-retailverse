const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // Return demo user data
    res.json({
      _id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@example.com',
      isAdmin: false
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    // Return demo users data
    const users = [
      { _id: '1', name: 'John Doe', email: 'john@example.com', isAdmin: true },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isAdmin: false },
      { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', isAdmin: false }
    ];
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // Return updated demo user data
    res.json({ 
      id: 'demo-user-id', 
      name: req.body.name || 'Demo User', 
      email: req.body.email || 'demo@example.com', 
      isAdmin: false 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 