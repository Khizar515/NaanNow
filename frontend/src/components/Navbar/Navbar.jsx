import React, { useState } from 'react'; // Add useState here
import './Navbar.css';

import logo from '../../assets/logo-removebg.png'; 
import naanVector from '../../assets/naan-removebg.png'; 

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  return (
    <nav className="navbar">

      {/* --- TOP ROW --- */}
      <div className="navbar-top">
        
        {/* Brand */}
        <div className="nav-brand">
          <a href=""><img src={logo} alt="Naan Now Logo" className="nav-logo" /></a>
        </div>

        {/* Location Button */}
        <div className="nav-location-wrapper">
          <button className="location-btn" onClick={() => alert('Address modal will open here!')}>
            <svg width="20" height="20" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="location-text">Street 11 Islamabad</span>
            {/* Small dropdown arrow to indicate it's clickable */}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="chevron-icon">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* User Actions */}
        <div className="nav-user-actions">
          
          <div className="profile-menu-container">
            <button 
              className="action-btn" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Muhammad Saad
              {/* The chevron arrow */}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>

            {/* 2. The Dropdown Menu (Only renders if isProfileOpen is true) */}
            {isProfileOpen && (
              <div className="profile-dropdown">
                <ul>
                  <li>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Profile
                  </li>
                  <li>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Help Center
                  </li>
                  <li className="logout-item">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button className="action-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            EN
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>
          </button>

          <button className="icon-btn">
             <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>

          {/* Custom Naan Cart */}
          <div className="cart-container">
            <img src={naanVector} alt="Cart" className="cart-icon" />
            <span className="cart-badge">1</span> 
          </div>

        </div>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="navbar-bottom">
        
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button className="tab active">
             <span className="tab-icon">🛵</span> Delivery
          </button>
          {/* <button className="tab">
             <span className="tab-icon">🚶</span> Pick-up
          </button> */}
          {/* <button className="tab">
             <span className="tab-icon">🛍️</span> Naan Market
          </button> */}
          <button className="tab">
             <span className="tab-icon">🏪</span> Shops
          </button>
        </div>

        {/* Large Search Bar */}
        <div className="nav-search">
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
          <input type="text" placeholder="Search for restaurants, cuisines, and dishes" />
        </div>

      </div>

    </nav>
  );
}

export default Navbar;
