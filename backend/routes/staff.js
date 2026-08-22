const express = require('express');
const router = express.Router();
const StaffRole = require('../models/StaffRole');
const StaffAssignment = require('../models/StaffAssignment');
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');

// Special reserved role marker to ensure seed runs only ONCE ever (never re-seeds after admin deletes roles)
const SEED_MARKER = '__seeded__';

const seedStaffRolesOnce = async () => {
  const alreadySeeded = await StaffRole.findOne({ name: SEED_MARKER });
  if (alreadySeeded) return; // Seed has already run in history

  await StaffRole.insertMany([
    { name: SEED_MARKER, description: 'Internal seed tracking marker', permissions: [] },
    {
      name: 'Customer Support Specialist',
      description: 'Handles support tickets, unban appeals, and customer inquiries.',
      permissions: ['dashboard', 'support', 'customers']
    }
  ]);
};

// @route   GET /api/staff/me
// @desc    Get current user's active staff role & permissions
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        isAdmin: true,
        roleName: 'System Administrator',
        permissions: [
          'dashboard', 'orders', 'restaurants', 'riders', 'customers',
          'verification', 'menu_categories', 'payments', 'promotions',
          'analytics', 'support', 'notifications', 'staff', 'settings'
        ]
      });
    }

    const activeAssignment = await StaffAssignment.findOne({
      userId: req.user._id,
      revokedAt: null
    }).populate('roleId');

    if (!activeAssignment || !activeAssignment.roleId) {
      return res.json({
        isAdmin: false,
        isStaff: false,
        roleName: null,
        permissions: []
      });
    }

    res.json({
      isAdmin: false,
      isStaff: true,
      roleName: activeAssignment.roleId.name,
      permissions: activeAssignment.roleId.permissions || []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/staff/roles
// @desc    Get all staff roles (Admin or Staff)
router.get('/roles', auth, async (req, res) => {
  try {
    await seedStaffRolesOnce();
    const roles = await StaffRole.find({ name: { $ne: SEED_MARKER } }).sort({ createdAt: -1 });
    res.json(roles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/staff/roles
// @desc    Create new staff role (Admin only)
router.post('/roles', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const existing = await StaffRole.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'A staff role with this name already exists' });
    }

    const role = new StaffRole({
      name: name.trim(),
      description: description ? description.trim() : '',
      permissions: Array.isArray(permissions) ? permissions : [],
      createdBy: req.user.name || 'Admin'
    });

    await role.save();
    res.status(201).json(role);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/staff/roles/:id
// @desc    Update staff role (Admin only)
router.put('/roles/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await StaffRole.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    if (name) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();
    res.json(role);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/staff/roles/:id
// @desc    Delete staff role (Admin only)
router.delete('/roles/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const role = await StaffRole.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // Check if any active staff member is assigned to this role
    const activeCount = await StaffAssignment.countDocuments({
      roleId: role._id,
      revokedAt: null
    });

    if (activeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete role. There are ${activeCount} active staff member(s) currently assigned to this role. Revoke or reassign them first.`
      });
    }

    // Back up role name snapshot on all historical assignments before deleting role document
    await StaffAssignment.updateMany(
      { roleId: role._id },
      { $set: { roleName: role.name } }
    );

    await role.deleteOne();
    res.json({ message: 'Staff role deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/staff/members
// @desc    Get all active staff members (Admin or Staff)
router.get('/members', auth, async (req, res) => {
  try {
    const activeAssignments = await StaffAssignment.find({ revokedAt: null })
      .populate('userId', 'name email role phone status profilePic')
      .populate('roleId', 'name description permissions')
      .sort('-assignedAt');

    res.json(activeAssignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/staff/members
// @desc    Assign staff role to user (Admin only)
router.post('/members', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { userId, roleId, notes } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ message: 'userId and roleId are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const role = await StaffRole.findById(roleId);
    if (!role) return res.status(404).json({ message: 'Staff role not found' });

    // Revoke any existing active assignment for this user
    await StaffAssignment.updateMany(
      { userId, revokedAt: null },
      {
        $set: {
          revokedAt: new Date(),
          revokedBy: req.user.name || 'Admin',
          notes: 'Reassigned to a new staff role'
        }
      }
    );

    // Create new assignment
    const assignment = new StaffAssignment({
      userId,
      roleId,
      roleName: role.name,
      assignedBy: req.user.name || 'Admin',
      notes: notes ? notes.trim() : ''
    });

    await assignment.save();

    const populated = await StaffAssignment.findById(assignment._id)
      .populate('userId', 'name email role phone status profilePic')
      .populate('roleId', 'name description permissions');

    res.status(201).json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/staff/members/:userId
// @desc    Revoke staff role from user (Demote to customer/user) (Admin only)
router.delete('/members/:userId', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const activeAssignments = await StaffAssignment.find({ userId, revokedAt: null });

    if (activeAssignments.length === 0) {
      return res.status(404).json({ message: 'No active staff assignment found for this user' });
    }

    await StaffAssignment.updateMany(
      { userId, revokedAt: null },
      {
        $set: {
          revokedAt: new Date(),
          revokedBy: req.user.name || 'Admin',
          notes: 'Staff role revoked by Admin'
        }
      }
    );

    res.json({ message: 'Staff role revoked successfully. User demoted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/staff/history
// @desc    Get full staff assignment history (Admin only)
router.get('/history', auth, restrictTo('admin'), async (req, res) => {
  try {
    const history = await StaffAssignment.find()
      .populate('userId', 'name email role')
      .populate('roleId', 'name')
      .sort('-createdAt');

    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
