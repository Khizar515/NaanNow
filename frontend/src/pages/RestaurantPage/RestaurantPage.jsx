import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CartContext } from '../../components/Context/CartContext';
import './RestaurantPage.css';

function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    favorites,
    toggleFavorite
  } = useContext(CartContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await api.getRestaurantById(id);
        setRestaurant(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container" style={{ padding: '60px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--color-roasted)' }}>
        Loading restaurant details...
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="error-page">
        <div className="error-content">
          <h2>Restaurant Not Found</h2>
          <p>The restaurant you are looking for does not exist or has been removed.</p>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Get unique categories from menu items
  const categories = ['All', ...new Set(restaurant.menu.map(item => item.category))];

  // Filter menu items by search query and category
  const filteredMenu = restaurant.menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isFavorited = favorites.includes(restaurant._id);

  // Helper to check if item is in cart and return its quantity
  const getCartItemQuantity = (itemId) => {
    const item = cartItems.find(cartItem => cartItem._id === itemId);
    return item ? item.quantity : 0;
  };

  const imageSrc = restaurant.image ? (restaurant.image.startsWith('http') ? restaurant.image : `http://localhost:5000/${restaurant.image.replace(/\\/g, '/')}`) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000';

  return (
    <div className="restaurant-page-container">
      {/* 1. Header Navigation Bar */}
      <div className="restaurant-header-bar">
        <div className="restaurant-breadcrumbs">
          <button
            className="breadcrumb-link"
            onClick={() => navigate('/')}
            aria-label="Back to Home"
          >
            Home
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{restaurant.name}</span>
        </div>

        <button
          className="back-home-btn"
          onClick={() => navigate('/')}
        >
          ← Back to Shopping
        </button>
      </div>

      {/* 2. Restaurant Hero Banner */}
      <div className="restaurant-hero">
        <div
          className="hero-background"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-info-card">
            <div className="badge-row">
              {restaurant.isSuper && <span className="hero-badge super">🎖️ Super Partner</span>}
              {restaurant.deal && <span className="hero-badge deal">🔥 {restaurant.deal}</span>}
            </div>

            <h1 className="restaurant-title">{restaurant.name}</h1>
            <p className="restaurant-cuisines">{restaurant.cuisine}</p>

            <div className="restaurant-meta-row">
              <div className="meta-item rating">
                <span className="star">★</span>
                <span className="rating-value">{restaurant.rating}</span>
                <span className="review-count">(100+ ratings)</span>
              </div>
              <span className="meta-dot">•</span>
              <div className="meta-item time">
                <span>🕒 {restaurant.deliveryTime}</span>
              </div>
              <span className="meta-dot">•</span>
              <div className="meta-item fee">
                <span>🛵 {restaurant.deliveryFee}</span>
              </div>
            </div>
          </div>

          <button
            className={`hero-fav-btn ${isFavorited ? 'active' : ''}`}
            onClick={() => toggleFavorite(restaurant._id)}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFavorited ? "var(--color-tandoori)" : "none"}
              stroke={isFavorited ? "var(--color-tandoori)" : "currentColor"}
              strokeWidth="2.5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Menu Section Container */}
      <div className="menu-container">
        {/* Menu Controls: Categories sidebar & Search */}
        <div className="menu-controls">
          <div className="search-bar-wrapper">
            <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search items in menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="menu-search-input"
            />
          </div>

          <div className="categories-list">
            <h4>Menu Categories</h4>
            <div className="categories-buttons">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-tab-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="menu-items-area">
          <div className="menu-items-header">
            <h2>{selectedCategory} Items</h2>
            <span className="item-count">{filteredMenu.length} items found</span>
          </div>

          {filteredMenu.length === 0 ? (
            <div className="no-items-found">
              <div className="no-items-icon">🍽️</div>
              <h3>No items match your search</h3>
              <p>Try searching for something else or switching categories.</p>
            </div>
          ) : (
            <div className="menu-items-grid">
              {filteredMenu.map(item => {
                const quantityInCart = getCartItemQuantity(item._id);
                const itemImgSrc = item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000/${item.image.replace(/\\/g, '/')}`) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000';

                return (
                  <div key={item._id} className="menu-item-card">
                    <div className="menu-item-image-wrapper">
                      <img src={itemImgSrc} alt={item.name} className="menu-item-img" />
                    </div>

                    <div className="menu-item-details">
                      <div className="menu-item-header-row">
                        <h3 className="menu-item-name">{item.name}</h3>
                        <span className="menu-item-category-tag">{item.category}</span>
                      </div>

                      <p className="menu-item-description">{item.description}</p>

                      <div className="menu-item-footer">
                        <span className="menu-item-price">Rs {item.price}</span>

                        <div className="menu-item-action-wrapper">
                          {quantityInCart > 0 ? (
                            <div className="menu-qty-control">
                              <button
                                className="qty-btn minus"
                                onClick={() => decreaseQuantity(item._id)}
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="qty-val">{quantityInCart}</span>
                              <button
                                className="qty-btn plus"
                                onClick={() => increaseQuantity(item._id)}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              className="add-to-cart-btn"
                              onClick={() => addToCart({
                                _id: item._id,
                                name: item.name,
                                price: item.price,
                                image: itemImgSrc,
                                restaurantId: restaurant._id,
                                restaurantName: restaurant.name
                              })}
                            >
                              Add to Tokri
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantPage;
