import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Header from './components/Header';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import { CartProvider } from './components/CartContext';
import Chatbot from './components/Chatbot'; // Import the chatbot
import { WishlistProvider } from './components/WishlistContext';
import './App.css'
import './components/Chatbot.css'; // Import chatbot CSS
import Wishlist from './pages/Wishlist';
import { Navigate } from 'react-router-dom';

const App = () => (
  <CartProvider>
    <WishlistProvider>
      <Router>
        <Header />
        <Chatbot /> {/* Add the chatbot component here */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          {/* if route not found, then show the site not found error of the browser */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WishlistProvider>
  </CartProvider>
);

export default App;
