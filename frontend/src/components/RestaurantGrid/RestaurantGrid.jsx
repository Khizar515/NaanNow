import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantGrid.css';
import { CartContext } from '../Context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const RestaurantGrid = ({ selectedCuisine = 'All', showFavoritesOnly = false, searchQuery = '', filterState = null }) => {
  const { favorites, toggleFavorite } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await api.getRestaurants();
        setRestaurants(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRestaurants();
  }, []);

  const getIsRestaurantActive = (restaurant) => {
    return restaurant.status === 'approved';
  };

  const activeRestaurants = restaurants.filter(getIsRestaurantActive);

  let filteredRestaurants = activeRestaurants;

  if (showFavoritesOnly) {
    filteredRestaurants = filteredRestaurants.filter(r => favorites.includes(r._id));
  } else {
    if (selectedCuisine !== 'All') {
      filteredRestaurants = filteredRestaurants.filter(r => 
        (r.cuisine || '').toLowerCase().includes(selectedCuisine.toLowerCase())
      );
    }
  }

  // Apply Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredRestaurants = filteredRestaurants.filter(r => 
      (r.name || '').toLowerCase().includes(q) || 
      (r.cuisine || '').toLowerCase().includes(q)
    );
  }

  // Apply Sidebar Filters
  if (filterState) {
    if (filterState.ratings4Plus) {
      filteredRestaurants = filteredRestaurants.filter(r => r.rating >= 4);
    }
    if (filterState.superRestaurant) {
      filteredRestaurants = filteredRestaurants.filter(r => r.isSuper);
    }
    if (filterState.offers?.freeDelivery) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        (r.deliveryFee || '').toLowerCase() === 'free' || (r.deliveryFee || '').includes('0')
      );
    }
    if (filterState.offers?.deals) {
      filteredRestaurants = filteredRestaurants.filter(r => r.deal);
    }
    if (filterState.cuisines?.length > 0) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        filterState.cuisines.some(c => (r.cuisine || '').toLowerCase().includes(c.toLowerCase()))
      );
    }
    
    // Sort By
    if (filterState.sortBy === 'Fastest delivery') {
      filteredRestaurants.sort((a, b) => parseInt(a.deliveryTime || '0') - parseInt(b.deliveryTime || '0'));
    } else if (filterState.sortBy === 'Top rated') {
      filteredRestaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }

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
            const isFavorited = favorites.includes(restaurant._id);
            const imageSrc = restaurant.image ? (restaurant.image.startsWith('http') ? restaurant.image : `http://localhost:5000/${restaurant.image.replace(/\\/g, '/')}`) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000';
            return (
              <div 
                key={restaurant._id} 
                className="restaurant-card"
                onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-image-wrapper">
                  <img src={imageSrc} alt={restaurant.name} className="restaurant-img" />
                  
                  {/* Badges */}
                  {restaurant.isOpen === false ? (
                    <span className="card-badge-deal" style={{ backgroundColor: '#ef4444', color: '#fff' }}>🔴 Closed</span>
                  ) : (
                    restaurant.deal && <span className="card-badge-deal">{restaurant.deal}</span>
                  )}
                  {restaurant.isSuper && <span className="card-badge-super">🎖️ Super</span>}

                  {/* Wishlist Button */}
                  <button 
                    className={`wishlist-btn ${isFavorited ? 'active' : ''}`}
                    aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the card's click event
                      if (!user) {
                        navigate('/login');
                      } else {
                        toggleFavorite(restaurant._id);
                      }
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
                      <span>{restaurant.rating > 0 ? restaurant.rating : 'New'}</span>
                    </div>
                  </div>
                  
                  <p className="card-cuisine">{restaurant.cuisine}</p>
                  
                  <div className="card-footer-meta">
                    {restaurant.deliveryTime && (
                      <span className="meta-time">🕒 {restaurant.deliveryTime}</span>
                    )}
                    {restaurant.deliveryTime && restaurant.deliveryFee && (
                      <span className="meta-divider">•</span>
                    )}
                    {restaurant.deliveryFee && (
                      <span className="meta-delivery">🛵 {restaurant.deliveryFee}</span>
                    )}
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