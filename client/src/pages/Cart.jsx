import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../components/CartContext';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const updateQty = (id, qty) => {
    const updated = cart.map(item => item._id === id ? { ...item, qty } : item);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = cart.filter(item => item._id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    setOrderError(null);
    try {
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          product: item._id,
        })),
        shippingAddress: {
          address: '123 Main St',
          city: 'Your City',
          postalCode: '00000',
          country: 'Your Country',
        },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: subtotal,
      };
      await axios.post('http://localhost:5000/api/orders', orderData);
      clearCart();
      setCart([]);
      setOrderSuccess(true);
    } catch (err) {
      setOrderError('Order placement failed.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0) return <div className="cart-empty">Your cart is empty.</div>;

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      <div className="cart-list">
        {cart.map(item => (
          <div className="cart-item" key={item._id}>
            <img src={item.image} alt={item.name} className="cart-item-img" />
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">${item.price.toFixed(2)}</div>
              <select value={item.qty} onChange={e => updateQty(item._id, Number(e.target.value))}>
                {[...Array(item.countInStock).keys()].map(x => (
                  <option key={x+1} value={x+1}>{x+1}</option>
                ))}
              </select>
              <button className="cart-remove-btn" onClick={() => removeItem(item._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div>Subtotal: <span>${subtotal.toFixed(2)}</span></div>
        <button className="cart-checkout-btn" onClick={handlePlaceOrder} disabled={placingOrder}>
          {placingOrder ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
      {orderSuccess && <div className="cart-success">Order placed! Check your profile for order history.</div>}
      {orderError && <div className="cart-error">{orderError}</div>}
    </div>
  );
};

export default Cart; 