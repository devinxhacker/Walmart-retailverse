const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// Create order
router.post('/', async (req, res) => {
  try {
    const order = new Order({ ...req.body, user: 'demo-user-id' });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/myorders', async (req, res) => {
  try {
    // Return demo orders or empty array
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order to paid
router.put('/:id/pay', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order to delivered
router.put('/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 