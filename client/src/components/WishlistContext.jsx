import React, { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product) => {
    setWishlist(prev => prev.find(p => p._id === product._id) ? prev : [...prev, product]);
  };

  const removeFromWishlist = (id) => {
    setWishlist(prev => prev.filter(p => p._id !== id));
  };

  
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to parse wishlist from localStorage", e);
        setWishlist([]);
      }
    }
  }, []);



  const toggleWishlist = (product) => {
    setWishlist(prev => prev.find(p => p._id === product._id)
      ? prev.filter(p => p._id !== product._id)
      : [...prev, product]
    );
  };

  const itemCount = wishlist.length;
  const clearWishlist = () => setWishlist([]);


  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}; 