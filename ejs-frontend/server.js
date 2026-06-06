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

// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom lightweight cookie parser middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name.trim();
    if (!name) return;
    const value = rest.join('=');
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  });
  req.cookies = cookies;

  req.currentUser = null;
  if (cookies.user) {
    try {
      req.currentUser = JSON.parse(cookies.user);
    } catch (e) {
      req.currentUser = null;
    }
  }
  
  res.locals.currentUser = req.currentUser;
  res.locals.userName = req.currentUser ? req.currentUser.name : null;
  res.locals.userRole = req.currentUser ? req.currentUser.role : null;
  next();
});

// Middleware to protect routes that require authentication
const requireAuth = (req, res, next) => {
  if (!req.currentUser) {
    return res.redirect('/login');
  }
  next();
};

// Mock data to match original React app
const TOP_RESTAURANTS = [
  {
    id: 1,
    name: "The Gourmet Pavilion",
    cuisine: "Continental • Burgers",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free Delivery",
    image: "/assets/gourmet.jpg",
    rawImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60",
    isSuper: true,
    deal: "20% OFF",
    menu: [
      { id: 101, name: "Gourmet Beef Burger", description: "Juicy prime beef patty, melted cheddar, lettuce, caramelized onions, house sauce on brioche bun.", price: 650, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60", category: "Burgers" },
      { id: 102, name: "Alfredo Pasta", description: "Fettuccine pasta in rich creamy parmesan alfredo sauce topped with grilled chicken breast.", price: 790, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=60", category: "Mains" },
      { id: 103, name: "Club Sandwich", description: "Classic triple-decker sandwich with chicken, egg, cheese, lettuce, tomato and signature spread.", price: 580, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60", category: "Snacks" },
      { id: 104, name: "Loaded Fries", description: "Crispy skin-on fries topped with cheese sauce, diced jalapenos, bacon bits and spring onion.", price: 390, image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=60", category: "Snacks" }
    ]
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
    deal: "Free Item on $15+",
    menu: [
      { id: 201, name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced marinated chicken, cooked in authentic dum style.", price: 450, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60", category: "Desi" },
      { id: 202, name: "Garlic Naan", description: "Soft, leavened clay oven bread brushed with garlic butter and fresh coriander.", price: 150, image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60", category: "Naan" },
      { id: 203, name: "Chicken Karahi", description: "Bone-in chicken cooked with fresh tomatoes, ginger, garlic, and special spices in a karahi.", price: 1250, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60", category: "Karahi" },
      { id: 204, name: "Beef Seekh Kebab", description: "Minced beef blended with fresh herbs and spices, grilled to perfection on skewers.", price: 620, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60", category: "BBQ" }
    ]
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
    deal: null,
    menu: [
      { id: 301, name: "Caramel Macchiato", description: "Freshly steamed milk with vanilla-flavored syrup marked with espresso and caramel drizzle.", price: 480, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60", category: "Beverages" },
      { id: 302, name: "Chocolate Fudge Cake", description: "Rich, moist chocolate cake with layers of decadent chocolate fudge icing.", price: 350, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60", category: "Bakery" },
      { id: 303, name: "Cinnamon Roll", description: "Warm, soft dough roll filled with sweet cinnamon sugar and topped with cream cheese glaze.", price: 280, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60", category: "Bakery" },
      { id: 304, name: "Flat White", description: "Espresso with microfoam poured over it, yielding a silky texture and strong coffee taste.", price: 420, image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=60", category: "Beverages" }
    ]
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
    deal: "10% OFF",
    menu: [
      { id: 401, name: "Kung Pao Chicken", description: "Szechuan-style chicken stir-fry with peanuts, chili peppers and vegetables in sweet-savory sauce.", price: 850, image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60", category: "Chinese" },
      { id: 402, name: "Chicken Chow Mein", description: "Stir-fried noodles with shredded chicken, cabbage, carrots, onion and seasoned soy sauce.", price: 720, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60", category: "Chinese" },
      { id: 403, name: "Spring Rolls (4 Pcs)", description: "Crispy rolls filled with seasoned mixed vegetables and transparent glass noodles.", price: 250, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60", category: "Chinese" },
      { id: 404, name: "Egg Fried Rice", description: "Fluffy jasmine rice wok-tossed with scrambled eggs, scallions and soy seasoning.", price: 450, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60", category: "Chinese" }
    ]
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
    deal: "15% OFF",
    menu: [
      { id: 501, name: "Zinger Burger", description: "Signature crispy fried chicken fillet topped with spicy mayo and fresh lettuce in sesame bun.", price: 550, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60", category: "Burgers" },
      { id: 502, name: "Krunch Burger", description: "Crispy chicken patty with classic burger sauce and shredded lettuce.", price: 320, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60", category: "Burgers" },
      { id: 503, name: "Hot Shots (9 Pcs)", description: "Bite-sized chicken nuggets, coated in a spicy, crunchy batter and deep-fried.", price: 490, image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=60", category: "Snacks" },
      { id: 504, name: "Dinner Roll", description: "Soft, fresh, oven-baked roll - perfect side companion.", price: 80, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60", category: "Snacks" }
    ]
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
    deal: "10% OFF",
    menu: [
      { id: 601, name: "McSpicy Burger", description: "Spicy chicken breast fillet, crispy lettuce and creamy mayonnaise on toasted sesame seed bun.", price: 620, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60", category: "Burgers" },
      { id: 602, name: "Big Mac", description: "Two 100% pure beef patties, special sauce, lettuce, cheese, pickles, onions on sesame bun.", price: 750, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60", category: "Burgers" },
      { id: 603, name: "Large Fries", description: "World-famous french fries, hot, crispy, salted and golden.", price: 350, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60", category: "Snacks" },
      { id: 604, name: "Apple Pie", description: "Turnover pie with a warm apple filling in a flaky, crispy golden crust.", price: 250, image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=500&auto=format&fit=crop&q=60", category: "Desserts" }
    ]
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
    userName: req.currentUser ? req.currentUser.name : null,
    page: 'home'
  });
});

app.get('/favorites', (req, res) => {
  res.render('favorites', {
    restaurants: TOP_RESTAURANTS,
    cuisines: CUISINES,
    categories: ALL_CATEGORIES,
    userName: req.currentUser ? req.currentUser.name : null,
    page: 'favorites'
  });
});

app.get('/login', (req, res) => {
  if (req.currentUser) {
    return res.redirect('/');
  }
  res.render('login', { page: 'login' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Demonstration: simulate search or user creation based on email
  const namePart = email.split('@')[0];
  const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const user = { name, email, role: 'user' };

  res.cookie('user', JSON.stringify(user), { maxAge: 86400000, path: '/' });
  res.json({ success: true, redirect: '/' });
});

app.get('/register', (req, res) => {
  if (req.currentUser) {
    return res.redirect('/');
  }
  res.render('register', { page: 'register' });
});

app.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const user = { name, email, role };

  res.cookie('user', JSON.stringify(user), { maxAge: 86400000, path: '/' });
  res.json({ success: true, redirect: '/' });
});

app.get('/logout', (req, res) => {
  res.clearCookie('user', { path: '/' });
  res.redirect('/');
});

app.get('/profile', requireAuth, (req, res) => {
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
    userName: req.currentUser.name,
    userEmail: req.currentUser.email,
    userPhone: "+92 300 1234567",
    userMemberSince: "October 2024",
    userAddress: "House 45, Street 11, F-11/1, Islamabad",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    orders: mockOrders,
    page: 'profile'
  });
});

app.get('/restaurant/:id', (req, res) => {
  const restaurantId = parseInt(req.params.id);
  const restaurant = TOP_RESTAURANTS.find(r => r.id === restaurantId);
  if (!restaurant) {
    return res.redirect('/');
  }
  res.render('restaurant', {
    restaurant,
    userName: req.currentUser ? req.currentUser.name : null,
    page: 'restaurant'
  });
});

app.get('/checkout', requireAuth, (req, res) => {
  res.render('checkout', {
    userName: req.currentUser.name,
    page: 'checkout'
  });
});

app.get('/orders', requireAuth, (req, res) => {
  res.render('orders', {
    userName: req.currentUser.name,
    page: 'orders'
  });
});

app.get('/track-order/:orderId', requireAuth, (req, res) => {
  res.render('track-order', {
    userName: req.currentUser.name,
    orderId: req.params.orderId,
    page: 'track-order'
  });
});

app.get('/rider', (req, res) => {
  res.render('rider/dashboard', {
    userName: req.currentUser ? req.currentUser.name : null,
    page: 'rider'
  });
});

app.get('/rider/deliver/:orderId', (req, res) => {
  res.render('rider/deliver', {
    orderId: req.params.orderId,
    userName: req.currentUser ? req.currentUser.name : null,
    page: 'rider'
  });
});

app.get('/manager', requireAuth, (req, res) => {
  res.redirect('/manager/dashboard');
});

app.get('/manager/setup', requireAuth, (req, res) => {
  res.render('manager/setup', {
    userName: req.currentUser.name,
    page: 'manager-setup'
  });
});

app.get('/manager/dashboard', requireAuth, (req, res) => {
  res.render('manager/dashboard', {
    userName: req.currentUser.name,
    page: 'manager-dashboard'
  });
});

app.get('/manager/menu', requireAuth, (req, res) => {
  res.render('manager/menu', {
    userName: req.currentUser.name,
    page: 'manager-menu'
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

  socket.on('update_status', (data) => {
    // Broadcast status updates to everyone in the room
    io.to(data.orderId).emit('status_updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
