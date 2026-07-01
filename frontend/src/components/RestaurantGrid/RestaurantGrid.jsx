import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantGrid.css';
import { CartContext } from '../Context/CartContext';
import { TOP_RESTAURANTS } from '../../data/restaurants';

const RestaurantGrid = ({ selectedCuisine = 'All', showFavoritesOnly = false }) => {
  const { favorites, toggleFavorite } = useContext(CartContext);
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('naannow_restaurants');
    if (saved) {
      setRestaurants(JSON.parse(saved));
    } else {
      setRestaurants(TOP_RESTAURANTS);
    }
  }, []);

  const filteredRestaurants = showFavoritesOnly
    ? restaurants.filter(restaurant => favorites.includes(restaurant.id))
    : (selectedCuisine === 'All'
        ? restaurants
        : restaurants.filter(restaurant =>
            restaurant.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
          )
      );

  return (
    <>
      <div className="content-header">
        <h2>{showFavoritesOnly ? 'Your Favorites' : 'Top Restaurants'}</h2>
        <span className="results-count">
          {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
        </span>
      </div>
      
      {filteredRestaurants.length === 0 ? (
        <div className="no-restaurants-found">
          <div className="no-restaurants-emoji">
            {showFavoritesOnly ? '❤️' : '🍽️'}
          </div>
          <h3>
            {showFavoritesOnly 
              ? 'No favorites saved yet' 
              : `No restaurants found for "${selectedCuisine}"`}
          </h3>
          <p>
            {showFavoritesOnly 
              ? 'Click the heart icon on any restaurant card to save it here!' 
              : 'Try selecting a different cuisine or check back later!'}
          </p>
        </div>
      ) : (
        <div className="restaurant-grid">
          {filteredRestaurants.map((restaurant) => {
            const isFavorited = favorites.includes(restaurant.id);
            return (
              <div 
                key={restaurant.id} 
                className="restaurant-card"
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-image-wrapper">
                  <img src={restaurant.image} alt={restaurant.name} className="restaurant-img" />
                  
                  {/* Badges */}
                  {restaurant.deal && <span className="card-badge-deal">{restaurant.deal}</span>}
                  {restaurant.isSuper && <span className="card-badge-super">🎖️ Super</span>}

                  {/* Wishlist Button */}
                  <button 
                    className={`wishlist-btn ${isFavorited ? 'active' : ''}`}
                    aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the card's click event if you wrap it in a Link later
                      toggleFavorite(restaurant.id);
                    }}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      fill={isFavorited ? "var(--color-tandoori)" : "none"} 
                      stroke={isFavorited ? "var(--color-tandoori)" : "currentColor"} 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
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
            );
          })}
        </div>
      )}
    </>
  );
};

export default RestaurantGrid;