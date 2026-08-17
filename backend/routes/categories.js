const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, restrictTo } = require('../middleware/auth');

// Default initial categories
const DEFAULT_CATEGORIES = [
  { name: 'Naan', icon: '🫓' },
  { name: 'Breads', icon: '🍞' },
  { name: 'Burgers', icon: '🍔' },
  { name: 'BBQ', icon: '🍢' },
  { name: 'Curries', icon: '🍲' },
  { name: 'Rice', icon: '🍚' },
  { name: 'Pasta', icon: '🍝' },
  { name: 'Beverages', icon: '🥤' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Starters', icon: '🥗' }
];

// Helper to seed categories if empty
const seedCategoriesIfEmpty = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
  }
};

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', async (req, res) => {
  try {
    await seedCategoriesIfEmpty();
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/categories
// @desc    Add a category (Admin only)
router.post('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    let category = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (category) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    category = new Category({
      name: name.trim(),
      icon: icon || '🍽️'
    });

    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category (Admin only)
router.put('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    let category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin only)
router.delete('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
