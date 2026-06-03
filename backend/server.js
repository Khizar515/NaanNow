require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const console = require('console');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore || require('connect-mongo').default || require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const engine = require('ejs-mate');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database:27017/Naan_Now';

// ========================
// VIEW ENGINE SETUP (EJS)
// ========================
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========================
// STATIC FILES
// ========================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================
// BODY PARSING
// ========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// METHOD OVERRIDE (PUT/DELETE from forms)
// ========================
app.use(methodOverride('_method'));

// ========================
// SESSION MANAGEMENT
// ========================
app.use(session({
    secret: process.env.JWT_SECRET || 'naannow-session-secret-dev',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60 // 7 days (matches JWT expiry)
    }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// ========================
// FLASH MESSAGES
// ========================
app.use(flash());

// ========================
// GLOBAL TEMPLATE VARIABLES
// ========================
app.use((req, res, next) => {
    // Make session user and flash messages available in ALL EJS templates
    res.locals.currentUser = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.info_msg = req.flash('info_msg');
    next();
});

// ========================
// ROUTES
// ========================
app.use('/auth', require('./routes/auth'));
app.use('/wallet', require('./routes/wallet'));
app.use('/restaurants', require('./routes/restaurant'));
app.use('/menu', require('./routes/menu'));
app.use('/orders', require('./routes/order'));
app.use('/admin', require('./routes/admin'));
app.use('/riders', require('./routes/rider'));
app.use('/users', require('./routes/user'));
app.use('/cart', require('./routes/cart'));

// Homepage route — show open restaurants
const Restaurant = require('./models/Restaurant');
app.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isApproved: true, isOpen: true })
            .select('-verificationDocuments');
        res.render('home/index', { title: 'Home', restaurants });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading restaurants.');
        res.render('home/index', { title: 'Home', restaurants: [] });
    }
});

// ========================
// SOCKET.IO SETUP
// ========================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    socket.on('join_room', (orderId) => {
        socket.join(orderId);
        console.log(`👤 User joined Order Room: ${orderId}`);
    });

    // EVENT 2: CHAT MESSAGE
    socket.on('send_message', async (data) => {
        // data = { orderId, senderId, senderName, text }
        try {
            const ChatSession = require('./models/ChatSession');
            const session = await ChatSession.findOne({ orderId: data.orderId });
            if (session) {
                session.messages.push({
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: new Date()
                });
                await session.save();
            }
            // Sends the message to EVERYONE in the room EXCEPT the sender
            socket.to(data.orderId).emit('receive_message', data);
        } catch (error) {
            console.error('Chat save error:', error);
        }
    });

    // EVENT 3: LIVE GPS TRACKING
    socket.on('update_location', (data) => {
        // data = { orderId, coordinates: [lon, lat] }
        // The Rider spams this event, and the Customer listens for 'location_updated'
        socket.to(data.orderId).emit('location_updated', data.coordinates);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
    res.status(404).render('home/index', {
        title: '404 — Not Found',
        restaurants: []
    });
});

// ========================
// DATABASE CONNECTION
// ========================
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ========================
// START SERVER
// ========================
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSockets enabled on port ${PORT}`);
    console.log(`📄 EJS View Engine active — serving HTML pages`);
});