import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [editForm, setEditForm] = useState({ name: 'Demo User', email: 'demo@example.com', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    
    // Simulate API call
    setTimeout(() => {
      setEditSuccess(true);
      setEditForm(f => ({ ...f, password: '' }));
      setEditLoading(false);
    }, 1000);
  };

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-info">
        <form className="profile-edit-form" onSubmit={handleEditSubmit}>
          <div>
            <label>Name:</label>
            <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" name="password" value={editForm.password} onChange={handleEditChange} placeholder="New password" />
          </div>
          <button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Update Profile'}</button>
          {editError && <div className="profile-edit-error">{editError}</div>}
          {editSuccess && <div className="profile-edit-success">Profile updated!</div>}
        </form>
      </div>
      <h3>Order History</h3>
      <div className="orders-list">
        <div>No orders found.</div>
      </div>
    </div>
  );
};

export default Profile; 