import React from 'react';
import './RestaurantGrid.css';

const TOP_RESTAURANTS = [
  {
    id: 1,
    name: "The Gourmet Pavilion",
    cuisine: "Continental • Burgers",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free Delivery",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60",
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
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
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
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60",
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
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60",
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
    image: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
    image: "https://images.unsplash.com/photo-1619881589670-43629f0e90f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1jZG9uYWxkfGVufDB8fDB8fHww",
    isSuper: true,
    deal: "10% OFF"
  }
];

const RestaurantGrid = () => {
  return (
    <>
      <div className="content-header">
        <h2>Top Restaurants</h2>
        <span className="results-count">{TOP_RESTAURANTS.length} restaurants found</span>
      </div>
      
      <div className="restaurant-grid">
        {TOP_RESTAURANTS.map((restaurant) => (
          <div key={restaurant.id} className="restaurant-card">
            <div className="card-image-wrapper">
              <img src={restaurant.image} alt={restaurant.name} className="restaurant-img" />
              
              {/* Badges */}
              {restaurant.deal && <span className="card-badge-deal">{restaurant.deal}</span>}
              {restaurant.isSuper && <span className="card-badge-super">🎖️ Super</span>}

              {/* Wishlist Button */}
              <button 
                className="wishlist-btn" 
                aria-label="Add to wishlist"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the card's click event if you wrap it in a Link later
                  console.log(`Added ${restaurant.name} to wishlist`);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              
            </div>
            
            <div className="card-details">
              <div className="card-title-row">
                <h3>{restaurant.name}</h3>
                <div className="card-rating">
                  <span className="star-icon">★</span>
                  <span>{restaurant.rating}</span>
                </div>
              </div>
              
              
              <p className="card-cuisine">{restaurant.cuisine}</p>
              
              <div className="card-footer-meta">
                <span className="meta-time">🕒 {restaurant.deliveryTime}</span>
                <span className="meta-divider">•</span>
                <span className="meta-delivery">{restaurant.deliveryFee}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default RestaurantGrid;