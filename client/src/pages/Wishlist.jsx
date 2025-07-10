import React from 'react';
import { useWishlist } from '../components/WishlistContext';
import { useCart } from '../components/CartContext';
import './Wishlist.css';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) return <div className="wishlist-empty">Your wishlist is empty.</div>;

  return (
    <div className="wishlist-container">
      <h2>My Wishlist</h2>
      <div className="wishlist-list">
        {wishlist.map(item => (
          <div className="wishlist-item" key={item._id}>
            <img src={item.image} alt={item.name} className="wishlist-item-img" />
            <div className="wishlist-item-info">
              <div className="wishlist-item-name">{item.name}</div>
              <div className="wishlist-item-price">${item.price.toFixed(2)}</div>
              <button className="wishlist-cart-btn" onClick={() => addToCart(item)}>Add to Cart</button>
              <button className="wishlist-remove-btn" onClick={() => removeFromWishlist(item._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist; 