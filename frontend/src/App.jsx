import React from 'react';
import Navbar from './components/Navbar/Navbar';
import HeroBanner from './components/Hero-Banner/Hero-Banner';
import FilterSidebar from './components/Filter Side Bar/FilterSideBar';
import './index.css'; // The CSS file for the layout below

function Home() {
  return (
    <div className="app-container">
      <Navbar />
      
      {/* THIS IS THE CRUCIAL WRAPPER */}
      <div className="main-layout">
        
        {/* Left Column: Filter Sidebar */}
        <FilterSidebar />

        {/* Right Column: Banner + Restaurants */}
        <div className="right-content">
          
          {/* Banner is INSIDE the right column, so it sits next to the filter */}
          <HeroBanner userName="Muhammad Saad" />
          
          {/* Your Restaurant Cards will go right here, under the banner */}
          <div className="restaurants-section">
            <h2 style={{ marginTop: '30px' }}>111 Restaurants found</h2>
            {/* <RestaurantGrid /> */}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Home;