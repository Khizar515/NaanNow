const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { auth, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/restaurants
// @desc    Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/restaurants/manager/me
// @desc    Get restaurant for logged in manager
router.get('/manager/me', auth, restrictTo('manager'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ managerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this manager' });
    }
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/restaurants
// @desc    Create or Update a restaurant (Manager)
router.post('/', auth, restrictTo('manager', 'admin'), async (req, res) => {
  try {
    const { name, cuisine, rating, deliveryTime, deliveryFee, image, logo, address, city, phone, email, isSuper, deal, menu } = req.body;
    
    // Check if manager already has a restaurant
    let restaurant = await Restaurant.findOne({ managerId: req.user._id });
    
    if (restaurant) {
      // Update
      if (name) restaurant.name = name;
      if (cuisine) restaurant.cuisine = cuisine;
      if (rating) restaurant.rating = rating;
      if (deliveryTime) restaurant.deliveryTime = deliveryTime;
      if (deliveryFee) restaurant.deliveryFee = deliveryFee;
      if (image) restaurant.image = image;
      if (logo) restaurant.logo = logo;
      if (address) restaurant.address = address;
      if (city) restaurant.city = city;
      if (phone) restaurant.phone = phone;
      if (email) restaurant.email = email;
      if (isSuper !== undefined) restaurant.isSuper = isSuper;
      if (deal) restaurant.deal = deal;
      if (menu) restaurant.menu = menu;
      
      await restaurant.save();
      return res.json(restaurant);
    }

    // Create
    restaurant = new Restaurant({
      name, cuisine, rating: rating || 0, deliveryTime, deliveryFee, image, logo, address, city, phone, email, isSuper: isSuper || false, deal, menu,
      managerId: req.user._id
    });

    await restaurant.save();
    res.json(restaurant);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/restaurants/:id/menu
// @desc    Add a menu item
router.post('/:id/menu', auth, restrictTo('manager'), upload.single('image'), async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (restaurant.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, price, description, category, image } = req.body;
    let imageUrl = image;

    if (req.file) {
      imageUrl = `http://localhost:5000/${req.file.path.replace(/\\/g, '/')}`;
    }

    const newItem = { name, price, description, category, image: imageUrl };
    restaurant.menu.push(newItem);
    await restaurant.save();
    
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/restaurants/:id/menu/:itemId
// @desc    Update a menu item
router.put('/:id/menu/:itemId', auth, restrictTo('manager'), upload.single('image'), async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (restaurant.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, price, description, category, image } = req.body;
    let imageUrl = image;

    if (req.file) {
      imageUrl = `http://localhost:5000/${req.file.path.replace(/\\/g, '/')}`;
    }

    const itemIndex = restaurant.menu.findIndex(i => i._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: 'Menu item not found' });

    if (name) restaurant.menu[itemIndex].name = name;
    if (price) restaurant.menu[itemIndex].price = price;
    if (description) restaurant.menu[itemIndex].description = description;
    if (category) restaurant.menu[itemIndex].category = category;
    if (imageUrl) restaurant.menu[itemIndex].image = imageUrl;

    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/restaurants/:id/menu/:itemId
// @desc    Delete a menu item
router.delete('/:id/menu/:itemId', auth, restrictTo('manager'), async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (restaurant.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    restaurant.menu = restaurant.menu.filter(i => i._id.toString() !== req.params.itemId);
    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
