const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');

// Get all tickets (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('userId', 'name email role status blockReason')
      .populate('customerId', 'name email role status blockReason')
      .sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get my tickets (customer, manager, rider)
router.get('/my', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({
      $or: [
        { userId: req.user._id },
        { customerId: req.user._id }
      ]
    }).sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching my tickets:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a ticket (customer, manager, rider)
router.post('/', auth, async (req, res) => {
  try {
    const { subject, initialMessage, ticketType } = req.body;
    const type = ticketType === 'unban' ? 'unban' : 'general';

    // If unban ticket, check if there's already an active open unban ticket
    if (type === 'unban') {
      const existingOpenUnban = await Ticket.findOne({
        $or: [{ userId: req.user._id }, { customerId: req.user._id }],
        ticketType: 'unban',
        status: { $in: ['open', 'in_progress'] }
      });
      if (existingOpenUnban) {
        return res.status(400).json({
          message: 'You already have an active unban appeal ticket open. Please wait for support response.',
          ticket: existingOpenUnban
        });
      }
    }

    const ticketCount = await Ticket.countDocuments();
    const formattedNumber = `TKT-${1000 + ticketCount + 1}`;

    const senderRole = req.user.role && req.user.role !== 'admin' ? req.user.role : 'customer';

    const ticket = new Ticket({
      ticketNumber: formattedNumber,
      userId: req.user._id,
      customerId: req.user._id,
      userRole: senderRole,
      ticketType: type,
      subject: subject || (type === 'unban' ? 'Account Unban Appeal' : 'Support Inquiry'),
      chat: initialMessage ? [{ sender: senderRole, text: initialMessage }] : []
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reply to ticket (admin / owner user)
router.put('/:id/reply', auth, async (req, res) => {
  try {
    const { text, adminAction } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    // Strict locking rule: if closed, no one can send anything!
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'This ticket is closed. No further replies can be sent.' });
    }

    // Check permission
    const isOwner = (ticket.userId && ticket.userId.toString() === req.user._id.toString()) ||
                    (ticket.customerId && ticket.customerId.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sender = isAdmin ? 'support' : (req.user.role || 'customer');
    if (text && text.trim()) {
      ticket.chat.push({ sender, text: text.trim() });
    }

    // If admin provides an action (e.g., unban user)
    if (isAdmin && adminAction) {
      ticket.adminAction = adminAction;

      if (adminAction === 'unban') {
        const targetUserId = ticket.userId || ticket.customerId;
        if (targetUserId) {
          const userToUnban = await User.findById(targetUserId);
          if (userToUnban) {
            userToUnban.status = 'approved';
            userToUnban.blockReason = '';
            await userToUnban.save();

            // Also update restaurant status if manager
            if (userToUnban.role === 'manager') {
              const Restaurant = require('../models/Restaurant');
              await Restaurant.findOneAndUpdate({ managerId: userToUnban._id }, { status: 'approved' });
            }
          }
        }
      }
    }
    
    // Auto update status if support replies and status was open
    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    
    await ticket.save();

    // Populate user info before returning
    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'name email role status blockReason')
      .populate('customerId', 'name email role status blockReason');

    res.json(populated);
  } catch (error) {
    console.error("Error replying to ticket:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Close ticket (admin)
router.put('/:id/close', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { adminAction } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = req.user.name || 'Administrator';
    if (adminAction) {
      ticket.adminAction = adminAction;
    }

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'name email role status blockReason')
      .populate('customerId', 'name email role status blockReason');

    res.json(populated);
  } catch (error) {
    console.error("Error closing ticket:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update status (admin)
router.put('/:id/status', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'closed') {
      updateData.closedAt = new Date();
      updateData.closedBy = req.user.name || 'Administrator';
    }
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('userId', 'name email role status blockReason')
      .populate('customerId', 'name email role status blockReason');
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Assign ticket (admin)
router.put('/:id/assign', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true })
      .populate('userId', 'name email role status blockReason')
      .populate('customerId', 'name email role status blockReason');
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

