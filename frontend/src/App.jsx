import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import CartSidebar from './components/Cart Side Bar/CartSideBar';
import HomePage from './pages/HomePage/HomePage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import RestaurantPage from './pages/RestaurantPage/RestaurantPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import OrdersPage from './pages/OrdersPage/OrdersPage';
import TrackOrderPage from './pages/TrackOrderPage/TrackOrderPage';
import RestaurantDashboard from './pages/RestaurantDashboard/RestaurantDashboard';
import RiderDashboard from './pages/RiderDashboard/RiderDashboard';
import AuthPage from './pages/AuthPage/AuthPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import BlockedPage from './pages/BlockedPage/BlockedPage';
import DisclaimerPopup from './components/DisclaimerPopup/DisclaimerPopup';
import { useAuth } from './context/AuthContext';
import './index.css'; // The CSS file for the layout below

const PAGE_TITLES = {
  '/': 'NaanNow – Order Food Online',
  '/favorites': 'My Favorites – NaanNow',
  '/checkout': 'Checkout – NaanNow',
  '/profile': 'My Profile – NaanNow',
  '/orders': 'My Orders – NaanNow',
  '/login': 'Sign In – NaanNow',
  '/blocked': 'Account Blocked – NaanNow',
  '/restaurant-dashboard': 'Restaurant Dashboard – NaanNow',
  '/rider-dashboard': 'Rider Dashboard – NaanNow',
  '/admin-dashboard': 'Admin Dashboard – NaanNow',
};

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { user } = useAuth();

  // Set page title based on current route
  useEffect(() => {
    const path = location.pathname;
    // Handle dynamic routes like /restaurant/:id and /track-order/:orderId
    if (path.startsWith('/restaurant/')) {
      document.title = 'Restaurant – NaanNow';
    } else if (path.startsWith('/track-order/')) {
      document.title = 'Track Order – NaanNow';
    } else {
      document.title = PAGE_TITLES[path] || 'NaanNow';
    }
  }, [location.pathname]);

  const showNavbar = location.pathname !== '/login' && location.pathname !== '/admin-dashboard' && location.pathname !== '/blocked';

  if (user && user.status === 'blocked' && location.pathname !== '/blocked' && location.pathname !== '/login') {
    return <BlockedPage />;
  }

  return (
    <div className="app-container">
      <DisclaimerPopup />
      {showNavbar && <Navbar setCartOpen={setCartOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      <Routes>
        <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
        </Route>

        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
        <Route path="/rider-dashboard" element={<RiderDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/blocked" element={<BlockedPage />} />
      </Routes>
    </div>
  );
}

export default App;