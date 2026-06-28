import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');

  // Profile State
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('naannow_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Muhammad Saad',
      email: 'muhammad.saad@example.com',
      phone: '+92 300 1234567',
      address: 'House 45, Street 11, Sector F-11/1, Islamabad',
      profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      memberSince: 'September 2024'
    };
  });

  // Edit Mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editProfilePic, setEditProfilePic] = useState(profile.profilePic);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState(profile.address);

  // Cards state
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('naannow_payment_methods');
    return saved ? JSON.parse(saved) : [
      { id: 1, holder: 'Muhammad Saad', lastFour: '4321', expMonth: '12', expYear: '28', brand: 'Visa' },
      { id: 2, holder: 'Muhammad Saad', lastFour: '8765', expMonth: '06', expYear: '29', brand: 'Mastercard' }
    ];
  });

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

  // Save profile to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('naannow_profile', JSON.stringify(profile));
  }, [profile]);

  // Save payment methods when they change
  useEffect(() => {
    localStorage.setItem('naannow_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('Name cannot be empty', 'error');
      return;
    }
    setProfile(prev => ({
      ...prev,
      name: editName,
      phone: editPhone,
      profilePic: editProfilePic
    }));
    setIsEditingProfile(false);
    showNotification('Profile updated successfully');
  };

  const handleCancelProfile = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditProfilePic(profile.profilePic);
    setIsEditingProfile(false);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!editAddress.trim()) {
      showNotification('Address cannot be empty', 'error');
      return;
    }
    setProfile(prev => ({
      ...prev,
      address: editAddress
    }));
    setIsEditingAddress(false);
    showNotification('Shipping address updated successfully');
  };

  const handleCancelAddress = () => {
    setEditAddress(profile.address);
    setIsEditingAddress(false);
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

  const handleAddCard = (e) => {
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

    const [month, year] = cardExpiry.split('/');
    const lastFour = rawNumber.slice(-4);
    const brand = rawNumber.startsWith('4') ? 'Visa' : rawNumber.startsWith('5') ? 'Mastercard' : 'Express';

    const newCard = {
      id: Date.now(),
      holder: cardHolder,
      lastFour,
      expMonth: month,
      expYear: year,
      brand
    };

    setPaymentMethods(prev => [...prev, newCard]);

    // Reset fields
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    showNotification('Card added successfully');
  };

  const handleDeleteCard = (id) => {
    if (window.confirm('Are you sure you want to remove this card?')) {
      setPaymentMethods(prev => prev.filter(c => c.id !== id));
      showNotification('Card deleted successfully');
    }
  };

  const handleChangePassword = (e) => {
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
    showNotification('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to log out?')) {
      showNotification('Successfully logged out (Demo mode)');
    }
  };

  const mockOrders = [
    { id: 'NN-1082', date: '24 Jun 2026', status: 'Delivered', items: 'Garlic Naan x2, Cheese Naan x1, Chicken Karahi x1', total: 1850 },
    { id: 'NN-1049', date: '15 Jun 2026', status: 'In Transit', items: 'Tandoori Platter x1, Mint Raita x2, Sprite Can x3', total: 2400 },
    { id: 'NN-0992', date: '02 Jun 2026', status: 'Delivered', items: 'Aloo Naan x3, Lassi x3', total: 1150 }
  ];

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
              <img src={profile.profilePic} alt={profile.name} className="profile-avatar" />
              <div className="avatar-overlay" onClick={() => {
                const url = window.prompt("Enter new Image URL:", profile.profilePic);
                if (url) {
                  setProfile(prev => ({ ...prev, profilePic: url }));
                  setEditProfilePic(url);
                  showNotification('Avatar URL updated!');
                }
              }}>
                <span>Change Image</span>
              </div>
            </div>
            <h2>{profile.name}</h2>
            <p className="sidebar-email">{profile.email}</p>
            <span className="member-tag">Member since {profile.memberSince}</span>
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
                      <span className="value">{profile.name}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Email Address</span>
                      <span className="value">{profile.email}</span>
                    </div>
                    <div className="details-row">
                      <span className="label">Phone Number</span>
                      <span className="value">{profile.phone || 'Not set'}</span>
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
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Avatar URL</label>
                      <input
                        type="text"
                        value={editProfilePic}
                        onChange={(e) => setEditProfilePic(e.target.value)}
                        placeholder="https://..."
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
                    <p>{profile.address || 'No saved address. Add one now!'}</p>
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
                          <span className="holder-name-display">{cardHolder.toUpperCase() || 'MUHAMMAD SAAD'}</span>
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
                        placeholder="Muhammad Saad"
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
                    {paymentMethods.map(card => (
                      <div key={card.id} className="saved-card-item">
                        <div className="card-info-left">
                          <div className={`card-icon-avatar ${card.brand.toLowerCase()}`}>
                            {card.brand === 'Visa' ? 'V' : card.brand === 'Mastercard' ? 'M' : '💳'}
                          </div>
                          <div className="card-digits-details">
                            <span className="card-name-brand">{card.brand} ending in •••• {card.lastFour}</span>
                            <span className="card-expiry-span">Expires {card.expMonth}/{card.expYear} • {card.holder}</span>
                          </div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => handleDeleteCard(card.id)} title="Remove Card">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
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
                      {mockOrders.map(order => (
                        <tr key={order.id}>
                          <td className="order-id-td">{order.id}</td>
                          <td className="order-date-td">{order.date}</td>
                          <td className="order-items-td" title={order.items}>{order.items}</td>
                          <td className="order-total-td">Rs. {order.total.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile-optimized order cards view */}
                <div className="mobile-orders-list">
                  {mockOrders.map(order => (
                    <div key={order.id} className="mobile-order-card">
                      <div className="mobile-order-header">
                        <span className="mobile-order-id">{order.id}</span>
                        <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mobile-order-items">{order.items}</div>
                      <div className="mobile-order-footer">
                        <span className="mobile-order-date">{order.date}</span>
                        <span className="mobile-order-total">Rs. {order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}

export default ProfilePage;
