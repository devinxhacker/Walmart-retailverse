import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const WalmartLogoSVG = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <text x="0" y="28" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#ffc220">Walmart</text>
      <g>
        <circle cx="110" cy="20" r="6" fill="#ffc220" />
        <circle cx="110" cy="8" r="2" fill="#ffc220" />
        <circle cx="110" cy="32" r="2" fill="#ffc220" />
        <circle cx="120" cy="20" r="2" fill="#ffc220" />
        <circle cx="100" cy="20" r="2" fill="#ffc220" />
        <circle cx="117.2" cy="12.8" r="2" fill="#ffc220" />
        <circle cx="117.2" cy="27.2" r="2" fill="#ffc220" />
        <circle cx="102.8" cy="12.8" r="2" fill="#ffc220" />
        <circle cx="102.8" cy="27.2" r="2" fill="#ffc220" />
      </g>
    </g>
  </svg>
);

const Header = () => {
  return (
    <header className="wm-header">
      <div className="wm-header-left">
        <Link to="/" className="wm-logo-link"><WalmartLogoSVG /></Link>
        <div className="wm-location">
          <svg width="18" height="18" fill="#ffc220" viewBox="0 0 24 24"><path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.11 10.61 7.41 10.82.36.25.82.25 1.18 0C13.89 21.61 21 16.25 21 11c0-4.97-4.03-9-9-9zm0 18.54C9.14 18.09 5 14.36 5 11c0-3.87 3.13-7 7-7s7 3.13 7 7c0 3.36-4.14 7.09-7 9.54z"/><circle cx="12" cy="11" r="2.5"/></svg>
          <span className="wm-location-text">How do you want your items?</span>
        </div>
      </div>
      <form className="wm-search-bar">
        <input type="text" placeholder="Search Walmart.com" className="wm-search-input" />
        <button type="submit" className="wm-search-btn">
          <svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99a1 1 0 001.41-1.41l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"/></svg>
        </button>
      </form>
      <nav className="wm-header-nav">
        <Link to="/profile" className="wm-header-link">Profile</Link>
        <Link to="/admin" className="wm-header-link">Admin</Link>
        <Link to="/cart" className="wm-header-link">
          <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14.26l.03-.12L7.9 12h8.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0020.5 4h-16l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 14.37 5.48 16 7 16h12v-2H7.42c-.14 0-.25-.11-.26-.25z"/></svg>
          <span className="wm-header-label">Cart</span>
        </Link>
        <Link to="/wishlist" className="wm-header-link">
          <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span className="wm-header-label">Wishlist</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
