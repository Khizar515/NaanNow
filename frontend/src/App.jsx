import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import CartSidebar from './components/Cart Side bar/CartSidebar';
import HomePage from './pages/HomePage/HomePage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import RestaurantPage from './pages/RestaurantPage/RestaurantPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import OrdersPage from './pages/OrdersPage/OrdersPage';
import TrackOrderPage from './pages/TrackOrderPage/TrackOrderPage';
import './index.css'; // The CSS file for the layout below

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Navbar setCartOpen={setCartOpen} />
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;