import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from "../Context/CartContext";
import './Navbar.css';

import logo from '../../assets/logo-removebg.png';
import cart from '../../assets/cart.svg';
import naan from '../../assets/naan-removebg.png';

function Navbar({ setCartOpen }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showTopRow, setShowTopRow] = useState(true);
  const { cartItems, addToCart, favorites } = useContext(CartContext);

  const navigate = useNavigate();
  const location = useLocation();

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth > 768) return;

      const currentScrollY = window.scrollY;

      // Detect direction
      const isScrollingDown =
        currentScrollY > lastScrollY.current;

      const isScrollingUp =
        currentScrollY < lastScrollY.current;

      // HIDE
      // only after enough downward scroll
      if (
        isScrollingDown &&
        currentScrollY > 140 &&
        showTopRow
      ) {
        setShowTopRow(false);
      }

      // SHOW
      // whenever scrolling upward
      else if (
        isScrollingUp &&
        !showTopRow
      ) {
        setShowTopRow(true);
      }

      // IMPORTANT:
      // Prevent negative values on iOS bounce
      lastScrollY.current = Math.max(currentScrollY, 0);
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTopRow]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setShowTopRow(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (

    <nav className={`navbar ${showTopRow ? '' : 'hide-top'}`}>

      {/* --- TOP ROW --- */}
      <div className="navbar-top">


        {/* Mobile Profile Icon (Visible only on mobile, Left side) */}
        <button className="icon-btn mobile-only">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>

        {/* Brand (Centered on mobile) */}
        <div className="nav-brand" onClick={() => navigate('/')}>
          <img src={logo} alt="Naan Now Logo" className="nav-logo" />
        </div>

        {/* Location (Desktop Only) */}
        <div className="nav-location-wrapper desktop-only">
          <button className="location-btn" onClick={() => alert('Address modal will open here!')}>
            <svg width="20" height="20" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="location-text">Street 11 Islamabad</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="chevron-icon">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* User Actions */}
        <div className="nav-user-actions">

          {/* Desktop Profile Dropdown */}
          <div className="profile-menu-container desktop-only">
            <button className="action-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Muhammad Saad
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <ul>
                  <li>Profile</li>
                  <li>Help Center</li>
                  <li className="logout-item">Logout</li>
                </ul>
              </div>
            )}
          </div>

          <button className="action-btn desktop-only">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            EN
          </button>

          {/* Wishlist Icon */}
          <button 
            className={`icon-btn heart-icon-btn ${location.pathname === '/favorites' ? 'active' : ''}`}
            onClick={() => navigate(location.pathname === '/favorites' ? '/' : '/favorites')}
            title="Toggle Favorites"
            aria-label="View Favorites"
          >
            <svg 
              width="22" 
              height="22" 
              fill={location.pathname === '/favorites' || favorites.length > 0 ? "var(--color-tandoori)" : "none"} 
              stroke={location.pathname === '/favorites' || favorites.length > 0 ? "var(--color-tandoori)" : "currentColor"} 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {favorites.length > 0 && (
              <span className="favorites-badge">{favorites.length}</span>
            )}
          </button>

          {/* Cart Icon */}
          <div className="cart-container" onClick={() => setCartOpen(true)}>
            <img src={cart} alt="Cart" className="cart-icon" />
            <span className="cart-badge">
              {
                cartItems.reduce(
                  (total, item) => total + item.quantity,
                  0
                )
              }
            </span>
          </div>
          <button
            onClick={() =>
              addToCart({
                id: 1,
                name: "Garlic Naan",
                price: 150,
                image: naan
              })
            }
          >
            Add Test Item
          </button>


        </div>
      </div>

      {/* --- MIDDLE ROW (Mobile Only) --- */}
      <div className="navbar-middle mobile-only">
        <button className="location-btn">
          <svg width="20" height="20" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="location-text">Street 11 Islamabad</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="chevron-icon">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </button>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className={`navbar-bottom ${isSearchFocused ? 'search-focused' : ''}`}>

        <div className="nav-tabs">
          <button className="tab active">
            <span className="tab-icon">🛵</span> <span className="tab-text">Delivery</span>
          </button>
          <button className="tab">
            <span className="tab-icon">🏪</span> <span className="tab-text">Shops</span>
          </button>
        </div>

        <div className="nav-search">
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
          <input
            type="text"
            placeholder="Search..."
            /* 3. Add onFocus and onBlur events here */
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>

      </div>

    </nav>

  );
}

export default Navbar;