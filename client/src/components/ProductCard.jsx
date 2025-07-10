import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from './WishlistContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const isWished = wishlist.some(p => p._id === product._id);

  return (
    <div className="product-card-wrapper">
      <div className="product-card">
        <Link to={`/product/${product._id}`} className="product-card-link">
          <div className="product-image-container">
            <img src={product.image} alt={product.name} className="product-image" />
            <button
              className={`wishlist-heart-btn${isWished ? ' wished' : ''}`}
              onClick={e => { e.preventDefault(); toggleWishlist(product); }}
              title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWished ? '♥' : '♡'}
            </button>
          </div>
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <div className="product-price">${product.price.toFixed(2)}</div>
            <div className="product-rating">
              <span>⭐ {product.rating}</span>
              <span className="product-reviews">({product.numReviews})</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard; 