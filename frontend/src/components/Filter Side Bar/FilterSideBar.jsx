import React, { useState } from 'react';
import './FilterSidebar.css';

const FilterSidebar = () => {
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  // Sample data for cuisines based on your image
  const cuisines = [
    'American', 'BBQ', 'Beverages', 'Biryani', 'Burgers', 
    'Cakes & Bakery', 'Chinese', 'Continental', 'Desserts'
  ];

  const displayedCuisines = showAllCuisines ? cuisines : cuisines.slice(0, 5);

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h2>Filter</h2>
        <button className="clear-btn">Clear all</button>
      </div>

      <div className="filter-scroll-area">
        {/* Sort By Section */}
        <div className="filter-section">
          <h3>Sort by</h3>
          <label className="radio-label">
            <input type="radio" name="sort" defaultChecked />
            <span className="radio-custom"></span>
            Relevance
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" />
            <span className="radio-custom"></span>
            Fastest delivery
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" />
            <span className="radio-custom"></span>
            Distance
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" />
            <span className="radio-custom"></span>
            Top rated
          </label>
        </div>

        {/* Quick Filters Section */}
        <div className="filter-section">
          <h3>Quick filters</h3>
          <div className="pill-group">
            <button className="filter-pill">Ratings 4+</button>
            <button className="filter-pill">
              <span className="icon">🎖️</span> Super Restaurant
            </button>
          </div>
        </div>

        {/* Offers Section */}
        <div className="filter-section">
          <h3>Offers</h3>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span className="checkbox-custom"></span>
            Free delivery
          </label>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span className="checkbox-custom"></span>
            Accepts vouchers
          </label>
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked />
            <span className="checkbox-custom"></span>
            Deals
          </label>
        </div>

        {/* Cuisines Section */}
        <div className="filter-section">
          <h3>Cuisines</h3>
          <div className="search-input-wrapper">
            <svg width="14" height="14" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input type="text" placeholder="Search for cuisine" />
          </div>
          
          <div className="cuisine-list">
            {displayedCuisines.map((cuisine) => (
              <label key={cuisine} className="checkbox-label">
                <input type="checkbox" />
                <span className="checkbox-custom"></span>
                {cuisine}
              </label>
            ))}
          </div>
          
          <button 
            className="show-more-btn" 
            onClick={() => setShowAllCuisines(!showAllCuisines)}
          >
            {showAllCuisines ? 'Show less' : 'Show more'} 
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showAllCuisines ? 'rotate(180deg)' : 'rotate(0)' }}>
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* Price Section */}
        <div className="filter-section">
          <h3>Price</h3>
          <div className="price-toggle-group">
            <button className="price-btn active">$</button>
            <button className="price-btn">$$</button>
            <button className="price-btn">$$$</button>
          </div>
        </div>
        
      </div>
    </aside>
  );
};

export default FilterSidebar;