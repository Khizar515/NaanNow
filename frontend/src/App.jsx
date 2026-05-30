import React from 'react';
import Navbar from './components/Navbar/Navbar';
import HeroBanner from './components/Hero-Banner/Hero-Banner';
import FilterSidebar from './components/Filter Side Bar/FilterSideBar';
import RestaurantGrid from './components/RestaurantGrid/RestaurantGrid';
import './index.css'; // The CSS file for the layout below

function Home() {
return (
    <div className="app-container">
      <Navbar />
      
      {/* 1. The Banner Container (Spans full width) */}
      <div className="banner-container">
        <HeroBanner userName="Muhammad Saad" />
      </div>

      {/* 2. The Main Layout */}
      <div className="main-layout">
        
        {/* The Filter Box */}
        <div className="filter-wrapper">
          <FilterSidebar />
        </div>

        {/* The Right Side (Restaurants) */}
        <div className="content-area">
          <RestaurantGrid />
          {/* Your restaurant cards go here */}
        </div>
        
      </div>
    </div>
  );
}

export default Home;