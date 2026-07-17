const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth, restrictTo } = require('../middleware/auth');

// Get all tickets (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('customerId', 'name email').sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get my tickets (customer)
router.get('/my', auth, restrictTo('customer'), async (req, res) => {
  try {
    const tickets = await Ticket.find({ customerId: req.user._id }).sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a ticket (customer)
router.post('/', auth, restrictTo('customer'), async (req, res) => {
  try {
    const { subject, initialMessage } = req.body;
    const ticketCount = await Ticket.countDocuments();
    const ticket = new Ticket({
      ticketNumber: `TK-${100 + ticketCount + 1}`,
      customerId: req.user._id,
      subject,
      chat: initialMessage ? [{ sender: 'customer', text: initialMessage }] : []
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reply to ticket (admin/customer)
router.put('/:id/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    // Check permission
    if (req.user.role === 'customer' && ticket.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sender = req.user.role === 'customer' ? 'customer' : 'support';
    ticket.chat.push({ sender, text });
    
    // Auto update status if support replies
    if (sender === 'support') ticket.status = 'resolved';
    
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update status (admin)
router.put('/:id/status', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Assign ticket (admin)
router.put('/:id/assign', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
