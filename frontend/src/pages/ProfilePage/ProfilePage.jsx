import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { formatPhone } from '../../utils/formatters';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  // Edit Mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState('');

  // Data states
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]);

  // Add Card states
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts
  const [notification, setNotification] = useState(null);

  // Top up modal states
  const [topUpModalCard, setTopUpModalCard] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  const fileInputRef = useRef(null);

  // Initialize edit states when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
    }
  }, [user]);

  // Fetch data
  useEffect(() => {
    if (user && activeTab === 'payments') {
      fetchCards();
    }
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchCards = async () => {
    try {
      const data = await api.getCards();
      setPaymentMethods(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('Name cannot be empty', 'error');
      return;
    }
    try {
      await api.updateProfile({ name: editName, phone: editPhone });
      await refreshUser();
      setIsEditingProfile(false);
      showNotification('Profile updated successfully');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCancelProfile = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
    setIsEditingProfile(false);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!editAddress.trim()) {
      showNotification('Address cannot be empty', 'error');
      return;
    }
    try {
      await api.updateProfile({ address: editAddress });
      await refreshUser();
      setIsEditingAddress(false);
      showNotification('Shipping address updated successfully');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCancelAddress = () => {
    if (user) {
      setEditAddress(user.address || '');
    }
    setIsEditingAddress(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        await api.uploadAvatar(formData);
        await refreshUser();
        showNotification('Avatar updated successfully');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  // Card Number Formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Numbers only
    if (value.length > 16) value = value.slice(0, 16);
    // Add spaces every 4 characters
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  // Expiry formatting (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCardCvv(value);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    const rawNumber = cardNumber.replace(/\s/g, '');
    if (rawNumber.length !== 16) {
      showNotification('Please enter a valid 16-digit card number', 'error');
      return;
    }
    if (cardExpiry.length !== 5) {
      showNotification('Please enter expiry in MM/YY format', 'error');
      return;
    }
    if (cardCvv.length < 3) {
      showNotification('Please enter a valid CVV', 'error');
      return;
    }
    if (!cardHolder.trim()) {
      showNotification('Please enter cardholder name', 'error');
      return;
    }

    try {
      await api.addCard({
        cardNumber: rawNumber,
        expiryDate: cardExpiry,
        cvv: cardCvv
      });
      // Reset fields
      setCardHolder('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      fetchCards();
      showNotification('Card added successfully');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm('Are you sure you want to remove this card?')) {
      try {
        await api.deleteCard(id);
        fetchCards();
        showNotification('Card deleted successfully');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      showNotification('Please enter a valid positive amount', 'error');
      return;
    }
    if (amountNum > 20000) {
      showNotification('Single top up cannot exceed Rs. 20,000', 'error');
      return;
    }
    if ((topUpModalCard.balance || 0) + amountNum > 50000) {
      showNotification(`Top up failed. Max balance cannot exceed 50,000 (Current balance: Rs. ${topUpModalCard.balance || 0})`, 'error');
      return;
    }
    try {
      await api.topUpCard(topUpModalCard._id, amountNum);
      showNotification(`Successfully topped up Rs. ${amountNum.toLocaleString()}`);
      setTopUpModalCard(null);
      setTopUpAmount('');
      fetchCards();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('All password fields are required', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      showNotification('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      showNotification('Successfully logged out');
    }
  };

  if (!user) {
    return <div className="profile-container"><div style={{padding: '100px', textAlign:'center'}}>Please log in to view profile.</div></div>;
  }

  const getAvatarUrl = () => {
    const pic = user.profilePic || user.avatar;
    if (!pic) return null;
    return pic.startsWith('http') ? pic : `http://localhost:5000/${pic.replace(/\\/g, '/')}`;
  };

  return (
    <div className="profile-container">
      {notification && (
        <div className={`profile-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Main Glassmorphic Wrapper */}
      <div className="profile-wrapper">

        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt={user.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar" style={{ backgroundColor: 'var(--color-tandoori)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold' }}>
                  {user.name ? user.name[0].toUpperCase() : '👤'}
                </div>
              )}
              <div className="avatar-overlay" onClick={() => fileInputRef.current.click()}>
                <span>Change Image</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleAvatarChange} 
              />
            </div>
            <h2>{user.name}</h2>
            <p className="sidebar-email">{user.email}</p>
            <span className="member-tag">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {month: 'short', year:'numeric'})}</span>
          </div>

          <nav className="sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Info
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              Payment Methods
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Order History
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Security
            </button>
          </nav>
        </aside>

        {/* DETAILS SECTION */}
        <main className="profile-main-content">

          {/* TAB 1: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="tab-pane">
              <div className="content-card">
                <div className="card-header">
                  <h3>Account Information</h3>
                  {!isEditingProfile && (
                    <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>Edit Details</button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="details-grid">
                    <div className="details-row">
                      <span className="label">Full Name</span>
                      <span className="value">{user.name}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Email Address</span>
                      <span className="value">{user.email}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Phone Number</span>
                      <span className="value">{user.phone || 'Not set'}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="profile-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Saad"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                        placeholder="0000-0000000"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Save Changes</button>
                      <button type="button" className="btn-outline" onClick={handleCancelProfile}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="content-card address-card">
                <div className="card-header">
                  <h3>Shipping Address</h3>
                  {!isEditingAddress && (
                    <button className="btn-secondary" onClick={() => setIsEditingAddress(true)}>Update Address</button>
                  )}
                </div>

                {!isEditingAddress ? (
                  <div className="address-display">
                    <svg width="24" height="24" fill="none" stroke="var(--color-tandoori)" strokeWidth="2" viewBox="0 0 24 24" className="loc-pin">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <p>{user.address || 'No saved address. Add one now!'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="profile-form">
                    <div className="form-group">
                      <label>Delivery Address</label>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Enter full shipping address"
                        rows="3"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Save Address</button>
                      <button type="button" className="btn-outline" onClick={handleCancelAddress}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="tab-pane">
              <div className="payments-grid">

                {/* Visual Digital Card Preview */}
                <div className="card-preview-section">
                  <div className="digital-card">
                    <div className="card-bg-gradient"></div>
                    <div className="digital-card-content">
                      <div className="card-top">
                        <div className="card-chip"></div>
                        <span className="card-network-label">
                          {cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'NaanNow'}
                        </span>
                      </div>

                      <div className="card-middle">
                        <div className="card-number-display">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                      </div>

                      <div className="card-bottom">
                        <div className="card-holder-info">
                          <span className="tiny-label">CARD HOLDER</span>
                          <span className="holder-name-display">{cardHolder.toUpperCase() || (user.name ? user.name.toUpperCase() : 'YOUR NAME')}</span>
                        </div>
                        <div className="card-expiry-info">
                          <span className="tiny-label">EXPIRES</span>
                          <span className="expiry-display">{cardExpiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Payment Form */}
                <div className="content-card add-payment-card">
                  <h3>Add Payment Method</h3>
                  <form onSubmit={handleAddCard} className="profile-form">
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on Card"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        required
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={handleCvvChange}
                          placeholder="•••"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary full-width">Add New Card</button>
                  </form>
                </div>
              </div>

              {/* Saved Cards List */}
              <div className="content-card saved-cards-section">
                <h3>Saved Payment Methods</h3>
                {paymentMethods.length === 0 ? (
                  <p className="no-data">No saved cards found. Add a payment card above.</p>
                ) : (
                  <div className="saved-cards-list">
                    {paymentMethods.map(card => {
                      const brand = card.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard';
                      return (
                      <div key={card._id} className="saved-card-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="card-info-left">
                          <div className={`card-icon-avatar ${brand.toLowerCase()}`}>
                            {brand === 'Visa' ? 'V' : brand === 'Mastercard' ? 'M' : '💳'}
                          </div>
                          <div className="card-digits-details">
                            <span className="card-name-brand">{brand} ending in •••• {card.cardNumber.slice(-4)}</span>
                            <span className="card-expiry-span">Expires {card.expiryDate} • Balance: <strong style={{ color: 'var(--color-tandoori)' }}>Rs. {(card.balance || 0).toLocaleString()}</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }} 
                            onClick={() => { setTopUpModalCard(card); setTopUpAmount(''); }}
                          >
                            💳 Top Up
                          </button>
                          <button className="btn-icon-danger" onClick={() => handleDeleteCard(card._id)} title="Remove Card">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="tab-pane">
              <div className="content-card">
                <h3>Your Order History</h3>

                {/* Desktop-optimized table view */}
                <div className="table-container desktop-orders-table">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td className="order-id-td">{order.orderNumber}</td>
                          <td className="order-date-td">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="order-items-td" title={order.items.map(i => i.name).join(', ')}>
                            {order.items.map(i => i.name).join(', ')}
                          </td>
                          <td className="order-total-td">Rs. {order.totalAmount.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile-optimized order cards view */}
                <div className="mobile-orders-list mobile-only">
                  {orders.map(order => (
                    <div key={order._id} className="mobile-order-card">
                      <div className="mobile-order-header">
                        <span className="mobile-order-id">{order.orderNumber}</span>
                        <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mobile-order-items">{order.items.map(i => i.name).join(', ')}</div>
                      <div className="mobile-order-footer">
                        <span className="mobile-order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="mobile-order-total">Rs. {order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                     <div style={{textAlign: 'center', padding: '20px'}}>No orders found.</div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="tab-pane">
              <div className="content-card">
                <h3>Change Password</h3>
                <form onSubmit={handleChangePassword} className="profile-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">Update Password</button>
                </form>
              </div>

              <div className="content-card danger-zone-card">
                <h3>Danger Zone</h3>
                <p>Logging out deletes temporary session details. Click below to sign out of NaanNow.</p>
                <div className="danger-actions">
                  <button onClick={handleLogout} className="btn-danger">Logout Account</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Top Up Modal Overlay */}
      {topUpModalCard && (
        <div className="address-modal-backdrop" onClick={() => setTopUpModalCard(null)}>
          <div className="address-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>Card Top Up</h3>
              <button className="close-modal-btn" onClick={() => setTopUpModalCard(null)}>&times;</button>
            </div>
            <form onSubmit={handleTopUpSubmit}>
              <div className="address-modal-body" style={{ gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Selected Card</span>
                  <strong style={{ fontSize: '15px' }}>•••• •••• •••• {topUpModalCard.cardNumber.slice(-4)}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--color-tandoori)', marginTop: '2px' }}>
                    Current Balance: Rs. {(topUpModalCard.balance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Top Up Amount (Max Rs. 20,000 per transaction)</label>
                  <input
                    type="number"
                    min="1"
                    max="20000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1000, 2000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px 0', fontSize: '11px' }}
                      onClick={() => setTopUpAmount(amt.toString())}
                    >
                      +Rs. {amt / 1000}k
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                  Maximum overall card balance limit is Rs. 50,000.
                </p>
              </div>

              <div className="address-modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={() => setTopUpModalCard(null)}>Cancel</button>
                <button type="submit" className="modal-save-btn">
                  Confirm Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
