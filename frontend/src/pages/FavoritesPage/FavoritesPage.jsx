import React from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantGrid from '../../components/RestaurantGrid/RestaurantGrid';
import './FavoritesPage.css';

function FavoritesPage() {
  const navigate = useNavigate();

  return (
    <div className="favorites-page-container">
      <div className="favorites-header-bar">
        <div className="favorites-breadcrumbs">
          <button 
            className="breadcrumb-link" 
            onClick={() => navigate('/')}
            aria-label="Back to Home"
          >
            Home
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Favorites</span>
        </div>
        
        <button 
          className="back-home-btn"
          onClick={() => navigate('/')}
        >
          ← Back to Shopping
        </button>
      </div>

      <div className="favorites-content-wrapper">
        <RestaurantGrid showFavoritesOnly={true} />
      </div>
    </div>
  );
}

export default FavoritesPage;
