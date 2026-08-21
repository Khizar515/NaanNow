const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');
const ticketUpload = require('../middleware/ticketUpload');

// Middleware to pre-populate friendly ticket number for file upload folder naming
const setFriendlyTicketIdOnCreate = async (req, res, next) => {
  try {
    const ticketCount = await Ticket.countDocuments();
    req.friendlyTicketId = `TKT-${1000 + ticketCount + 1}`;
    next();
  } catch (err) {
    next(err);
  }
};

const setFriendlyTicketIdOnReply = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket && ticket.ticketNumber) {
      req.friendlyTicketId = ticket.ticketNumber;
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Get all tickets (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction')
      .sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Check user's unban ticket status/restriction
router.get('/unban-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let restriction = user.unbanRestriction || { canOpen: true, blockedUntil: null, adminRemarks: '' };
    
    // Check if restriction period has expired
    if (restriction.canOpen === false && restriction.blockedUntil) {
      if (new Date() >= new Date(restriction.blockedUntil)) {
        restriction.canOpen = true;
        restriction.blockedUntil = null;
        user.unbanRestriction = restriction;
        await user.save();
      }
    }
    
    res.json(restriction);
  } catch (error) {
    console.error("Error fetching unban status:", error);
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

// Get single ticket by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a ticket (customer, manager, rider)
router.post('/', auth, setFriendlyTicketIdOnCreate, ticketUpload.array('attachments', 5), async (req, res) => {
  try {
    const { subject, initialMessage, ticketType } = req.body;
    const type = ticketType === 'unban' ? 'unban' : 'general';

    // If unban ticket, check user's unbanRestriction
    if (type === 'unban') {
      const user = await User.findById(req.user._id);
      if (user && user.unbanRestriction && user.unbanRestriction.canOpen === false) {
        if (user.unbanRestriction.blockedUntil && new Date() < new Date(user.unbanRestriction.blockedUntil)) {
          return res.status(403).json({
            message: `You are restricted from opening an unban ticket until ${new Date(user.unbanRestriction.blockedUntil).toLocaleDateString()}. Remarks: ${user.unbanRestriction.adminRemarks || 'None'}`
          });
        } else if (!user.unbanRestriction.blockedUntil) {
          return res.status(403).json({
            message: `You are permanently restricted from creating unban appeal tickets. Remarks: ${user.unbanRestriction.adminRemarks || 'None'}`
          });
        }
      }

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

    const formattedNumber = req.friendlyTicketId || `TKT-${1000 + (await Ticket.countDocuments()) + 1}`;
    const senderRole = req.user.role && req.user.role !== 'admin' ? req.user.role : 'customer';

    const attachmentPaths = req.files ? req.files.map(f => '/' + f.path.replace(/\\/g, '/')) : [];

    const initialChat = [];
    if ((initialMessage && initialMessage.trim()) || attachmentPaths.length > 0) {
      initialChat.push({
        sender: senderRole,
        text: initialMessage ? initialMessage.trim() : 'Attached files for review.',
        attachments: attachmentPaths
      });
    }

    const ticket = new Ticket({
      ticketNumber: formattedNumber,
      userId: req.user._id,
      customerId: req.user._id,
      userRole: senderRole,
      ticketType: type,
      subject: subject || (type === 'unban' ? 'Account Unban Appeal' : 'Support Inquiry'),
      chat: initialChat
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reply to ticket (admin / owner user)
router.put('/:id/reply', auth, setFriendlyTicketIdOnReply, ticketUpload.array('attachments', 5), async (req, res) => {
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
    const attachmentPaths = req.files ? req.files.map(f => '/' + f.path.replace(/\\/g, '/')) : [];

    if ((text && text.trim()) || attachmentPaths.length > 0) {
      ticket.chat.push({
        sender,
        text: text ? text.trim() : 'Attached file(s).',
        attachments: attachmentPaths
      });
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
            userToUnban.unbanRestriction = { canOpen: true, blockedUntil: null, adminRemarks: '' };
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
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction');

    res.json(populated);
  } catch (error) {
    console.error("Error replying to ticket:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Close ticket (admin)
router.put('/:id/close', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { adminAction, unbanRestriction } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = req.user.name || 'Administrator';
    if (adminAction) {
      ticket.adminAction = adminAction;
    }

    // Save snapshot of restriction on ticket itself
    if (unbanRestriction) {
      ticket.closingUnbanRestriction = {
        canOpen: unbanRestriction.canOpen !== undefined ? unbanRestriction.canOpen : true,
        blockedUntil: unbanRestriction.blockedUntil || null,
        adminRemarks: unbanRestriction.adminRemarks || ''
      };

      // Also apply to target user's profile
      const targetUserId = ticket.userId || ticket.customerId;
      if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (targetUser) {
          targetUser.unbanRestriction = {
            canOpen: unbanRestriction.canOpen !== undefined ? unbanRestriction.canOpen : true,
            blockedUntil: unbanRestriction.blockedUntil || null,
            adminRemarks: unbanRestriction.adminRemarks || ''
          };
          await targetUser.save();
        }
      }
    }

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction');

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
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction');
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
      .populate('userId', 'name email role status blockReason unbanRestriction')
      .populate('customerId', 'name email role status blockReason unbanRestriction');
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
