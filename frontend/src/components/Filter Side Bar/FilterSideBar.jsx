import React, { useState } from 'react';
import './FilterSideBar.css';

const FilterSidebar = ({ filterState = {}, setFilterState }) => {
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  // Defaults fallback to avoid crashing if prop not provided
  const f = filterState.sortBy ? filterState : {
    sortBy: 'Relevance',
    ratings4Plus: false,
    superRestaurant: false,
    offers: { freeDelivery: false, acceptsVouchers: false, deals: false },
    cuisines: [],
    priceTier: null
  };

  const handleSortChange = (val) => setFilterState?.({ ...f, sortBy: val });
  const toggleQuickFilter = (key) => setFilterState?.({ ...f, [key]: !f[key] });
  const toggleOffer = (key) => setFilterState?.({ ...f, offers: { ...f.offers, [key]: !f.offers[key] } });
  const toggleCuisine = (cuisine) => {
    const exists = f.cuisines.includes(cuisine);
    setFilterState?.({ ...f, cuisines: exists ? f.cuisines.filter(c => c !== cuisine) : [...f.cuisines, cuisine] });
  };
  const handleClearAll = () => {
    setFilterState?.({
      sortBy: 'Relevance', ratings4Plus: false, superRestaurant: false,
      offers: { freeDelivery: false, acceptsVouchers: false, deals: false },
      cuisines: [], priceTier: null
    });
  };

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
        <button className="clear-btn" onClick={handleClearAll}>Clear all</button>
      </div>

      <div className="filter-scroll-area">
        {/* Sort By Section */}
        <div className="filter-section">
          <h3>Sort by</h3>
          <label className="radio-label">
            <input type="radio" name="sort" checked={f.sortBy === 'Relevance'} onChange={() => handleSortChange('Relevance')} />
            <span className="radio-custom"></span>
            Relevance
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" checked={f.sortBy === 'Fastest delivery'} onChange={() => handleSortChange('Fastest delivery')} />
            <span className="radio-custom"></span>
            Fastest delivery
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" checked={f.sortBy === 'Distance'} onChange={() => handleSortChange('Distance')} />
            <span className="radio-custom"></span>
            Distance
          </label>
          <label className="radio-label">
            <input type="radio" name="sort" checked={f.sortBy === 'Top rated'} onChange={() => handleSortChange('Top rated')} />
            <span className="radio-custom"></span>
            Top rated
          </label>
        </div>

        {/* Quick Filters Section */}
        <div className="filter-section">
          <h3>Quick filters</h3>
          <div className="pill-group">
            <button className={`filter-pill ${f.ratings4Plus ? 'active' : ''}`} onClick={() => toggleQuickFilter('ratings4Plus')}>Ratings 4+</button>
            <button className={`filter-pill ${f.superRestaurant ? 'active' : ''}`} onClick={() => toggleQuickFilter('superRestaurant')}>
              <span className="icon">🎖️</span> Super Restaurant
            </button>
          </div>
        </div>

        {/* Offers Section */}
        <div className="filter-section">
          <h3>Offers</h3>
          <label className="checkbox-label">
            <input type="checkbox" checked={f.offers.freeDelivery} onChange={() => toggleOffer('freeDelivery')} />
            <span className="checkbox-custom"></span>
            Free delivery
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={f.offers.acceptsVouchers} onChange={() => toggleOffer('acceptsVouchers')} />
            <span className="checkbox-custom"></span>
            Accepts vouchers
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={f.offers.deals} onChange={() => toggleOffer('deals')} />
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
                <input type="checkbox" checked={f.cuisines.includes(cuisine)} onChange={() => toggleCuisine(cuisine)} />
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
            <button className={`price-btn ${f.priceTier === 1 ? 'active' : ''}`} onClick={() => setFilterState?.({ ...f, priceTier: f.priceTier === 1 ? null : 1 })}>$</button>
            <button className={`price-btn ${f.priceTier === 2 ? 'active' : ''}`} onClick={() => setFilterState?.({ ...f, priceTier: f.priceTier === 2 ? null : 2 })}>$$</button>
            <button className={`price-btn ${f.priceTier === 3 ? 'active' : ''}`} onClick={() => setFilterState?.({ ...f, priceTier: f.priceTier === 3 ? null : 3 })}>$$$</button>
          </div>
        </div>
        
      </div>
    </aside>
  );
};

export default FilterSidebar;