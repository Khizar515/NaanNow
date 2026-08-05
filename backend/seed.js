require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Order = require('./models/Order');
const Ticket = require('./models/Ticket');
const Promotion = require('./models/Promotion');
const Notification = require('./models/Notification');
const Withdrawal = require('./models/Withdrawal');
const PlatformSettings = require('./models/PlatformSettings');
const Card = require('./models/Card');
const Review = require('./models/Review');

const fs = require('fs');
const path = require('path');

const DEMO_USERS = [
  { name: "Ali Khan", email: "ali@rider.com", password: "password123", role: "rider", vehicleDetails: "Honda CD70", licensePlate: "ICT-1024", status: "pending", rating: 4.8 },
  { name: "Hamza Ahmed", email: "hamza@rider.com", password: "password123", role: "rider", vehicleDetails: "Suzuki GS150", licensePlate: "LHR-9921", status: "approved", rating: 4.9 },
  { name: "Bilal Butt", email: "bilal@rider.com", password: "password123", role: "rider", vehicleDetails: "Yamaha YBR", licensePlate: "RWP-5512", status: "blocked", rating: 3.5 },
  { name: "Sana Rizvi", email: "sana@manager.com", password: "password123", role: "manager", restaurantName: "Tandoori Flames (F-10)", status: "unverified", rating: 4.7 },
  { name: "Zainab Malik", email: "zainab@manager.com", password: "password123", role: "manager", restaurantName: "Khyber Shinwari (F-7)", status: "approved", rating: 4.9 },
  { name: "Usman Shah", email: "usman@manager.com", password: "password123", role: "manager", restaurantName: "KFC (F-10)", status: "blocked", rating: 4.2 },
  { name: "Muhammad Saad", email: "saad@naannow.com", password: "password123", role: "customer", status: "approved", walletBalance: 1500, address: "F-7 Markaz, Islamabad" },
  { name: "Admin", email: "admin@naannow.com", password: "admin", role: "admin", status: "approved" }
];

