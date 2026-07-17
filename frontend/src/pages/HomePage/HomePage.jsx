import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import HeroBanner from '../../components/Hero-Banner/Hero-Banner';
import FilterSidebar from '../../components/Filter Side Bar/FilterSideBar';
import CuisineCircles from '../../components/CuisineCircles/CuisineCircles';
import RestaurantGrid from '../../components/RestaurantGrid/RestaurantGrid';

function HomePage() {
  const { user } = useAuth();
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const handleSelectCuisine = (cuisine) => {
    setSelectedCuisine(cuisine);
  };

  return (
    <>
      {/* 1. The Banner Container (Spans full width) */}
      <div className="banner-container">
        <HeroBanner userName={user ? user.name.split(' ')[0] : 'Guest'} />
      </div>

      {/* 2. The Main Layout */}
      <div className="main-layout">
        {/* The Filter Box */}
        <div className="filter-wrapper">
          <FilterSidebar />
        </div>

        {/* The Right Side (Restaurants) */}
        <div className="content-area">
          <CuisineCircles
            selectedCuisine={selectedCuisine}
            onSelectCuisine={handleSelectCuisine}
          />
          <RestaurantGrid
            selectedCuisine={selectedCuisine}
            showFavoritesOnly={false}
          />
        </div>
      </div>
    </>
  );
}

export default HomePage;
