require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // <-- NEW: Native Node module
const { Server } = require('socket.io'); // <-- NEW: Socket.io
const console = require('console');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database:27017/Naan_Now';

// Middleware
app.use(cors());
app.use(express.json());

// --- ADD YOUR ROUTES HERE ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/restaurants', require('./routes/restaurant'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/order'));
// ----------------------------

// 1. Create the raw HTTP server
const server = http.createServer(app);

// 2. Attach Socket.io to that server
const io = new Server(server, {
    cors: {
        origin: "*", // In production, replace this with your React app's URL
        methods: ["GET", "POST"]
    }
});

// 3. Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    // Listen for users joining a specific order room
    socket.on('join_order_room', (orderId) => {
        socket.join(orderId);
        console.log(`User joined room for order: ${orderId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

// Basic Test Route
app.get('/', (req, res) => {
    res.send('NaanNow API is running with Socket.io!');
});

// Database Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 4. CRITICAL: Start 'server', NOT 'app'
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});