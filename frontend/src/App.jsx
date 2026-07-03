import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import CartSidebar from './components/Cart Side bar/CartSidebar';
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
import { TOP_RESTAURANTS } from './data/restaurants';
import './index.css'; // The CSS file for the layout below

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // Initialize restaurants & registered users data in localStorage if not already present
  useEffect(() => {
    const savedRestaurants = localStorage.getItem('naannow_restaurants');
    if (!savedRestaurants) {
      localStorage.setItem('naannow_restaurants', JSON.stringify(TOP_RESTAURANTS));
    }

    const savedUsers = localStorage.getItem('naannow_registeredUsers');
    if (!savedUsers) {
      const demoUsers = [
        {
          name: "Ali Khan",
          email: "ali@rider.com",
          password: "password123",
          role: "rider",
          vehicleDetails: "Honda CD70",
          licensePlate: "ICT-1024",
          status: "pending",
          rating: 4.8
        },
        {
          name: "Hamza Ahmed",
          email: "hamza@rider.com",
          password: "password123",
          role: "rider",
          vehicleDetails: "Suzuki GS150",
          licensePlate: "LHR-9921",
          status: "approved",
          rating: 4.9
        },
        {
          name: "Bilal Butt",
          email: "bilal@rider.com",
          password: "password123",
          role: "rider",
          vehicleDetails: "Yamaha YBR",
          licensePlate: "RWP-5512",
          status: "blocked",
          rating: 3.5
        },
        {
          name: "Sana Rizvi",
          email: "sana@manager.com",
          password: "password123",
          role: "manager",
          restaurantName: "Tandoori Flames (F-10)",
          status: "pending",
          rating: 4.7
        },
        {
          name: "Zainab Malik",
          email: "zainab@manager.com",
          password: "password123",
          role: "manager",
          restaurantName: "Khyber Shinwari (F-7)",
          status: "approved",
          rating: 4.9
        },
        {
          name: "Usman Shah",
          email: "usman@manager.com",
          password: "password123",
          role: "manager",
          restaurantName: "KFC (F-10)",
          status: "blocked",
          rating: 4.2
        },
        {
          name: "Muhammad Saad",
          email: "saad@naannow.com",
          password: "password123",
          role: "customer",
          status: "approved"
        }
      ];
      localStorage.setItem('naannow_registeredUsers', JSON.stringify(demoUsers));
    }
  }, []);

  const showNavbar = location.pathname !== '/login' && location.pathname !== '/admin-dashboard';

  return (
    <div className="app-container">
      {showNavbar && <Navbar setCartOpen={setCartOpen} />}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
        <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
        <Route path="/rider-dashboard" element={<RiderDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </div>
  );
}

export default App;