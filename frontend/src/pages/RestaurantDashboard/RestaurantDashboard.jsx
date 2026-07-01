import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOP_RESTAURANTS } from '../../data/restaurants';
import './RestaurantDashboard.css';

// Quick selection templates for menu items to avoid manual URL input frustration
const IMAGE_TEMPLATES = [
  { name: 'Classic Naan', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80' },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sizzling Kabab / BBQ', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80' },
  { name: 'Alfredo Pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80' },
  { name: 'Decadent Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sparkling Drink', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80' }
];

function RestaurantDashboard() {
  const navigate = useNavigate();

  // State definitions
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Tab: 'orders' | 'menu'
  const [activeTab, setActiveTab] = useState('orders');
  // Order filter: 'all' | 'active' | 'past'
  const [orderFilter, setOrderFilter] = useState('active');
  // Menu Category filter: 'All' | specific
  const [menuFilter, setMenuFilter] = useState('All');

  // Menu Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: IMAGE_TEMPLATES[0].url
  });
  const [formError, setFormError] = useState('');

  // Load baseline data from localStorage
  useEffect(() => {
    // 1. Load Restaurants
    const savedRes = localStorage.getItem('naannow_restaurants');
    let resList = [];
    if (savedRes) {
      resList = JSON.parse(savedRes);
    } else {
      resList = TOP_RESTAURANTS;
      localStorage.setItem('naannow_restaurants', JSON.stringify(TOP_RESTAURANTS));
    }
    setRestaurants(resList);
    
    // Set default selected restaurant to KFC (id: 5)
    if (resList.length > 0) {
      const kfc = resList.find(r => r.id === 5) || resList[0];
      setSelectedRestaurant(kfc);
    }

    // 2. Load Orders
    const savedOrders = localStorage.getItem('naannow_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders([]);
    }
  }, []);

  // Poll for order changes from other customer actions every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const savedOrders = localStorage.getItem('naannow_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handler to update selected restaurant profile
  const handleSelectRestaurant = (id) => {
    const found = restaurants.find(r => r.id === parseInt(id));
    if (found) {
      setSelectedRestaurant(found);
      setSelectedOrderId(null);
      setMenuFilter('All');
    }
  };

  if (!selectedRestaurant) {
    return <div className="dashboard-loading">Loading portal configurations...</div>;
  }

  // Filter orders for the selected restaurant
  const restaurantOrders = orders.filter(o => o.restaurantId === selectedRestaurant.id || (!o.restaurantId && selectedRestaurant.id === 1));

  // Compute Metrics
  const completedOrders = restaurantOrders.filter(o => o.status === 'Completed');
  const activeOrdersCount = restaurantOrders.filter(o => ['Preparing', 'Baking', 'Waiting for Rider', 'Delivering', 'Sent'].includes(o.status)).length;
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Compute Menu Popularity distribution for dashboard chart based on ordered items
  const categorySales = {};
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      // Find category of item from menu
      const menuItem = selectedRestaurant.menu.find(m => m.id === item.id);
      const cat = menuItem ? menuItem.category : 'General';
      categorySales[cat] = (categorySales[cat] || 0) + item.quantity;
    });
  });

  const maxSales = Math.max(...Object.values(categorySales), 1);

  // Filtered orders list based on sub-tab
  const filteredOrders = restaurantOrders.filter(order => {
    if (orderFilter === 'active') {
      return ['Preparing', 'Baking', 'Waiting for Rider', 'Delivering', 'Sent'].includes(order.status);
    }
    if (orderFilter === 'past') {
      return order.status === 'Completed';
    }
    return true; // 'all'
  });

  // Selected Order
  const activeOrder = filteredOrders.find(o => o.id === selectedOrderId) || filteredOrders[0];

  // Advance Order Lifecycle status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const up = { ...o, status: newStatus, isManual: true };
        if (newStatus === 'Delivering' || newStatus === 'Sent') {
          up.dispatchedAt = new Date().toISOString();
        }
        return up;
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
  };

  // Get next step info based on current status
  const getNextStatusConfig = (status) => {
    switch (status) {
      case 'Preparing':
        return { label: '🍳 Confirm Order & Bake', next: 'Baking', class: 'btn-prepare' };
      case 'Baking':
        return { label: '📦 Mark Ready (Wait for Rider)', next: 'Waiting for Rider', class: 'btn-ready' };
      case 'Waiting for Rider':
        return { label: '🛵 Dispatch Order (Rider Departed)', next: 'Delivering', class: 'btn-dispatch' };
      case 'Delivering':
      case 'Sent':
        return { label: '🏁 Mark as Delivered & Complete', next: 'Completed', class: 'btn-complete' };
      default:
        return null;
    }
  };

  // MENU CRUD: Open Modal
  const openMenuModal = (mode, item = null) => {
    setModalMode(mode);
    setEditingItem(item);
    setFormError('');
    if (mode === 'edit' && item) {
      setMenuForm({
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        image: item.image
      });
    } else {
      setMenuForm({
        name: '',
        price: '',
        category: selectedRestaurant.menu[0]?.category || 'Naan',
        description: '',
        image: IMAGE_TEMPLATES[0].url
      });
    }
    setIsModalOpen(true);
  };

  // MENU CRUD: Save / Submit
  const handleSaveMenuItem = (e) => {
    e.preventDefault();
    setFormError('');

    const { name, price, category, description, image } = menuForm;
    if (!name.trim() || !price || !category.trim() || !description.trim()) {
      setFormError('Please fill in all details.');
      return;
    }

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price (greater than 0).');
      return;
    }

    let updatedMenu = [...selectedRestaurant.menu];

    if (modalMode === 'add') {
      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 100),
        name: name.trim(),
        price: priceNum,
        image: image || IMAGE_TEMPLATES[0].url,
        description: description.trim(),
        category: category.trim()
      };
      updatedMenu.push(newItem);
    } else if (modalMode === 'edit' && editingItem) {
      updatedMenu = updatedMenu.map(m => {
        if (m.id === editingItem.id) {
          return {
            ...m,
            name: name.trim(),
            price: priceNum,
            image,
            description: description.trim(),
            category: category.trim()
          };
        }
        return m;
      });
    }

    const updatedRestaurantList = restaurants.map(r => {
      if (r.id === selectedRestaurant.id) {
        const u = { ...r, menu: updatedMenu };
        // Sync local selected profile view
        setSelectedRestaurant(u);
        return u;
      }
      return r;
    });

    setRestaurants(updatedRestaurantList);
    localStorage.setItem('naannow_restaurants', JSON.stringify(updatedRestaurantList));
    setIsModalOpen(false);
  };

  // MENU CRUD: Delete Item
  const handleDeleteMenuItem = (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the restaurant menu?')) {
      return;
    }

    const updatedMenu = selectedRestaurant.menu.filter(m => m.id !== itemId);
    const updatedRestaurantList = restaurants.map(r => {
      if (r.id === selectedRestaurant.id) {
        const u = { ...r, menu: updatedMenu };
        setSelectedRestaurant(u);
        return u;
      }
      return r;
    });

    setRestaurants(updatedRestaurantList);
    localStorage.setItem('naannow_restaurants', JSON.stringify(updatedRestaurantList));
  };

  // Categories list for menu display
  const menuCategories = ['All', ...new Set(selectedRestaurant.menu.map(m => m.category))];
  const filteredMenuItems = selectedRestaurant.menu.filter(item => {
    return menuFilter === 'All' || item.category === menuFilter;
  });

  return (
    <div className="restaurant-portal-container">
      {/* 1. Header Banner */}
      <div 
        className="portal-header" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 100%), url(${selectedRestaurant.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="portal-meta-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img src={selectedRestaurant.image} alt={`${selectedRestaurant.name} Cover`} className="portal-logo-img" />
          <div className="portal-meta">
            <div className="portal-badge">🏪 Manager View</div>
            <h1>{selectedRestaurant.name} Operations Hub</h1>
            <p>Real-time orders queue and menu adjustments</p>
          </div>
        </div>

        {/* Static Restaurant Label (KFC Exclusive) */}
        <div className="restaurant-selector-wrapper">
          <span className="managing-label">Managing Venue:</span>
          <div className="managing-venue-badge">
            <span className="venue-logo">🍗</span> {selectedRestaurant.name}
          </div>
        </div>
      </div>

      {/* 2. Top-level Analytics Metrics */}
      <div className="analytics-grid">
        <div className="metric-card sales">
          <div className="card-header">
            <span className="card-title">Total Revenue</span>
            <span className="card-icon">💰</span>
          </div>
          <div className="card-value">Rs. {totalRevenue.toLocaleString()}</div>
          <div className="card-description">From completed deliveries</div>
        </div>

        <div className="metric-card orders">
          <div className="card-header">
            <span className="card-title">Total Orders</span>
            <span className="card-icon">📥</span>
          </div>
          <div className="card-value">{restaurantOrders.length}</div>
          <div className="card-description">All-time order count</div>
        </div>

        <div className="metric-card active-jobs">
          <div className="card-header">
            <span className="card-title">Active Orders</span>
            <span className="card-icon">⏳</span>
          </div>
          <div className="card-value glow-green">{activeOrdersCount}</div>
          <div className="card-description">Currently in tandoor or transit</div>
        </div>

        <div className="metric-card aov">
          <div className="card-header">
            <span className="card-title">Avg Order Value (AOV)</span>
            <span className="card-icon">📊</span>
          </div>
          <div className="card-value">Rs. {aov}</div>
          <div className="card-description">Per completed receipt</div>
        </div>
      </div>

      {/* Dashboard Visual Charts */}
      {completedOrders.length > 0 && (
        <div className="visuals-row">
          <div className="visual-card">
            <h3>🔥 Popular Menu Categories</h3>
            <p className="subtitle">Visual representation of items sold from completed tickets</p>
            <div className="bars-chart-container">
              {Object.keys(categorySales).map(cat => {
                const qty = categorySales[cat];
                const percentage = Math.round((qty / maxSales) * 100);
                return (
                  <div key={cat} className="bar-row">
                    <span className="bar-label">{cat}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percentage}%` }}>
                        <span className="bar-qty">{qty} sold</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Section Controls Tab Row */}
      <div className="portal-tabs">
        <button
          className={`portal-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders Manager ({filteredOrders.length})
        </button>
        <button
          className={`portal-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🍽️ Menu Configurator ({selectedRestaurant.menu.length})
        </button>
      </div>

      {/* 4. Tab Layouts */}
      {activeTab === 'orders' ? (
        <div className="orders-workspace">
          {/* Left Side: Orders List */}
          <div className="orders-list-pane">
            <div className="pane-header">
              <h3>Order Queue</h3>
              <div className="order-sub-tabs">
                <button
                  className={`sub-tab-btn ${orderFilter === 'active' ? 'active' : ''}`}
                  onClick={() => { setOrderFilter('active'); setSelectedOrderId(null); }}
                >
                  Active ({restaurantOrders.filter(o => ['Preparing', 'Baking', 'Waiting for Rider', 'Delivering', 'Sent'].includes(o.status)).length})
                </button>
                <button
                  className={`sub-tab-btn ${orderFilter === 'past' ? 'active' : ''}`}
                  onClick={() => { setOrderFilter('past'); setSelectedOrderId(null); }}
                >
                  Completed ({completedOrders.length})
                </button>
                <button
                  className={`sub-tab-btn ${orderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setOrderFilter('all'); setSelectedOrderId(null); }}
                >
                  All ({restaurantOrders.length})
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-orders-pane">
                <div className="empty-icon">📭</div>
                <h4>No orders in this category</h4>
                <p>New customer tickets will stream in here automatically.</p>
              </div>
            ) : (
              <div className="orders-queue-list">
                {filteredOrders.map(order => {
                  const isActive = activeOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      className={`order-queue-card ${isActive ? 'selected' : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="card-top-row">
                        <span className="order-id">{order.id}</span>
                        <span className={`status-badge-lbl ${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="card-customer">{order.name}</div>
                      <div className="card-meta-row">
                        <span>Items: {order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                        <span>Rs. {order.grandTotal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Order Details */}
          <div className="order-details-pane">
            {activeOrder ? (
              <div className="details-card-pane">
                <div className="detail-pane-header">
                  <div>
                    <h2>Receipt Detail: {activeOrder.id}</h2>
                    <p className="order-date-time">Placed: {new Date(activeOrder.date).toLocaleString()}</p>
                  </div>
                  <span className={`status-badge-lbl large ${activeOrder.status.toLowerCase().replace(/\s/g, '-')}`}>
                    {activeOrder.status}
                  </span>
                </div>

                {/* Workflow action controller */}
                <div className="order-status-controller">
                  <h4>Pipeline Action</h4>
                  {getNextStatusConfig(activeOrder.status) ? (
                    <div className="action-row">
                      {activeOrder.status === 'Preparing' && !activeOrder.riderId ? (
                        <>
                          <p style={{ color: '#d97706', fontWeight: '500' }}>
                            ⚠️ Waiting for rider assignment. Kitchen preparation will begin as soon as a rider accepts the delivery.
                          </p>
                          <button
                            className="action-advance-btn btn-prepare"
                            disabled={true}
                            style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#9ca3af', border: 'none' }}
                          >
                            🔍 Finding Rider... (Cooking Paused)
                          </button>
                        </>
                      ) : (
                        <>
                          <p>
                            {activeOrder.status === 'Preparing' 
                              ? `✅ Rider Assigned (${activeOrder.riderName || 'Raja Kamran'}). Start cooking immediately:` 
                              : "Advance this order to the next phase in the rider collection sequence:"}
                          </p>
                          <button
                            className={`action-advance-btn ${getNextStatusConfig(activeOrder.status).class}`}
                            onClick={() => handleUpdateOrderStatus(activeOrder.id, getNextStatusConfig(activeOrder.status).next)}
                          >
                            {getNextStatusConfig(activeOrder.status).label}
                          </button>
                        </>
                      )}
                    </div>
                  ) : activeOrder.status === 'Completed' ? (
                    <div className="action-success-complete">
                      <span>🎉 Order has been fully delivered and completed!</span>
                    </div>
                  ) : (
                    <div className="action-success-complete">
                      <span>Status: {activeOrder.status}</span>
                    </div>
                  )}
                </div>

                {/* Customer Details */}
                <div className="details-section customer-info-sec">
                  <h3>Order Details</h3>
                  <div className="customer-details-grid">
                    <div>
                      <strong>Full Name:</strong>
                      <p>{activeOrder.name}</p>
                    </div>
                    <div>
                      <strong>Contact:</strong>
                      <p>{activeOrder.phone || '03001234567'}</p>
                    </div>
                    <div>
                      <strong>Delivery Speed:</strong>
                      <p>{activeOrder.deliverySpeed === 'priority' ? '⚡ Priority' : '🛵 Standard'}</p>
                    </div>
                    <div>
                      <strong>Payment Mode:</strong>
                      <p>{activeOrder.paymentMethod ? activeOrder.paymentMethod.toUpperCase() : 'COD'}</p>
                    </div>
                    <div>
                      <strong>Rider Assigned:</strong>
                      {activeOrder.riderId ? (
                        <p style={{ color: '#10b981', fontWeight: '600' }}>
                          🏍️ {activeOrder.riderName || 'Raja Kamran'}
                        </p>
                      ) : activeOrder.status !== 'Completed' && activeOrder.status !== 'Cancelled' ? (
                        <p style={{ color: '#d97706', fontWeight: '600' }}>
                          🔍 Finding Rider...
                        </p>
                      ) : (
                        <p>No rider assigned</p>
                      )}
                    </div>
                  </div>
                  <div className="customer-address-sec">
                    <strong>Delivery Address:</strong>
                    <p>{activeOrder.address}</p>
                  </div>
                  {activeOrder.instructions && (
                    <div className="customer-notes">
                      <strong>Cooking/Rider Instructions:</strong>
                      <p className="notes-box">📝 {activeOrder.instructions}</p>
                    </div>
                  )}
                </div>

                {/* Receipt items list */}
                <div className="details-section items-info-sec">
                  <h3>Itemized Checklist</h3>
                  <div className="items-receipt-list">
                    {activeOrder.items.map(item => (
                      <div key={item.id} className="receipt-item-row">
                        {item.image && <img src={item.image} alt={item.name} className="receipt-item-img" />}
                        <div className="item-details-lbl">
                          <h4>{item.name}</h4>
                          <p>Price: Rs. {item.price}</p>
                        </div>
                        <div className="item-qty-total">
                          <span className="qty">Qty: {item.quantity}</span>
                          <span className="total">Rs. {item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="totals-table">
                    <div className="totals-row">
                      <span>Subtotal:</span>
                      <span>Rs. {activeOrder.subtotal}</span>
                    </div>
                    {activeOrder.discount > 0 && (
                      <div className="totals-row discount">
                        <span>Promo Discount:</span>
                        <span>-Rs. {activeOrder.discount}</span>
                      </div>
                    )}
                    <div className="totals-row">
                      <span>Delivery Fee:</span>
                      <span>Rs. {activeOrder.deliveryFee}</span>
                    </div>
                    <div className="totals-row">
                      <span>Platform Fee:</span>
                      <span>Rs. {activeOrder.platformFee}</span>
                    </div>
                    <div className="totals-row grand-total-row">
                      <span>Grand Total:</span>
                      <span>Rs. {activeOrder.grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="details-empty-state">
                <div className="chef-icon">👨‍🍳</div>
                <h3>Order Pane</h3>
                <p>Select an active ticket from the left panel to begin baking and status synchronization.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="menu-workspace">
          {/* Menu top actions */}
          <div className="menu-workspace-header">
            <div className="category-tabs-row">
              {menuCategories.map(cat => (
                <button
                  key={cat}
                  className={`menu-cat-btn ${menuFilter === cat ? 'active' : ''}`}
                  onClick={() => setMenuFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button className="add-item-btn" onClick={() => openMenuModal('add')}>
              ➕ Add New Item
            </button>
          </div>

          {/* Menu items listing */}
          {filteredMenuItems.length === 0 ? (
            <div className="empty-menu-state">
              <div className="empty-icon">🍽️</div>
              <h4>No items in this category</h4>
              <p>Add fresh items using the "Add New Item" button above.</p>
            </div>
          ) : (
            <div className="dashboard-menu-grid">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="dash-menu-card">
                  <div className="img-container">
                    <img src={item.image} alt={item.name} />
                    <span className="category-badge">{item.category}</span>
                  </div>
                  <div className="dash-menu-card-details">
                    <div className="card-title-price">
                      <h4>{item.name}</h4>
                      <span className="price">Rs. {item.price}</span>
                    </div>
                    <p className="desc">{item.description}</p>
                    <div className="action-row-btns">
                      <button
                        className="btn-edit-item"
                        onClick={() => openMenuModal('edit', item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete-item"
                        onClick={() => handleDeleteMenuItem(item.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CRUD Add/Edit Dialog Modal Popup */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? '➕ Add New Menu Item' : '✏️ Edit Menu Item'}</h2>
              <button className="close-modal-x" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="modal-form">
              {formError && <div className="form-error-banner">⚠ {formError}</div>}

              <div className="form-group">
                <label htmlFor="item-name">Item Name *</label>
                <input
                  type="text"
                  id="item-name"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Garlic Cheese Naan"
                  required
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="item-price">Price (Rs.) *</label>
                  <input
                    type="number"
                    id="item-price"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    placeholder="e.g. 180"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-category">Category *</label>
                  <input
                    type="text"
                    id="item-category"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    placeholder="e.g. Breads, BBQ, Burgers"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="item-desc">Description *</label>
                <textarea
                  id="item-desc"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Describe details, sizes, spices or ingredients..."
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Choose Image Cover Template:</label>
                <div className="image-templates-row">
                  {IMAGE_TEMPLATES.map(t => {
                    const isSelected = menuForm.image === t.url;
                    return (
                      <button
                        type="button"
                        key={t.name}
                        className={`template-selector-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setMenuForm({ ...menuForm, image: t.url })}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="item-image-url">Or Custom Image URL</label>
                <input
                  type="url"
                  id="item-image-url"
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                  placeholder="Paste direct HTTPS link here"
                />
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {modalMode === 'add' ? 'Add to Menu' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;
