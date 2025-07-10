import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Admin.css';

const Admin = () => {
  const [tab, setTab] = useState('users');
  const [form, setForm] = useState({ name: '', image: '', description: '', brand: '', category: '', price: '', countInStock: '' });
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Mock data for users
  const mockUsers = [
    { _id: '1', name: 'John Doe', email: 'john@example.com', isAdmin: true },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isAdmin: false },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', isAdmin: false }
  ];

  // Fetch products from backend
  useEffect(() => {
    if (tab === 'products') {
      fetchProducts();
    }
  }, [tab]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (err) {
      setProductsError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', image: '', description: '', brand: '', category: '', price: '', countInStock: '' });
    setEditingId(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditProduct = (product) => {
    setForm({
      name: product.name,
      image: product.image || '',
      description: product.description || '',
      brand: product.brand || '',
      category: product.category,
      price: product.price,
      countInStock: product.countInStock,
    });
    setEditingId(product._id);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    
    try {
      const productData = {
        ...form,
        price: Number(form.price),
        countInStock: Number(form.countInStock),
      };
      if (editingId) {
        // Update existing product
        const response = await axios.put(`http://localhost:5000/api/products/${editingId}`, productData);
        setProducts(products.map(p => p._id === editingId ? response.data : p));
        setFormSuccess('Product updated successfully!');
      } else {
        // Create new product, ensure rating and numReviews are set
        const response = await axios.post('http://localhost:5000/api/products', {
          ...productData,
          rating: 0,
          numReviews: 0
        });
        setProducts([response.data, ...products]);
        setFormSuccess('Product added successfully!');
      }
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product');
      console.error('Error saving product:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      alert('Product deleted successfully!');
    } catch (err) {
      alert('Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      <div className="admin-tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</button>
      </div>
      {tab === 'users' && (
        <div className="admin-users">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Admin</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? 'Yes' : 'No'}</td>
                  <td>{u._id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'products' && (
        <div className="admin-products">
          <form className="admin-product-form" onSubmit={handleFormSubmit}>
            <input name="name" value={form.name} onChange={handleFormChange} placeholder="Name" required />
            <input name="image" value={form.image} onChange={handleFormChange} placeholder="Image URL" required />
            <input name="description" value={form.description} onChange={handleFormChange} placeholder="Description" required />
            <input name="brand" value={form.brand} onChange={handleFormChange} placeholder="Brand" required />
            <input name="category" value={form.category} onChange={handleFormChange} placeholder="Category" required />
            <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="Price" required />
            <input name="countInStock" type="number" value={form.countInStock} onChange={handleFormChange} placeholder="Stock" required />
            <button type="submit" disabled={formLoading}>{editingId ? 'Update' : 'Add'} Product</button>
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
            {formError && <div className="admin-error">{formError}</div>}
            {formSuccess && <div className="admin-success">{formSuccess}</div>}
          </form>
          {productsLoading ? (
            <div>Loading products...</div>
          ) : productsError ? (
            <div className="admin-error">{productsError}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.countInStock}</td>
                    <td>{product.category}</td>
                    <td>
                      <button className="admin-edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                      <button className="admin-delete-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'orders' && (
        <div className="admin-orders">
          <h3>Orders Management</h3>
          <p>Orders functionality will be implemented here.</p>
        </div>
      )}
    </div>
  );
};

export default Admin; 