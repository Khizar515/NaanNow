import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import BlockedTicketWidget from '../../components/BlockedTicketWidget/BlockedTicketWidget';
import './RiderDashboard.css';

// Dynamic Leaflet loader
const loadLeaflet = (callback) => {
  if (window.L) {
    callback();
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.crossOrigin = '';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.crossOrigin = '';
  script.onload = () => callback();
  document.body.appendChild(script);
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

// Available Order Map Card with visible Leaflet Map showing delivery address & big screen button
function AvailableOrderMapCard({ order, onOpenBigScreen }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const hasUserPannedRef = useRef(false);

  const resLat = order.restaurantId?.lat || 33.6923;
  const resLng = order.restaurantId?.lng || 73.0105;
  const custLat = order.deliveryLat || 33.6823;
  const custLng = order.deliveryLng || 73.0305;
  const orderId = order._id;

  const distance = calculateDistanceKm(resLat, resLng, custLat, custLng) || 3.2;

  useEffect(() => {
    loadLeaflet(() => {
      if (!mapRef.current) return;
      const L = window.L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, { zoomControl: false }).setView([custLat, custLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Track when rider interacts with / pans the map
        map.on('dragstart movestart zoomstart', () => {
          hasUserPannedRef.current = true;
        });

        // Restaurant Pick-Up marker
        L.marker([resLat, resLng])
          .addTo(map)
          .bindPopup(`<b>📍 Pick Up</b><br/>${order.restaurantId?.name || 'Restaurant'}<br/>${order.restaurantId?.address || ''}`);

        // Customer Drop-off Delivery marker
        L.marker([custLat, custLng])
          .addTo(map)
          .bindPopup(`<b>🏠 Drop Off (Delivery)</b><br/>${order.deliveryAddress || 'Customer Address'}`)
          .openPopup();

        // Route line
        const polyline = L.polyline([[resLat, resLng], [custLat, custLng]], {
          color: '#E57919',
          weight: 4,
          opacity: 0.85
        }).addTo(map);

        polylineRef.current = polyline;

        // Only fit bounds initially if rider hasn't manually panned
        if (!hasUserPannedRef.current) {
          map.fitBounds(polyline.getBounds(), { padding: [25, 25] });
        }

        mapInstanceRef.current = map;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [orderId, resLat, resLng, custLat, custLng]);

  const handleRecenterMap = () => {
    if (mapInstanceRef.current && polylineRef.current) {
      hasUserPannedRef.current = false;
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [25, 25] });
    }
  };

  return (
    <div className="available-order-map-card">
      <div className="map-card-header">
        <span className="distance-badge">📏 Distance: <strong>{distance} km</strong></span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn-big-screen-map"
            onClick={handleRecenterMap}
            title="Recenter Map View"
          >
            🎯 Recenter
          </button>
          <button
            type="button"
            className="btn-big-screen-map"
            onClick={() => onOpenBigScreen(order)}
          >
            🖥️ Big Screen
          </button>
        </div>
      </div>

      <div ref={mapRef} className="card-leaflet-map" />

      <div className="delivery-address-footer">
        <span className="address-icon">🏠</span>
        <span className="address-text">
          <strong>Delivery Address:</strong> {order.deliveryAddress}
        </span>
      </div>
    </div>
  );
}

// Big Screen Map Modal Component
function BigScreenMapModal({ order, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const hasUserPannedRef = useRef(false);

  const resLat = order.restaurantId?.lat || 33.6923;
  const resLng = order.restaurantId?.lng || 73.0105;
  const custLat = order.deliveryLat || 33.6823;
  const custLng = order.deliveryLng || 73.0305;
  const orderId = order._id;

  const distance = calculateDistanceKm(resLat, resLng, custLat, custLng) || 3.2;

  useEffect(() => {
    loadLeaflet(() => {
      if (!mapRef.current) return;
      const L = window.L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([custLat, custLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        map.on('dragstart movestart zoomstart', () => {
          hasUserPannedRef.current = true;
        });

        L.marker([resLat, resLng])
          .addTo(map)
          .bindPopup(`<b>📍 Pick Up Restaurant</b><br/>${order.restaurantId?.name || 'Restaurant'}<br/>${order.restaurantId?.address || ''}`);

        L.marker([custLat, custLng])
          .addTo(map)
          .bindPopup(`<b>🏠 Customer Delivery Destination</b><br/>${order.deliveryAddress}`)
          .openPopup();

        const polyline = L.polyline([[resLat, resLng], [custLat, custLng]], {
          color: '#E57919',
          weight: 5,
          opacity: 0.9
        }).addTo(map);

        polylineRef.current = polyline;

        if (!hasUserPannedRef.current) {
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        }
        mapInstanceRef.current = map;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [orderId, resLat, resLng, custLat, custLng]);

  const handleRecenterModalMap = () => {
    if (mapInstanceRef.current && polylineRef.current) {
      hasUserPannedRef.current = false;
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="modal-content-card big-screen-map-dialog" style={{ maxWidth: '900px', width: '95vw', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-roasted)' }}>
              🗺️ Delivery Route Map — Order #{order.orderNumber}
            </h3>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Pick Up: {order.restaurantId?.name} ➔ Drop Off: {order.deliveryAddress} ({distance} km)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-big-screen-map"
              onClick={handleRecenterModalMap}
            >
              🎯 Recenter Map
            </button>
            <button className="modal-close-icon" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div ref={mapRef} style={{ width: '100%', height: '480px', borderRadius: '16px', border: '1px solid #d1d5db', overflow: 'hidden' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#10B981' }}>
            Delivery Fee Payout: Rs. {order.deliveryFee || 150}
          </span>
          <button type="button" className="sub-tab-btn" onClick={onClose} style={{ padding: '8px 20px' }}>
            Close Map View
          </button>
        </div>
      </div>
    </div >
  );
}

function RiderDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'active' | 'history'

  // Delivery Customer OTP input state
  const [deliveryInputOtp, setDeliveryInputOtp] = useState('');
  const [chatInputText, setChatInputText] = useState('');

  // Big screen map modal order state
  const [bigScreenOrder, setBigScreenOrder] = useState(null);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const user = await api.getMe();
        if (user.role !== 'rider') {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchAuth();
  }, [navigate]);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch rider orders:", err);
      }
    };
    if (currentUser?.status === 'approved') {
      loadOrders();
    }
  }, [currentUser]);

  // Poll orders every 4s
  useEffect(() => {
    if (currentUser?.status !== 'approved') return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getOrders();
        setOrders(data || []);
      } catch (err) { }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Available orders filter: ONLY status === 'preparing' and unassigned (no pending!)
  const availableOrders = orders.filter(o => o.status === 'preparing' && (!o.riderId || o.riderId === null || o.riderId._id === null));

  // Rider active orders
  const activeOrders = orders.filter(o => o.riderId && (o.riderId._id === currentUser?._id || o.riderId === currentUser?._id) && ['preparing', 'ready_for_pickup', 'handed_over', 'out_for_delivery'].includes(o.status));

  // Rider completed orders
  const completedOrders = orders.filter(o => o.riderId && (o.riderId._id === currentUser?._id || o.riderId === currentUser?._id) && (o.status === 'delivered' || o.status === 'completed'));

  const currentActiveOrder = activeOrders[0];

  // GPS Broadcast when order is out_for_delivery
  useEffect(() => {
    if (!currentActiveOrder || currentActiveOrder.status !== 'out_for_delivery') return;

    let watchId;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          api.updateRiderLocation(currentActiveOrder._id, latitude, longitude).catch(() => { });
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [currentActiveOrder?._id, currentActiveOrder?.status]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const accepted = await api.assignOrder(orderId);
      alert(`Order accepted successfully! Show Handover OTP: ${accepted.handoverOtp} to restaurant manager.`);
      const updated = await api.getOrders();
      setOrders(updated);
      setActiveTab('active');
    } catch (err) {
      alert(err.message || 'Failed to accept order');
    }
  };

  const handleMarkOutForDelivery = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 'out_for_delivery');
      alert("Order marked Out for Delivery! Live GPS tracking activated for customer.");
      const updated = await api.getOrders();
      setOrders(updated);
    } catch (err) {
      alert(err.message || 'Failed to mark out for delivery');
    }
  };

  const handleVerifyDeliveryOtp = async (orderId) => {
    if (!deliveryInputOtp.trim()) {
      return alert("Please ask Customer for their Delivery OTP and enter it.");
    }
    try {
      await api.verifyDeliveryOtp(orderId, deliveryInputOtp.trim());
      alert("🎉 Customer Delivery OTP Verified! Order delivered successfully. Your wallet balance has been credited!");
      setDeliveryInputOtp('');
      const updated = await api.getOrders();
      setOrders(updated);
    } catch (err) {
      alert(err.message || 'Incorrect Customer Delivery OTP.');
    }
  };

  const handleRiderSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !currentActiveOrder) return;
    try {
      const updated = await api.addOrderMessage(currentActiveOrder._id, chatInputText.trim());
      setChatInputText('');
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) return <div className="dashboard-loading">Loading portal configurations...</div>;

  return (
    <div className="rider-dashboard-page">
      <div className="rider-dashboard-container">

        {/* 1. Header Profile & Stats Bar (No Logout Button) */}
        <div className="rider-header">
          <div className="rider-profile-info">
            <div className="rider-avatar-large">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="rider-name-details">
              <h2>{currentUser.name} (Rider Portal)</h2>
              <p>{currentUser.vehicleDetails || 'Bike'} • <strong>{currentUser.licensePlate || 'ICT-9821'}</strong></p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="wallet-pill" style={{ background: '#10B981', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
              💰 Wallet: Rs. {(currentUser.walletBalance || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 2. Rider Metrics Grid */}
        <div className="rider-stats-grid">
          <div className="stat-card-modern">
            <div className="stat-icon-container">💰</div>
            <div className="stat-info">
              <h3>Wallet Earnings</h3>
              <p className="stat-value">Rs. {(currentUser.walletBalance || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">📥</div>
            <div className="stat-info">
              <h3>Available Jobs</h3>
              <p className="stat-value">{availableOrders.length}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">🛵</div>
            <div className="stat-info">
              <h3>Active Deliveries</h3>
              <p className="stat-value">{activeOrders.length}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">⭐</div>
            <div className="stat-info">
              <h3>Rider Rating</h3>
              <p className="stat-value">{currentUser.rating ? Number(currentUser.rating).toFixed(1) : '5.0'}</p>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="rider-tabs-nav">
          <button className={`rider-tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
            Available Jobs <span className="tab-badge">{availableOrders.length}</span>
          </button>
          <button className={`rider-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Active Deliveries <span className="tab-badge">{activeOrders.length}</span>
          </button>
          <button className={`rider-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Completed History <span className="tab-badge">{completedOrders.length}</span>
          </button>
        </div>

        {/* 4. Available Jobs Panel */}
        {activeTab === 'available' && (
          <div className="orders-list-panel">
            {availableOrders.length === 0 ? (
              <div className="no-orders-fallback" style={{ padding: '40px', textAlign: 'center' }}>
                <h3>No Available Preparing Orders</h3>
                <p style={{ marginTop: '8px', color: '#6B7280' }}>
                  Orders only show up here when marked <strong>Preparing</strong> by restaurant managers. Pending orders are hidden.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {availableOrders.map(order => (
                  <div key={order._id} className="order-card-rider">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="order-id-lbl">{order.orderNumber}</span>
                      <span className="speed-tag">🍳 Preparing in Kitchen</span>
                    </div>

                    <h4 className="restaurant-title">{order.restaurantId?.name || 'Restaurant'}</h4>

                    <div className="address-item">
                      <span className="address-icon">📍</span>
                      <span><strong>Pick Up:</strong> {order.restaurantId?.address || 'Restaurant Address'}</span>
                    </div>

                    <div className="address-item">
                      <span className="address-icon">🏠</span>
                      <span><strong>Drop Off:</strong> {order.deliveryAddress}</span>
                    </div>

                    <div className="order-details-summary">
                      <span className="order-bill">Total: Rs. {order.totalAmount}</span>
                      <span className="delivery-payout">Payout: <strong>Rs. {order.deliveryFee || 150}</strong></span>
                    </div>

                    {/* Visible Leaflet Map Card showing Delivery Address & Big Screen option */}
                    <AvailableOrderMapCard
                      order={order}
                      onOpenBigScreen={(ord) => setBigScreenOrder(ord)}
                    />

                    <button
                      type="button"
                      className="btn-accept-order"
                      onClick={() => handleAcceptOrder(order._id)}
                    >
                      Accept Order & Get Handover OTP 🔑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Active Deliveries Panel */}
        {activeTab === 'active' && (
          <div className="active-delivery-workspace">
            {!currentActiveOrder ? (
              <div className="no-orders-fallback" style={{ padding: '40px', textAlign: 'center' }}>
                <h3>No Active Deliveries</h3>
                <p>Accept an order from the Available Jobs tab to begin your delivery route.</p>
              </div>
            ) : (
              <div className="active-delivery-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2>Active Order #{currentActiveOrder.orderNumber}</h2>
                  <span style={{ background: '#E57919', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>
                    {currentActiveOrder.status}
                  </span>
                </div>

                {/* Handover OTP Notice */}
                {currentActiveOrder.handoverOtp && currentActiveOrder.status !== 'handed_over' && currentActiveOrder.status !== 'out_for_delivery' && (
                  <div style={{ background: '#1F2937', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '2px dashed #F59E0B' }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase' }}>🔑 Your Restaurant Handover OTP</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B', display: 'block', letterSpacing: '3px', margin: '4px 0' }}>
                      {currentActiveOrder.handoverOtp}
                    </span>
                    <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
                      Show this code to restaurant manager. They must verify it before you can start "Out for Delivery".
                    </span>
                  </div>
                )}

                {/* Status Gate Controls */}
                <div className="lifecycle-controller" style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  {currentActiveOrder.status !== 'handed_over' && currentActiveOrder.status !== 'out_for_delivery' && (
                    <div>
                      <p style={{ color: '#DC2626', fontWeight: 'bold', marginBottom: '8px' }}>
                        ⛔ Cannot mark Out for Delivery yet: Waiting for Manager to verify Handover OTP and mark status "Handed over to rider".
                      </p>
                      <button disabled style={{ padding: '10px 20px', borderRadius: '8px', background: '#D1D5DB', color: '#6B7280', border: 'none', fontWeight: 'bold', cursor: 'not-allowed' }}>
                        Mark Out for Delivery (Gated)
                      </button>
                    </div>
                  )}

                  {currentActiveOrder.status === 'handed_over' && (
                    <div>
                      <p style={{ color: '#10B981', fontWeight: 'bold', marginBottom: '8px' }}>
                        ✅ Manager has handed over order! Click below when departing restaurant:
                      </p>
                      <button
                        onClick={() => handleMarkOutForDelivery(currentActiveOrder._id)}
                        style={{ padding: '12px 24px', borderRadius: '8px', background: '#E57919', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Start Out for Delivery 🛵
                      </button>
                    </div>
                  )}

                  {currentActiveOrder.status === 'out_for_delivery' && (
                    <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', border: '1px solid #FCD34D' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#B45309' }}>🛵 Transit Active — Live GPS Broadcasting</h4>
                      <p style={{ fontSize: '13px', color: '#92400E', marginBottom: '12px' }}>
                        Ask customer for their 6-character Security Delivery OTP upon arrival:
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter Customer Delivery OTP"
                          value={deliveryInputOtp}
                          onChange={(e) => setDeliveryInputOtp(e.target.value.toUpperCase())}
                          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', letterSpacing: '2px', width: '220px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyDeliveryOtp(currentActiveOrder._id)}
                          style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Verify Customer OTP & Mark Delivered ✅
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Details & Chat */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <h4>Delivery Credentials</h4>
                    <p><strong>Customer Name:</strong> {currentActiveOrder.name || currentActiveOrder.customerId?.name}</p>
                    <p><strong>Phone:</strong> {currentActiveOrder.phone || currentActiveOrder.customerId?.phone}</p>
                    <p><strong>Address:</strong> {currentActiveOrder.deliveryAddress}</p>
                    {currentActiveOrder.instructions && <p><strong>Note:</strong> {currentActiveOrder.instructions}</p>}
                  </div>

                  {/* Async Chat Drawer */}
                  <div className="chat-drawer-rider" style={{ background: '#F9FAFB', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Chat with Customer</h4>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '10px' }}>
                      {(currentActiveOrder.messages || []).map((msg, idx) => (
                        <div key={idx} style={{ textAlign: msg.sender === 'rider' ? 'right' : 'left', margin: '4px 0' }}>
                          <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: '8px', background: msg.sender === 'rider' ? '#E57919' : '#E5E7EB', color: msg.sender === 'rider' ? '#fff' : '#111', fontSize: '13px' }}>
                            {msg.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleRiderSendMessage} style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Type reply..."
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
                      />
                      <button type="submit" style={{ background: '#E57919', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: 'bold' }}>Send</button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 6. History Panel */}
        {activeTab === 'history' && (
          <div className="orders-list-panel">
            {completedOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280', padding: '32px' }}>No completed orders recorded yet.</p>
            ) : (
              completedOrders.map(order => (
                <div key={order._id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{order.orderNumber} • Delivered</h4>
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>To: {order.deliveryAddress}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981' }}>+ Rs. {order.deliveryFee || 150}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Big Screen Map Modal */}
        {bigScreenOrder && (
          <BigScreenMapModal
            order={bigScreenOrder}
            onClose={() => setBigScreenOrder(null)}
          />
        )}

      </div>
    </div>
  );
}

export default RiderDashboard;
