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
import { useAuth } from './context/AuthContext';
import './index.css'; // The CSS file for the layout below

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { user } = useAuth();

  const showNavbar = location.pathname !== '/login' && location.pathname !== '/admin-dashboard' && location.pathname !== '/blocked';

  if (user && user.status === 'blocked' && location.pathname !== '/blocked' && location.pathname !== '/login') {
    return <BlockedPage />;
  }

  return (
    <div className="app-container">
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