const TOP_RESTAURANTS = [
  {
    name: "The Gourmet Pavilion",
    cuisine: "Continental • Burgers",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free Delivery",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: "20% OFF",
    menu: [
      { name: "Truffle Mushroom Burger", price: 650, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80", description: "Juicy beef patty with wild sautéed mushrooms, truffle aioli, and melted Swiss cheese.", category: "Burgers" },
      { name: "Fettuccine Alfredo", price: 720, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80", description: "Rich, creamy white Alfredo sauce pasta tossed with grilled chicken strips.", category: "Pasta" }
    ]
  },
  {
    name: "Tandoori Flames",
    cuisine: "Biryani • BBQ • Desi",
    rating: 4.6,
    deliveryTime: "30-45 min",
    deliveryFee: "$1.50 Delivery",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1000&auto=format&fit=crop&q=80",
    isSuper: false,
    deal: "Free Item on $15+",
    menu: [
      { name: "Special Chicken Biryani", price: 420, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80", description: "Aromatic premium basmati rice cooked with layered spices.", category: "Rice" },
      { name: "Reshmi Kabab (4 Pcs)", price: 490, image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80", description: "Melt-in-your-mouth minced chicken kababs.", category: "BBQ" }
    ]
  },
  {
    name: "Caffeine & Co.",
    cuisine: "Beverages • Cakes & Bakery",
    rating: 4.9,
    deliveryTime: "15-25 min",
    deliveryFee: "Free Delivery",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: null,
    menu: [
      { name: "Iced Spanish Latte", price: 380, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80", description: "Double shot of espresso combined with cold milk.", category: "Coffee" },
      { name: "Chocolate Fudge Slice", price: 320, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80", description: "Delectable and super-moist layered chocolate cake.", category: "Bakery" }
    ]
  },
  {
    name: "Wok in the Park",
    cuisine: "Chinese • Noodles",
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1000&auto=format&fit=crop&q=80",
    isSuper: false,
    deal: "10% OFF",
    menu: [
      { name: "Kung Pao Chicken", price: 680, image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=80", description: "Stir-fried chicken cubes with peanuts.", category: "Main Course" },
      { name: "Dynamite Prawns (6 Pcs)", price: 780, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80", description: "Crispy fried prawns tossed in dynamite sauce.", category: "Starters" }
    ]
  },
  {
    name: "KFC",
    cuisine: "Fast Food • Burgers",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=1167&auto=format&fit=crop",
    isSuper: true,
    deal: "15% OFF",
    menu: [
      { name: "Zinger Burger", price: 540, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80", description: "Double breaded crispy chicken breast fillet.", category: "Burgers" },
      { name: "Hot Wings (10 Pcs)", price: 490, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80", description: "Tender chicken wings coated in a fiery crunchy coating.", category: "Sides" }
    ]
  },
  {
    name: "McDonald's - Islamabad",
    cuisine: "Fast Food • Burgers",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1619881589670-43629f0e90f1?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: "10% OFF",
    menu: [
      { name: "McSpicy Chicken Burger", price: 580, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80", description: "Perfectly seasoned crispy chicken breast fillet.", category: "Burgers" },
      { name: "McFlurry Oreo", price: 340, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80", description: "Smooth vanilla soft serve ice cream.", category: "Desserts" }
    ]
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/naannow')
  .then(async () => {
    console.log('Connected to MongoDB. Checking for data to seed...');

    // Ensure upload dirs exist
    const dirs = ['profiles', 'documents', 'menu', 'misc'];
    dirs.forEach(d => {
      const p = path.join(__dirname, 'uploads', d);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });

    // 1. Seed Users (Only if they don't exist)
    for (let u of DEMO_USERS) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        u.password = await bcrypt.hash(u.password, salt);
        await User.create(u);
      }
    }
    console.log('User seeding check complete.');

    // Find key users for relationships
    const manager = await User.findOne({ role: 'manager', name: 'Zainab Malik' });
    const customer = await User.findOne({ role: 'customer' });
    const rider = await User.findOne({ role: 'rider', name: 'Hamza Ahmed' });

    // 2. Seed Restaurants (Only if they don't exist)
    for (let [index, r] of TOP_RESTAURANTS.entries()) {
      const existingRestaurant = await Restaurant.findOne({ name: r.name });
      if (!existingRestaurant) {
        await Restaurant.create({
          ...r,
          managerId: index === 1 && manager ? manager._id : null,
          status: 'approved'
        });
      }
    }
    console.log('Restaurant seeding check complete.');

    // 3. Seed Platform Settings (Only if empty)
    const settingsCount = await PlatformSettings.countDocuments();
    if (settingsCount === 0) {
      await PlatformSettings.create({
        commission: 15,
        deliveryCharges: 150,
        taxes: 5,
        maintenanceMode: false
      });
      console.log('Platform Settings seeded.');
    }

    // 4. Seed Promotions (Only if they don't exist)
    const promos = [
      { code: 'NAANNOW20', discount: 20, type: 'percentage', minBasket: 500, maxDiscount: 500 },
      { code: 'FREEDEL', discount: 150, type: 'flat', minBasket: 1000 }
    ];
    for (let p of promos) {
      const existingPromo = await Promotion.findOne({ code: p.code });
      if (!existingPromo) await Promotion.create(p);
    }
    console.log('Promotions seeding check complete.');

    // Fetch restaurants for orders
    const tandooriFlames = await Restaurant.findOne({ name: "Tandoori Flames" });
    const gourmetPavilion = await Restaurant.findOne({ name: "The Gourmet Pavilion" });

    // 5. Seed Tickets, Cards, and Orders ONLY if customer exists and has no existing orders/tickets
    if (customer) {
      const ticketCount = await Ticket.countDocuments({ customerId: customer._id });
      if (ticketCount === 0) {
        await Ticket.create({
          ticketNumber: 'TK-101',
          customerId: customer._id,
          subject: 'Order delayed',
          status: 'in_progress',
          chat: [
            { sender: 'customer', text: 'My order is 30 mins late.' },
            { sender: 'support', text: 'We apologize. The rider is stuck in traffic.' }
          ]
        });
        console.log('Demo ticket created.');
      }

      const cardCount = await Card.countDocuments({ userId: customer._id });
      if (cardCount === 0) {
        await Card.create({
          userId: customer._id,
          cardNumber: '4242424242424242',
          expiryDate: '12/25',
          cvv: '123',
          balance: 5000,
          status: 'active'
        });
        console.log('Demo card created.');
      }

      const orderCount = await Order.countDocuments({ customerId: customer._id });
      if (orderCount === 0 && tandooriFlames && gourmetPavilion) {
        await Order.create({
          orderNumber: 'ORD-1001',
          customerId: customer._id,
          restaurantId: tandooriFlames._id,
          items: [{ name: 'Special Chicken Biryani', price: 420, quantity: 2 }],
          totalAmount: 990,
          status: 'pending',
          deliveryAddress: 'F-7 Markaz, Islamabad',
          name: customer.name,
          phone: '03001234567'
        });

        await Order.create({
          orderNumber: 'ORD-1002',
          customerId: customer._id,
          restaurantId: gourmetPavilion._id,
          riderId: rider ? rider._id : null,
          items: [{ name: 'Truffle Mushroom Burger', price: 650, quantity: 1 }],
          totalAmount: 800,
          status: 'out_for_delivery',
          deliveryAddress: 'F-8 Markaz, Islamabad',
          name: customer.name,
          phone: '03001234567'
        });
        console.log('Demo orders created.');
      }
    }

    console.log('Seeding process finished safely!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });