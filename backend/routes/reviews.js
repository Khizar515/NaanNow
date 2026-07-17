const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { auth, restrictTo } = require('../middleware/auth');

// @route   GET /api/reviews/order/:orderId
// @desc    Get reviews for an order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ orderId: req.params.orderId });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/reviews
// @desc    Add a review for an order product
router.post('/', auth, restrictTo('customer'), async (req, res) => {
  try {
    const { orderId, productName, rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to customer
    if (order.customerId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Verify order status is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered items' });
    }

    // Check if the product was actually in the order
    const hasProduct = order.items.some(item => item.name === productName);
    if (!hasProduct) {
       return res.status(400).json({ message: 'Product not found in this order' });
    }

    // Check 24-hour window
    // `updatedAt` on the Order is updated when status changes to 'delivered'
    const deliveryTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursPassed = (currentTime - deliveryTime) / (1000 * 60 * 60);

    if (hoursPassed > 24) {
      return res.status(400).json({ message: 'Review window expired (24 hours after delivery)' });
    }

    const review = new Review({
      orderId,
      productName,
      customerId: req.user.id,
      rating,
      comment
    });

    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
        return res.status(400).json({ message: 'You have already reviewed this product for this order.' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
