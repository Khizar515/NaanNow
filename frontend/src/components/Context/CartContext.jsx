import { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {

  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('naannow_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load favorites", e);
      return [];
    }
  });

  const addToCart = (item) => {
    setCartItems(prev => {
      const existingItem = prev.find(
        cartItem => cartItem._id === item._id
      );

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem._id === item._id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1
            }
            : cartItem
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1
        }
      ];
    });
  };

  const increaseQuantity = (id) => {
    setCartItems(prev =>
      prev.map(item =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item._id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter(favId => favId !== id) : [...prev, id];
      localStorage.setItem('naannow_favorites', JSON.stringify(next));
      return next;
    });
  };

  const clearCart = () => {
    setCartItems([]);
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
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};