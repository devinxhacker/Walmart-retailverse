import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i._id === item._id);
      if (exists) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...item, qty }];
    });
  };

  const updateQty = (id, qty) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i._id !== id));
  };

  const clearCart = () => setCart([]);

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}; 