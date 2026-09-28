import { createContext, useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const isInitialMount = useRef(true);

  // Sync state when user changes (login / logout)
  useEffect(() => {
    if (user) {
      // User logged in — prefer user document from DB, fallback to user localStorage
      const userCart = user.cart && user.cart.length > 0 
        ? user.cart 
        : (() => {
            try {
              const saved = localStorage.getItem(`naannow_cart_${user._id}`);
              return saved ? JSON.parse(saved) : [];
            } catch (e) { return []; }
          })();

      const userFavs = user.favorites && user.favorites.length > 0
        ? user.favorites
        : (() => {
            try {
              const saved = localStorage.getItem(`naannow_favorites_${user._id}`);
              return saved ? JSON.parse(saved) : [];
            } catch (e) { return []; }
          })();

      setCartItems(userCart);
      setFavorites(userFavs);
    } else {
      // Guest / Logged out user
      try {
        const guestCart = localStorage.getItem('naannow_cart_guest');
        const guestFavs = localStorage.getItem('naannow_favorites_guest');
        setCartItems(guestCart ? JSON.parse(guestCart) : []);
        setFavorites(guestFavs ? JSON.parse(guestFavs) : []);
      } catch (e) {
        setCartItems([]);
        setFavorites([]);
      }
    }
  }, [user]);

  // Helper to persist cart items
  const persistCart = (newCartItems) => {
    setCartItems(newCartItems);
    if (user) {
      localStorage.setItem(`naannow_cart_${user._id}`, JSON.stringify(newCartItems));
      api.updateProfile({ cart: newCartItems }).catch(err => console.error("Failed to sync cart to DB:", err));
    } else {
      localStorage.setItem('naannow_cart_guest', JSON.stringify(newCartItems));
    }
  };

  // Helper to persist favorites
  const persistFavorites = (newFavs) => {
    setFavorites(newFavs);
    if (user) {
      localStorage.setItem(`naannow_favorites_${user._id}`, JSON.stringify(newFavs));
      api.updateProfile({ favorites: newFavs }).catch(err => console.error("Failed to sync favorites to DB:", err));
    } else {
      localStorage.setItem('naannow_favorites_guest', JSON.stringify(newFavs));
    }
  };

  // Add to Cart with 1-restaurant constraint check
  const addToCart = (item, forceReplace = false) => {
    if (forceReplace) {
      const newCart = [{ ...item, quantity: 1 }];
      persistCart(newCart);
      return { success: true };
    }

    if (cartItems.length > 0) {
      const firstResId = cartItems[0].restaurantId;
      if (firstResId && item.restaurantId && String(firstResId) !== String(item.restaurantId)) {
        return {
          conflict: true,
          existingRestaurantName: cartItems[0].restaurantName || 'another restaurant'
        };
      }
    }

    const existingIndex = cartItems.findIndex(cartItem => String(cartItem._id) === String(item._id));
    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = cartItems.map((cartItem, idx) =>
        idx === existingIndex ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
    } else {
      updatedCart = [...cartItems, { ...item, quantity: 1 }];
    }

    persistCart(updatedCart);
    return { success: true };
  };

  const increaseQuantity = (id) => {
    const updatedCart = cartItems.map(item =>
      String(item._id) === String(id) ? { ...item, quantity: item.quantity + 1 } : item
    );
    persistCart(updatedCart);
  };

  const decreaseQuantity = (id) => {
    const updatedCart = cartItems
      .map(item => String(item._id) === String(id) ? { ...item, quantity: item.quantity - 1 } : item)
      .filter(item => item.quantity > 0);
    persistCart(updatedCart);
  };

  const toggleFavorite = (id) => {
    const isFav = favorites.includes(id);
    const updatedFavs = isFav ? favorites.filter(favId => favId !== id) : [...favorites, id];
    persistFavorites(updatedFavs);
  };

  const clearFavorites = () => {
    persistFavorites([]);
  };

  const clearCart = () => {
    persistCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        favorites,
        toggleFavorite,
        clearFavorites,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};