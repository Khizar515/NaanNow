export const TOP_RESTAURANTS = [
  {
    id: 1,
    name: "The Gourmet Pavilion",
    cuisine: "Continental • Burgers",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free Delivery",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: "20% OFF",
    menu: [
      {
        id: 101,
        name: "Truffle Mushroom Burger",
        price: 650,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        description: "Juicy beef patty with wild sautéed mushrooms, truffle aioli, and melted Swiss cheese on a toasted brioche bun.",
        category: "Burgers"
      },
      {
        id: 102,
        name: "Fettuccine Alfredo",
        price: 720,
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80",
        description: "Rich, creamy white Alfredo sauce pasta tossed with grilled chicken strips, fresh parsley, and parmesan cheese.",
        category: "Pasta"
      },
      {
        id: 103,
        name: "Gourmet Club Sandwich",
        price: 480,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80",
        description: "Classic triple-decker sandwich loaded with seasoned grilled chicken, boiled egg, cheddar cheese, crisp lettuce, and dynamic club mayo.",
        category: "Mains"
      },
      {
        id: 104,
        name: "Molten Lava Cake",
        price: 390,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
        description: "Warm chocolate cake with a gooey, decadent chocolate molten core. Served fresh.",
        category: "Desserts"
      },
      {
        id: 105,
        name: "Classic Mint Mojito",
        price: 260,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
        description: "A refreshing mocktail featuring fresh mint leaves, lime wedges, simple syrup, and sparkling soda over crushed ice.",
        category: "Beverages"
      }
    ]
  },
  {
    id: 2,
    name: "Tandoori Flames",
    cuisine: "Biryani • BBQ • Desi",
    rating: 4.6,
    deliveryTime: "30-45 min",
    deliveryFee: "$1.50 Delivery",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1000&auto=format&fit=crop&q=80",
    isSuper: false,
    deal: "Free Item on $15+",
    menu: [
      {
        id: 201,
        name: "Special Chicken Biryani",
        price: 420,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
        description: "Aromatic premium basmati rice cooked with layered spices, saffron, and tender marinated chicken.",
        category: "Rice"
      },
      {
        id: 202,
        name: "Reshmi Kabab (4 Pcs)",
        price: 490,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80",
        description: "Melt-in-your-mouth minced chicken kababs seasoned with white pepper, coriander, and fresh cream, then char-grilled.",
        category: "BBQ"
      },
      {
        id: 203,
        name: "Butter Garlic Naan",
        price: 150,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80",
        description: "Soft, leavened clay-oven flatbread brushed with hot garlic butter and coriander leaves.",
        category: "Breads"
      },
      {
        id: 204,
        name: "Chicken Karahi (Half)",
        price: 950,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80",
        description: "Spicy chicken stew prepared in a wok with tomatoes, ginger, garlic, and fresh green chilies.",
        category: "Curries"
      },
      {
        id: 205,
        name: "Desi Kheer",
        price: 220,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
        description: "Traditional slow-cooked rice pudding sweetened with condensed milk and garnished with almonds and pistachios.",
        category: "Desserts"
      }
    ]
  },
  {
    id: 3,
    name: "Caffeine & Co.",
    cuisine: "Beverages • Cakes & Bakery",
    rating: 4.9,
    deliveryTime: "15-25 min",
    deliveryFee: "Free Delivery",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: null,
    menu: [
      {
        id: 301,
        name: "Iced Spanish Latte",
        price: 380,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80",
        description: "Double shot of espresso combined with cold milk and sweet condensed milk, served over ice.",
        category: "Coffee"
      },
      {
        id: 302,
        name: "Caramel Macchiato",
        price: 420,
        image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=80",
        description: "Rich espresso combined with steamed milk and vanilla syrup, topped with caramel drizzle.",
        category: "Coffee"
      },
      {
        id: 303,
        name: "Chocolate Fudge Slice",
        price: 320,
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
        description: "Delectable and super-moist layered chocolate cake smothered in thick fudge frosting.",
        category: "Bakery"
      },
      {
        id: 304,
        name: "Warm Butter Croissant",
        price: 240,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80",
        description: "Crispy, flaky french style butter pastry, served warm.",
        category: "Bakery"
      }
    ]
  },
  {
    id: 4,
    name: "Wok in the Park",
    cuisine: "Chinese • Noodles",
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1000&auto=format&fit=crop&q=80",
    isSuper: false,
    deal: "10% OFF",
    menu: [
      {
        id: 401,
        name: "Kung Pao Chicken",
        price: 680,
        image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=80",
        description: "Stir-fried chicken cubes with peanuts, bell peppers, and scallions in a sweet, spicy, savory sauce.",
        category: "Main Course"
      },
      {
        id: 402,
        name: "Special Chicken Chow Mein",
        price: 590,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80",
        description: "Classic stir-fried egg noodles with seasoned chicken strips, cabbage, carrots, and special soy-garlic sauce.",
        category: "Noodles"
      },
      {
        id: 403,
        name: "Hot & Sour Soup",
        price: 290,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80",
        description: "Thick, warm, and spicy vinegar broth with shredded chicken, tofu cubes, mushrooms, and egg ribbons.",
        category: "Starters"
      },
      {
        id: 404,
        name: "Dynamite Prawns (6 Pcs)",
        price: 780,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80",
        description: "Crispy fried prawns tossed in a creamy, sweet, and spicy dynamite sauce.",
        category: "Starters"
      }
    ]
  },
  {
    id: 5,
    name: "KFC",
    cuisine: "Fast Food • Burgers",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=1167&auto=format&fit=crop",
    isSuper: true,
    deal: "15% OFF",
    menu: [
      {
        id: 501,
        name: "Zinger Burger",
        price: 540,
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80",
        description: "Double breaded crispy chicken breast fillet, topped with fresh lettuce and spicy mayonnaise inside a toasted sesame seed bun.",
        category: "Burgers"
      },
      {
        id: 502,
        name: "KFC Fried Chicken Bucket (9 Pcs)",
        price: 1850,
        image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=80",
        description: "Golden crispy fried chicken pieces using KFC's signature secret blend of 11 herbs and spices.",
        category: "Buckets"
      },
      {
        id: 503,
        name: "Hot Wings (10 Pcs)",
        price: 490,
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80",
        description: "Tender chicken wings coated in a fiery crunchy coating, fried to a golden crisp.",
        category: "Sides"
      },
      {
        id: 504,
        name: "French Fries (Large)",
        price: 240,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80",
        description: "Golden, crispy French fries salted to absolute perfection.",
        category: "Sides"
      }
    ]
  },
  {
    id: 6,
    name: "McDonald's - Islamabad",
    cuisine: "Fast Food • Burgers",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.00 Delivery",
    image: "https://images.unsplash.com/photo-1619881589670-43629f0e90f1?w=1000&auto=format&fit=crop&q=80",
    isSuper: true,
    deal: "10% OFF",
    menu: [
      {
        id: 601,
        name: "McSpicy Chicken Burger",
        price: 580,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        description: "Perfectly seasoned crispy chicken breast fillet with a kick of heat, topped with shredded lettuce and mayonnaise.",
        category: "Burgers"
      },
      {
        id: 602,
        name: "Big Mac Beef",
        price: 690,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        description: "Two 100% pure beef patties, special Big Mac sauce, lettuce, cheese, pickles, and onions in a three-part sesame seed bun.",
        category: "Burgers"
      },
      {
        id: 603,
        name: "McFlurry Oreo",
        price: 340,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
        description: "Smooth vanilla soft serve ice cream swirled with crushed chocolatey Oreo biscuit crumbs.",
        category: "Desserts"
      },
      {
        id: 604,
        name: "Happy Meal Chicken McNuggets (4 Pcs)",
        price: 450,
        image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=80",
        description: "Bite-sized, golden-brown chicken McNuggets, served with a toy and fries.",
        category: "Happy Meal"
      }
    ]
  }
];
