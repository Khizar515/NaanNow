import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from "../Context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { api } from '../../api';
import './Navbar.css';

import logo from '../../assets/logo-removebg.png';
import cart from '../../assets/cart.svg';
import naan from '../../assets/naan-removebg.png';

function Navbar({ setCartOpen, searchQuery, setSearchQuery }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showTopRow, setShowTopRow] = useState(true);
  const { cartItems, addToCart, favorites } = useContext(CartContext);
  const { user: currentUser, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Address state — initialized from DB user
  const getInitialAddress = () => {
    if (currentUser && currentUser.address) {
      return currentUser.address;
    }
    return currentUser ? 'Add your address' : 'Deliver to...';
  };

  const [address, setAddress] = useState(getInitialAddress);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isStaffUser, setIsStaffUser] = useState(false);

  useEffect(() => {
    if (currentUser) {
      api.getStaffMe()
        .then(staff => {
          if (staff && (staff.isAdmin || staff.isStaff)) {
            setIsStaffUser(true);
          } else {
            setIsStaffUser(false);
          }
        })
        .catch(() => setIsStaffUser(false));
    } else {
      setIsStaffUser(false);
    }
  }, [currentUser]);

  const handleSaveAddress = async () => {
    if (addressInput.trim()) {
      const newAddress = addressInput.trim();
      setAddress(newAddress);
      localStorage.setItem('naannow_userAddress', newAddress);
      setIsAddressModalOpen(false);

      // Persist to database
      if (currentUser) {
        try {
          await api.updateProfile({ address: newAddress });
        } catch (err) {
          console.error('Failed to save address to DB:', err);
        }
      }
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setAddressInput('Geolocation not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setAddressInput('Detecting location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const parts = [];
          if (data.address) {
            if (data.address.road) parts.push(data.address.road);
            if (data.address.suburb) parts.push(data.address.suburb);
            if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
          }
          setAddressInput(parts.length > 0 ? parts.join(', ') : data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setAddressInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setAddressInput('Could not detect location. Please enter manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Open address modal with auth guard and fetch recent addresses from orders
  const handleOpenAddressModal = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setAddressInput(address === 'Add your address' ? '' : address);
    setIsAddressModalOpen(true);

    try {
      const orders = await api.getOrders();
      const uniqueAddresses = [...new Set(
        orders
          .map(o => o.deliveryAddress)
          .filter(addr => addr && addr.trim())
      )].slice(0, 5);
      setRecentAddresses(uniqueAddresses);
    } catch (err) {
      console.error('Failed to fetch recent addresses:', err);
      setRecentAddresses([]);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

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

  // Sync address from currentUser when it loads or changes
  useEffect(() => {
    if (currentUser && currentUser.address) {
      setAddress(currentUser.address);
      localStorage.setItem('naannow_userAddress', currentUser.address);
    } else if (currentUser && !currentUser.address) {
      setAddress('Add your address');
    } else if (!currentUser) {
      setAddress('Deliver to...');
    }
  }, [currentUser]);


  return (

    <nav className={`navbar ${showTopRow ? '' : 'hide-top'}`}>

      {/* --- TOP ROW --- */}
      <div className="navbar-top">


        {/* Mobile Profile Icon (Visible only on mobile, Left side) */}
        <button className="icon-btn mobile-only" onClick={() => navigate('/profile')}>
          {currentUser && (currentUser.profilePic || currentUser.avatar) ? (
            <img
              src={(currentUser.profilePic || currentUser.avatar).startsWith('http') ? (currentUser.profilePic || currentUser.avatar) : `http://localhost:5000/${(currentUser.profilePic || currentUser.avatar).replace(/\\/g, '/')}`}
              alt={currentUser.name}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-tandoori)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
              {currentUser?.name ? currentUser.name[0].toUpperCase() : '👤'}
            </div>
          )}
        </button>

        {/* Brand (Centered on mobile) */}
        <div className="nav-brand" onClick={() => navigate('/')}>
          <img src={logo} alt="Naan Now Logo" className="nav-logo" />
        </div>

        {/* Location (Desktop Only) */}
        <div className="nav-location-wrapper desktop-only">
          <button className="location-btn" onClick={handleOpenAddressModal}>
            <svg width="20" height="20" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="location-text">{address}</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="chevron-icon">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* User Actions */}
        <div className="nav-user-actions">

          {/* Desktop Profile Dropdown or Login Button */}
          {currentUser ? (
            <div className="profile-menu-container desktop-only">
              <button className="action-btn" onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ gap: '8px' }}>
                {(currentUser.profilePic || currentUser.avatar) ? (
                  <img
                    src={(currentUser.profilePic || currentUser.avatar).startsWith('http') ? (currentUser.profilePic || currentUser.avatar) : `http://localhost:5000/${(currentUser.profilePic || currentUser.avatar).replace(/\\/g, '/')}`}
                    alt={currentUser.name}
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--color-tandoori)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                {currentUser.name}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <ul>
                    {/* Manager always sees their restaurant portal link */}
                    {currentUser.role === 'manager' && (
                      <li
                        style={{ fontWeight: 'bold', color: 'var(--color-tandoori)', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => { navigate('/restaurant-dashboard'); setIsProfileOpen(false); }}
                      >
                        🏪 Go to Restaurant Portal
                      </li>
                    )}

                    {/* Rider always sees their rider portal link */}
                    {currentUser.role === 'rider' && (
                      <li
                        style={{ fontWeight: 'bold', color: 'var(--color-tandoori)', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => { navigate('/rider-dashboard'); setIsProfileOpen(false); }}
                      >
                        🛵 Go to Rider Portal
                      </li>
                    )}

                    {/* Admin sees admin panel link */}
                    {currentUser.role === 'admin' && (
                      <li
                        style={{ fontWeight: 'bold', color: 'var(--color-tandoori)', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => { navigate('/admin-dashboard'); setIsProfileOpen(false); }}
                      >
                        🧑‍💼 Go to Admin Panel
                      </li>
                    )}

                    {/* Staff portal — only if user has an active staff assignment
                        (manager/rider who are also staff see BOTH their portal + this) */}
                    {isStaffUser && currentUser.role !== 'admin' && (
                      <li
                        style={{ fontWeight: 'bold', color: 'var(--color-tandoori)', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => { navigate('/admin-dashboard'); setIsProfileOpen(false); }}
                      >
                        🧑‍💼 Go to Staff Portal
                      </li>
                    )}
                    <li onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}>Profile</li>
                    <li onClick={() => setIsProfileOpen(false)}>Help Center</li>
                    <li className="logout-item" onClick={handleLogout}>Logout</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <button className="action-btn login-btn desktop-only" onClick={() => navigate('/login')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Login / Register
            </button>
          )}

          <button className="action-btn desktop-only">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            EN
          </button>

          {/* Wishlist Icon (Hidden on rider & restaurant dashboards) */}
          {location.pathname !== '/restaurant-dashboard' && location.pathname !== '/rider-dashboard' && (
            <button
              className={`icon-btn heart-icon-btn ${location.pathname === '/favorites' ? 'active' : ''}`}
              onClick={() => {
                if (!currentUser) {
                  navigate('/login');
                } else {
                  navigate(location.pathname === '/favorites' ? '/' : '/favorites');
                }
              }}
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
          )}

          {/* Cart Icon (Hidden on rider & restaurant dashboards) */}
          {location.pathname !== '/restaurant-dashboard' && location.pathname !== '/rider-dashboard' && (
            <div className="cart-container" onClick={() => {
              if (!currentUser) {
                navigate('/login');
              } else {
                setCartOpen(true);
              }
            }}>
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
          )}
        </div>
      </div>

      {/* --- MIDDLE ROW (Mobile Only) --- */}
      <div className="navbar-middle mobile-only">
        <button className="location-btn" onClick={handleOpenAddressModal}>
          <svg width="20" height="20" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="location-text">{address}</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="chevron-icon">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </button>
      </div>

      {/* --- BOTTOM ROW (Hidden on rider & restaurant dashboards) --- */}
      {location.pathname !== '/restaurant-dashboard' && location.pathname !== '/rider-dashboard' && (
        <div className={`navbar-bottom ${isSearchFocused ? 'search-focused' : ''}`}>

          <div className="nav-tabs">
            <button
              className={`tab ${(!location.pathname.startsWith('/orders') && !location.pathname.startsWith('/track-order') && !location.pathname.startsWith('/restaurant-dashboard') && !location.pathname.startsWith('/rider-dashboard')) ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <span className="tab-icon">🛵</span> <span className="tab-text">Delivery</span>
            </button>
            <button
              className={`tab ${(location.pathname.startsWith('/orders') || location.pathname.startsWith('/track-order')) ? 'active' : ''}`}
              onClick={() => {
                if (!currentUser) {
                  navigate('/login');
                } else {
                  navigate('/orders');
                }
              }}
            >
              <span className="tab-icon">📋</span> <span className="tab-text">Orders</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="nav-search">
            <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>

        </div>
      )}

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div className="address-modal-backdrop" onClick={() => setIsAddressModalOpen(false)}>
          <div className="address-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>Select Delivery Address</h3>
              <button className="close-modal-btn" onClick={() => setIsAddressModalOpen(false)}>&times;</button>
            </div>

            <div className="address-modal-body">
              <div className="input-group-address">
                <label htmlFor="modal-address-input">Delivery Location</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <input
                    id="modal-address-input"
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter your street address..."
                  />
                </div>
              </div>

              <button className="detect-location-btn" onClick={handleDetectLocation} disabled={detectingLocation}>
                <span className="gps-icon">🎯</span> {detectingLocation ? 'Detecting...' : 'Detect My Location'}
              </button>

              {recentAddresses.length > 0 && (
                <div className="recent-addresses-section">
                  <h4>Recent Addresses</h4>
                  <div className="recent-list">
                    {recentAddresses.map((addr, idx) => (
                      <button
                        key={idx}
                        className={`recent-addr-item ${addressInput === addr ? 'selected' : ''}`}
                        onClick={() => setAddressInput(addr)}
                      >
                        <span>📍</span> {addr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="address-modal-footer">
              <button className="modal-cancel-btn" onClick={() => setIsAddressModalOpen(false)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSaveAddress} disabled={!addressInput.trim() || addressInput === 'Detecting location...'}>
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

    </nav>

  );
}

export default Navbar;