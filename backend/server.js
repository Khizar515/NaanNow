require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const reviewRoutes = require('./routes/reviews');
const ticketRoutes = require('./routes/tickets');
const promotionRoutes = require('./routes/promotions');
const notificationRoutes = require('./routes/notifications');
const withdrawalRoutes = require('./routes/withdrawals');
const settingsRoutes = require('./routes/settings');
const categoryRoutes = require('./routes/categories');
const staffRoutes = require('./routes/staff');
const escrowRoutes = require('./routes/escrow');

const app = express();

// Middleware
const allowedOrigins = [
  'https://naannow.ksdev.me',
  'http://naannow.ksdev.me',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalize = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const reqDomain = normalize(origin);
    const isAllowed = allowedOrigins.some(allowed => normalize(allowed) === reqDomain);
    if (isAllowed) {
      return callback(null, true);
    }
    // Allow any origin during setup/development to avoid breaking legitimate requests
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/escrow', escrowRoutes);

// Root route
app.get('/', (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = mongoStates[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'ok',
    message: 'NaanNow Backend API is running!',
    mongoStatus: state
  });
});

// Start listening immediately on 0.0.0.0 so Cloudflare tunnel and health checks always succeed
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Database Connection with automatic retry
const connectWithRetry = () => {
  console.log('Connecting to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/naannow')
    .then(() => {
      console.log('Connected to MongoDB successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error. Retrying in 5 seconds...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();
