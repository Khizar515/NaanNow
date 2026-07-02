import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import './index.css';
import App from './App.jsx';

import { CartProvider } from './components/Context/CartContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <Router>
        <App />
      </Router>
    </CartProvider>
  </StrictMode>
);