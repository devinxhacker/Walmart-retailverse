import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductDetails.css';
import { useWishlist } from '../components/WishlistContext';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const isWished = product && wishlist.some(p => p._id === product._id);
  const [textto3d, setTextTo3D] = useState("See 3D View");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(data);
        // Fetch related products (same category, exclude current)
        const res = await axios.get('http://localhost:5000/api/products');
        setRelated(res.data.filter(p => p._id !== data._id && p.category === data.category).slice(0, 4));
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const exists = cart.find(item => item._id === product._id);
    if (exists) {
      exists.qty += qty;
    } else {
      cart.push({ ...product, qty });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  const handle3DView = async () => {
    // Generate a unique model filename from the image URL (base64 or hash)
    const btn3d = document.getElementById("btn3d");
    btn3d.disabled = true;
    btn3d.classList.add("loading");
    setTextTo3D("Loading...");

    const imageUrl = product.image;
    console.log('Image URL:', imageUrl);
    const modelName = btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) + '.glb';
    console.log('Model Name:', modelName);

    const modelPath = `/models/${modelName}`;
    const modelUrl = `${window.location.origin}/models/${modelName}`;

    // 1. Check if model already exists
      try {
        const checkRes = await fetch(`http://localhost:5000/api/model-exists/${modelName}`);
        const checkData = await checkRes.json();
        if (checkData.exists) {
          // Model exists, redirect to viewer
          setTextTo3D("Open 3D View...");
          // window.location.href = `/model-ar/index.html?model=${modelName}`;
          window.open(`${window.location.origin}/model-ar/index.html?model=${modelName}`, '_blank');
          console.log('Model already exists:', modelUrl);
          btn3d.disabled = false;
          btn3d.classList.remove("loading");
          return;
        }
      } catch (e) {
        // Continue to generation if not found
      }

    // 2. Request backend to generate and save the model
    try {
      // POST to backend endpoint (to be implemented) to generate and save model
      setTextTo3D("Generating 3D Model...");
      const genRes = await fetch('http://localhost:5000/api/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, modelName })
      });
      if (!genRes.ok) { 
        setTextTo3D("Try Again Later");
        btn3d.disabled = false;
        btn3d.classList.remove("loading");
        throw new Error('Failed to generate 3D model'); 
      }
      // Redirect to viewer after successful generation
      setTextTo3D("Open 3D View...");
      // window.location.href = `/model-ar/index.html?model=${modelName}`;
      window.open(`${window.location.origin}/model-ar/index.html?model=${modelName}`, '_blank');
      console.log('3D model generated successfully:', modelUrl);
      btn3d.disabled = false;
      btn3d.classList.remove("loading");
    } catch (err) {
      alert('Failed to generate 3D model. Please try again later.');
      console.error('Error generating 3D model:', err);
      setTextTo3D("Try Again Later");
      btn3d.disabled = false;
      btn3d.classList.remove("loading");
    }
  };

  if (loading) return <div className="details-loading">Loading...</div>;
  if (error) return <div className="details-error">{error}</div>;

  return (
    <div className="wm-details-page">
      <div className="wm-details-main-card">
        <div className="wm-details-image-col">
          <img src={product.image} alt={product.name} className="wm-details-image" />
        </div>
        <div className="wm-details-info-col">
          <h2 className="wm-details-title">{product.name}
            <button className={`wishlist-heart-btn details-heart${isWished ? ' wished' : ''}`} onClick={() => toggleWishlist(product)} title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}>
              {isWished ? '♥' : '♡'}
            </button>
          </h2>
          <div className="wm-details-price">${product.price.toFixed(2)}</div>
          <div className="wm-details-desc">{product.description}</div>
          <div className="wm-details-stock">{product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}</div>
          {product.countInStock > 0 && (
            <div className="wm-details-actions-row">
              <label>Qty: </label>
              <select value={qty} onChange={e => setQty(Number(e.target.value))}>
                {[...Array(product.countInStock).keys()].map(x => (
                  <option key={x+1} value={x+1}>{x+1}</option>
                ))}
              </select>
              <button className="add-cart-btn wm-details-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
              <button id="btn3d" className="wm-details-3d-btn" onClick={handle3DView}>{textto3d}</button>
            </div>
          )}
        </div>
      </div>
      <div className="wm-details-related-section">
        <h3>Related Products</h3>
        <div className="wm-details-related-grid">
          {related.length === 0 ? <div className="wm-details-no-related">No related products found.</div> :
            related.map(prod => <ProductCard key={prod._id} product={prod} />)
          }
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;