const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mock data to match original React app
const TOP_RESTAURANTS = [
  {
    id: 1,
    name: "The Gourmet Pavilion",
    cuisine: "Continental • Burgers",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free Delivery",
    image: "/assets/gourmet.jpg", // We will use generic but premium Unsplash images in client or direct links
    rawImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60",
    isSuper: true,
    deal: "20% OFF"
  },
  {
    id: 2,
    name: "Tandoori Flames",
    cuisine: "Biryani • BBQ • Desi",
    rating: 4.6,
    deliveryTime: "30-45 min",
    deliveryFee: "$1.50 Delivery",
    rawImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
    isSuper: false,
    deal: "Free Item on $15+"
  },
  {
    id: 3,
    name: "Caffeine & Co.",
    cuisine: "Beverages • Cakes & Bakery",
    rating: 4.9,
    deliveryTime: "15-25 min",
    deliveryFee: "Free Delivery",
    rawImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60",
    isSuper: true,
    deal: null
  },
  {
    id: 4,
    name: "Wok in the Park",
    cuisine: "Chinese • Noodles",
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    rawImage: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60",
    isSuper: false,
    deal: "10% OFF"
  },
  {
    id: 5,
    name: "KFC",
    cuisine: "Fast Food • Burgers",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    rawImage: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isSuper: true,
    deal: "15% OFF"
  },
  {
    id: 6,
    name: "McDonald's - Islamabad",
    cuisine: "Fast Food • Burgers",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    rawImage: "https://images.unsplash.com/photo-1619881589670-43629f0e90f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1jZG9uYWxkfGVufDB8fDB8fHww",
    isSuper: true,
    deal: "10% OFF"
  }
];

const CUISINES = [
  {
    name: 'All',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Desi',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'BBQ',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Bakery',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Chinese',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=60'
  }
];

const ALL_CATEGORIES = [
  'Desi', 'Naan', 'Karahi', 'Fast Food',
  'BBQ', 'Pizza', 'Burgers', 'Chinese',
  'Desserts', 'Healthy', 'Biryani', 'Rolls',
  'Salads', 'Seafood', 'Pasta'
];

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    restaurants: TOP_RESTAURANTS,
    cuisines: CUISINES,
    categories: ALL_CATEGORIES,
    userName: "Muhammad Saad",
    page: 'home'
  });
});

app.get('/favorites', (req, res) => {
  res.render('favorites', {
    restaurants: TOP_RESTAURANTS,
    cuisines: CUISINES,
    categories: ALL_CATEGORIES,
    userName: "Muhammad Saad",
    page: 'favorites'
  });
});

app.get('/profile', (req, res) => {
  const mockOrders = [
    {
      id: "NN-4921",
      date: "02 Jun 2026",
      status: "Delivered",
      items: "2x Garlic Naan, 1x Chicken Karahi",
      total: 1350
    },
    {
      id: "NN-3819",
      date: "28 May 2026",
      status: "Delivered",
      items: "3x Roghni Naan, 1x Beef Seekh Kebab",
      total: 980
    },
    {
      id: "NN-1290",
      date: "15 May 2026",
      status: "Cancelled",
      items: "1x Nutella Naan",
      total: 280
    }
  ];

  res.render('profile', {
    userName: "Muhammad Saad",
    userEmail: "saad@example.com",
    userPhone: "+92 300 1234567",
    userMemberSince: "October 2024",
    userAddress: "House 45, Street 11, F-11/1, Islamabad",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    orders: mockOrders,
    page: 'profile'
  });
});

app.get('/checkout', (req, res) => {
  res.render('checkout', {
    userName: "Muhammad Saad",
    page: 'checkout'
  });
});

app.get('/orders', (req, res) => {
  res.render('orders', {
    userName: "Muhammad Saad",
    page: 'orders'
  });
});

app.get('/track-order/:orderId', (req, res) => {
  res.render('track-order', {
    userName: "Muhammad Saad",
    orderId: req.params.orderId,
    page: 'track-order'
  });
});

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`⚡ User connected to ejs-frontend Socket: ${socket.id}`);

  socket.on('join_room', (orderId) => {
    socket.join(orderId);
    console.log(`👤 User joined Order Room: ${orderId}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast received message to everyone in the room
    io.to(data.orderId).emit('receive_message', data);
  });

  socket.on('update_location', (data) => {
    // Broadcast rider coordinates to everyone in the room
    io.to(data.orderId).emit('location_updated', data.coordinates);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
