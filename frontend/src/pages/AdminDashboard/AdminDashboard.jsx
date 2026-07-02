import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('riders'); // 'riders' | 'managers' | 'customers'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'blocked'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // for Details modal

  // Rejection Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUserEmail, setRejectingUserEmail] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // 1. Authenticate Admin and Load Data
  useEffect(() => {
    const userStr = localStorage.getItem('naannow_currentUser');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    // Load registered users
    const registeredUsers = JSON.parse(localStorage.getItem('naannow_registeredUsers') || '[]');
    setUsers(registeredUsers);

    // Load orders to calculate sales
    const savedOrders = JSON.parse(localStorage.getItem('naannow_orders') || '[]');
    setOrders(savedOrders);
  }, [navigate]);

  // Reset page when tab, filter, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchTerm]);

  // Sync approved manager's restaurant with the global restaurants array
  const handleApproveManagerRestaurant = (manager) => {
    if (manager.role !== 'manager') return;
    
    const savedRes = localStorage.getItem('naannow_restaurants');
    let resList = [];
    if (savedRes) {
      resList = JSON.parse(savedRes);
    }
    
    const exists = resList.some(r => r.name.toLowerCase() === manager.restaurantName.toLowerCase());
    
    if (!exists) {
      const newRestaurantObj = {
        id: Date.now(),
        name: manager.restaurantName,
        cuisine: "Continental • BBQ • Desi",
        rating: 4.8,
        deliveryTime: "25-35 min",
        deliveryFee: "Free Delivery",
        image: manager.cover || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000",
        logo: manager.logo || "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=1167",
        isSuper: true,
        deal: "New Opening!",
        menu: [
          {
            id: 801,
            name: "Premium Special Naan",
            price: 180,
            image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500",
            description: "Soft leavened oven naan baked fresh upon order.",
            category: "Breads"
          },
          {
            id: 802,
            name: "Operations Grill Platter",
            price: 1250,
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500",
            description: "Skewered BBQ chicken pieces with mint dipping sauce.",
            category: "Mains"
          }
        ]
      };
      resList.push(newRestaurantObj);
      localStorage.setItem('naannow_restaurants', JSON.stringify(resList));
    }
  };

  // 2. Action Handlers (Approve / Block / Unblock)
  const handleUpdateStatus = (email, newStatus) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const updatedUser = { ...u, status: newStatus, rejectionReason: '' };
        if (newStatus === 'approved') {
          handleApproveManagerRestaurant(updatedUser);
        }
        return updatedUser;
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    
    if (selectedUser && selectedUser.email.toLowerCase() === email.toLowerCase()) {
      setSelectedUser({ ...selectedUser, status: newStatus, rejectionReason: '' });
    }
  };

  const handleOpenRejectDialog = (email) => {
    setRejectingUserEmail(email);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === rejectingUserEmail.toLowerCase()) {
        return { 
          ...u, 
          status: 'rejected', 
          rejectionReason: rejectionReason.trim() 
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    
    if (selectedUser && selectedUser.email.toLowerCase() === rejectingUserEmail.toLowerCase()) {
      setSelectedUser({ 
        ...selectedUser, 
        status: 'rejected', 
        rejectionReason: rejectionReason.trim() 
      });
    }

    setShowRejectDialog(false);
    setRejectingUserEmail('');
    setRejectionReason('');
  };

  // 3. Stats Computations
  const totalSales = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  const pendingApprovalsCount = users.filter(u => u.status === 'pending' && (u.role === 'rider' || u.role === 'manager')).length;
  const ridersCount = users.filter(u => u.role === 'rider').length;
  const managersCount = users.filter(u => u.role === 'manager').length;
  const customersCount = users.filter(u => u.role === 'customer').length;
  
  const pendingRiders = users.filter(u => u.status === 'pending' && u.role === 'rider').length;
  const pendingManagers = users.filter(u => u.status === 'pending' && u.role === 'manager').length;
  const activeOrdersCount = orders.filter(o => ['Preparing', 'Baking', 'Waiting for Rider', 'Delivering', 'Sent'].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;

  // 4. Filtering Logic
  const filteredUsers = users.filter(u => {
    if (activeTab === 'riders' && u.role !== 'rider') return false;
    if (activeTab === 'managers' && u.role !== 'manager') return false;
    if (activeTab === 'customers' && u.role !== 'customer') return false;

    if (statusFilter !== 'all' && u.status !== statusFilter) return false;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nameMatch = u.name && u.name.toLowerCase().includes(term);
      const emailMatch = u.email && u.email.toLowerCase().includes(term);
      const resMatch = u.restaurantName && u.restaurantName.toLowerCase().includes(term);
      const vehicleMatch = u.vehicleDetails && u.vehicleDetails.toLowerCase().includes(term);
      return nameMatch || emailMatch || resMatch || vehicleMatch;
    }

    return true;
  });

  // Calculate Paginated slice
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleLogout = () => {
    localStorage.removeItem('naannow_currentUser');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        
        {/* Header Section */}
        <div className="admin-header-row">
          <div className="admin-brand-info">
            <span className="admin-badge">Platform Governance</span>
            <h1>NaanNow Admin Control Center</h1>
            <p>Supervise user profiles, rider registrations, restaurant manager accounts, and overall platform metrics.</p>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {/* Analytics Statistics Row */}
        <div className="admin-analytics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="admin-metric-card sales">
            <div className="metric-content">
              <h3>Total Platform Sales</h3>
              <p className="metric-value">Rs. {totalSales.toLocaleString()}</p>
              <span className="metric-desc">From completed order receipts</span>
            </div>
          </div>
          
          <div className="admin-metric-card pending">
            <div className="metric-content">
              <h3>Pending Reviews</h3>
              <p className="metric-value">{pendingApprovalsCount}</p>
              <span className="metric-desc">
                {pendingRiders} Riders | {pendingManagers} Managers
              </span>
            </div>
          </div>

          <div className="admin-metric-card orders-stats">
            <div className="metric-content">
              <h3>Platform Deliveries</h3>
              <p className="metric-value">{orders.length}</p>
              <span className="metric-desc">
                {activeOrdersCount} Active | {completedOrdersCount} Done
              </span>
            </div>
          </div>

          <div className="admin-metric-card users-breakdown">
            <div className="metric-content">
              <h3>Platform Accounts</h3>
              <p className="metric-value">{users.length}</p>
              <div className="breakdown-pills">
                <span className="pill riders">Riders: {ridersCount}</span>
                <span className="pill managers">Managers: {managersCount}</span>
                <span className="pill customers">Customers: {customersCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Segment */}
        <div className="admin-controls-card">
          <div className="search-bar-wrapper">
            <input 
              type="text" 
              placeholder="Search by name, email, phone, restaurant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls-row">
            <div className="filter-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All States</option>
                <option value="unverified">Unverified Profile</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="blocked">Suspended / Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-navigation-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'riders' ? 'active' : ''}`}
            onClick={() => setActiveTab('riders')}
          >
            Riders ({ridersCount})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'managers' ? 'active' : ''}`}
            onClick={() => setActiveTab('managers')}
          >
            Managers ({managersCount})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers ({customersCount})
          </button>
        </div>

        {/* Directory Listings Table */}
        <div className="admin-table-container">
          {paginatedUsers.length === 0 ? (
            <div className="admin-empty-state">
              <h3>No matching users found</h3>
              <p>Try modifying your search text or removing status filter constraints.</p>
            </div>
          ) : (
            <>
              <table className="admin-directory-table">
                <thead>
                  <tr>
                    <th>Profile Name</th>
                    <th>Contact Info</th>
                    {activeTab === 'riders' && <th>Vehicle</th>}
                    {activeTab === 'riders' && <th>License Plate</th>}
                    {activeTab === 'managers' && <th>Restaurant</th>}
                    <th>Rating</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.email}>
                      <td>
                        <div className="name-column">
                          <div className={`avatar-circle ${user.role}`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="user-name">{user.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="email-lbl" style={{ fontWeight: '500' }}>{user.email}</span>
                          <span style={{ fontSize: '11px', color: '#999' }}>{user.phone || 'N/A'}</span>
                        </div>
                      </td>
                      {activeTab === 'riders' && <td>{user.vehicleDetails || 'N/A'}</td>}
                      {activeTab === 'riders' && <td><code className="plate-badge">{user.licensePlate || 'N/A'}</code></td>}
                      {activeTab === 'managers' && <td><span className="restaurant-badge-lbl">{user.restaurantName || 'N/A'}</span></td>}
                      <td>
                        <span className="rating-pill">
                          {user.rating || '4.5'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status || 'approved'}`}>
                          {user.status === 'unverified' && 'Unverified'}
                          {user.status === 'pending' && 'Pending Review'}
                          {user.status === 'approved' && 'Approved'}
                          {user.status === 'rejected' && 'Rejected'}
                          {user.status === 'blocked' && 'Blocked'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell-wrapper">
                          <button className="btn-detail-view" onClick={() => setSelectedUser(user)}>
                            Check Details
                          </button>
                          {user.role !== 'customer' && (
                            <>
                              {user.status === 'pending' && (
                                <>
                                  <button className="btn-table-approve" onClick={() => handleUpdateStatus(user.email, 'approved')}>
                                    Approve
                                  </button>
                                  <button className="btn-table-block" style={{ borderColor: '#f59e0b', color: '#d97706' }} onClick={() => handleOpenRejectDialog(user.email)}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {user.status === 'approved' && (
                                <button className="btn-table-block" onClick={() => handleUpdateStatus(user.email, 'blocked')}>
                                  Block
                                </button>
                              )}
                              {user.status === 'blocked' && (
                                <button className="btn-table-unblock" onClick={() => handleUpdateStatus(user.email, 'approved')}>
                                  Unblock
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination-row">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} records)
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Details View Modal Overlay */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-content" style={{ maxWidth: selectedUser.role === 'customer' ? '580px' : '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Account Profile: {selectedUser.name}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '78vh' }}>
              <div className="modal-avatar-header" style={{ marginBottom: '10px' }}>
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="Avatar" className="modal-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className={`modal-avatar ${selectedUser.role}`}>
                    {selectedUser.name ? selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                )}
                <h2>{selectedUser.name}</h2>
                <span className={`role-tag ${selectedUser.role}`}>{selectedUser.role.toUpperCase()}</span>
              </div>

              {selectedUser.status === 'rejected' && (
                <div style={{ padding: '12px 18px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '13px' }}>
                  <strong>Rejection reason:</strong> "{selectedUser.rejectionReason || 'Documents incorrect'}"
                </div>
              )}

              <div className="details-fields-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div className="detail-item">
                  <span className="field-title">Email Address</span>
                  <span className="field-val">{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <span className="field-title">Phone Number</span>
                  <span className="field-val">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="field-title">Status</span>
                  <span className={`status-badge ${selectedUser.status || 'approved'}`} style={{ width: 'fit-content' }}>
                    {selectedUser.status === 'unverified' && 'Unverified Profile'}
                    {selectedUser.status === 'pending' && 'Pending Review'}
                    {selectedUser.status === 'approved' && 'Approved'}
                    {selectedUser.status === 'rejected' && 'Rejected'}
                    {selectedUser.status === 'blocked' && 'Blocked'}
                  </span>
                </div>

                {selectedUser.role === 'rider' && (
                  <>
                    <div className="detail-item">
                      <span className="field-title">Date of Birth</span>
                      <span className="field-val">{selectedUser.dob || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Home Address</span>
                      <span className="field-val">{selectedUser.address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">CNIC Number</span>
                      <span className="field-val">{selectedUser.cnicNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">License Number</span>
                      <span className="field-val">{selectedUser.licenseNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Bike Registration Plate</span>
                      <span className="field-val"><code>{selectedUser.bikeRegistration || selectedUser.licensePlate || 'N/A'}</code></span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Bike Model & Color</span>
                      <span className="field-val">
                        {selectedUser.bikeModel || selectedUser.vehicleDetails || 'Honda CD70'} ({selectedUser.bikeColor || 'Red'})
                      </span>
                    </div>
                  </>
                )}

                {selectedUser.role === 'manager' && (
                  <>
                    <div className="detail-item">
                      <span className="field-title">Owner CNIC Number</span>
                      <span className="field-val">{selectedUser.cnicNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Restaurant Name</span>
                      <span className="field-val">{selectedUser.restaurantName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">City</span>
                      <span className="field-val">{selectedUser.city || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Restaurant Address</span>
                      <span className="field-val">{selectedUser.restaurantAddress || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="field-title">Restaurant Contact</span>
                      <span className="field-val">{selectedUser.restaurantPhone || 'N/A'} | {selectedUser.restaurantEmail || 'N/A'}</span>
                    </div>
                    {selectedUser.mapsLocation && (
                      <div className="detail-item">
                        <span className="field-title">Google Maps Link</span>
                        <a href={selectedUser.mapsLocation} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--color-tandoori)', textDecoration: 'underline' }}>View Maps</a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Uploaded Documents Image Previews Grid */}
              {selectedUser.role !== 'customer' && selectedUser.status !== 'unverified' && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-roasted)' }}>Uploaded Verification Documents:</h4>
                  
                  {selectedUser.role === 'rider' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {selectedUser.cnicFront && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>CNIC Front Image:</span>
                          <img src={selectedUser.cnicFront} alt="CNIC Front" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.cnicBack && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>CNIC Back Image:</span>
                          <img src={selectedUser.cnicBack} alt="CNIC Back" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.licenseImage && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Driving License Image:</span>
                          <img src={selectedUser.licenseImage} alt="Driving License" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedUser.role === 'manager' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      {selectedUser.logo && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Restaurant Logo:</span>
                          <img src={selectedUser.logo} alt="Logo" style={{ width: '100%', height: '100px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #ddd', padding: '6px' }} />
                        </div>
                      )}
                      {selectedUser.cover && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Cover Banner:</span>
                          <img src={selectedUser.cover} alt="Cover" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.photoFront && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Front View Photo:</span>
                          <img src={selectedUser.photoFront} alt="Front View" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.photoKitchen && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Kitchen Photo:</span>
                          <img src={selectedUser.photoKitchen} alt="Kitchen" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.certDoc && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Registration Cert:</span>
                          <img src={selectedUser.certDoc} alt="Certificate" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                      {selectedUser.licenseDoc && (
                        <div>
                          <span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '4px' }}>Food License Document:</span>
                          <img src={selectedUser.licenseDoc} alt="Food License" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #ddd' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bank Details section */}
              {selectedUser.role !== 'customer' && selectedUser.status !== 'unverified' && selectedUser.bankName && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-roasted)' }}>Bank Settlement Details:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Bank:</strong> {selectedUser.bankName}</div>
                    {selectedUser.holderName && <div><strong>Holder:</strong> {selectedUser.holderName}</div>}
                    <div><strong>Account/IBAN:</strong> <code>{selectedUser.accountNumber}</code></div>
                    {selectedUser.walletNumber && <div><strong>Wallet (EP/JC):</strong> {selectedUser.walletNumber}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-actions-row">
                {selectedUser.role !== 'customer' ? (
                  <>
                    {selectedUser.status === 'pending' && (
                      <>
                        <button className="btn-modal-approve" onClick={() => handleUpdateStatus(selectedUser.email, 'approved')}>
                          Approve Profile
                        </button>
                        <button className="btn-modal-block" style={{ backgroundColor: '#f59e0b' }} onClick={() => handleOpenRejectDialog(selectedUser.email)}>
                          Reject Documents
                        </button>
                      </>
                    )}
                    {selectedUser.status === 'approved' && (
                      <button className="btn-modal-block" onClick={() => handleUpdateStatus(selectedUser.email, 'blocked')}>
                        Suspend / Block Account
                      </button>
                    )}
                    {selectedUser.status === 'blocked' && (
                      <button className="btn-modal-unblock" onClick={() => handleUpdateStatus(selectedUser.email, 'approved')}>
                        Reactivate Account
                      </button>
                    )}
                    {selectedUser.status === 'rejected' && (
                      <span style={{ fontSize: '12px', color: '#ef4444', marginRight: 'auto', fontWeight: '600' }}>Waiting for correction resubmission.</span>
                    )}
                  </>
                ) : (
                  <span className="customer-info-note">Customer accounts do not require manual verification checks.</span>
                )}
                <button className="btn-modal-close" onClick={() => setSelectedUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Modal Overlay */}
      {showRejectDialog && (
        <div className="admin-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="admin-modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Specify Rejection Reason</h3>
              <button className="modal-close-btn" onClick={() => setShowRejectDialog(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ gap: '12px' }}>
              <p style={{ fontSize: '13px', color: '#666' }}>Enter the details of the rejection reason. The user will be requested to re-upload these exact items immediately on dashboard access.</p>
              <textarea 
                rows="4"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(79, 46, 29, 0.15)', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                placeholder="e.g. CNIC Front image is blurry or expired. Please upload a clear photo."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-modal-close" onClick={() => setShowRejectDialog(false)}>Cancel</button>
              <button className="btn-modal-block" onClick={handleConfirmReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
