import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './RiderDashboard.css';

// Load Leaflet dynamically to avoid React 19 dependency peer resolution issues
const loadLeaflet = (callback) => {
  if (window.L) {
    callback();
    return;
  }

  // Create link tag for CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.crossOrigin = '';
  document.head.appendChild(link);

  // Create script tag for JS
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.crossOrigin = '';
  script.onload = () => {
    callback();
  };
  document.body.appendChild(script);
};

// Coords & route segments in Islamabad
const restaurantCoords = [33.6923, 73.0105]; // F-10 Markaz (Tandoori Flames)
const customerCoords = [33.6823, 73.0305];   // F-8 House
const routePath = [
  [33.6923, 73.0105], // F-10 Markaz
  [33.6923, 73.0200], // F-10 Corner
  [33.6880, 73.0200], // Intersection
  [33.6880, 73.0305], // F-8 Corner
  [33.6823, 73.0305]  // F-8 House
];

// Helper to interpolate position along multi-segment path
const getPointAlongPath = (path, p) => {
  if (path.length === 0) return [0, 0];
  if (path.length === 1) return path[0];
  if (p <= 0) return path[0];
  if (p >= 1) return path[path.length - 1];

  const totalSegments = path.length - 1;
  const segmentLength = 1 / totalSegments;
  const segmentIndex = Math.min(Math.floor(p / segmentLength), totalSegments - 1);
  const segmentProgress = (p - segmentIndex * segmentLength) / segmentLength;

  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];

  const lat = start[0] + (end[0] - start[0]) * segmentProgress;
  const lng = start[1] + (end[1] - start[1]) * segmentProgress;

  return [lat, lng];
};

function RiderDashboard() {
  const navigate = useNavigate();

  // Rider state
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'active', 'history'
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 100 %

  // Earnings summary
  const [stats, setStats] = useState({
    todayEarnings: 450,
    tripsCount: 3,
    tipsAmount: 120,
    rating: 4.9
  });

  // Map refs
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const mapInitRef = useRef(false);

  // Chat state
  const [chatInputText, setChatInputText] = useState('');
  const chatContainerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Load Leaflet Script
  useEffect(() => {
    loadLeaflet(() => {
      setLeafletLoaded(true);
    });
  }, []);

  // Fetch all orders from localStorage, add mock orders if none exist
  useEffect(() => {
    const fetchOrders = () => {
      let saved = localStorage.getItem('naannow_orders');
      let parsed = [];
      
      if (saved) {
        parsed = JSON.parse(saved);
      }
      
      // If there are no orders at all, populate some realistic mock orders
      if (parsed.length === 0) {
        const mockOrders = [
          {
            id: 'NN-534118',
            restaurantId: 1,
            restaurantName: 'Tandoori Flames (F-10)',
            restaurantAddress: 'F-10 Markaz, Islamabad',
            name: 'Muhammad Saad',
            phone: '0300-1234567',
            address: 'House 42B, Street 11, F-8, Islamabad',
            items: [
              { id: 101, name: 'Clay Oven Roghni Naan', quantity: 3, price: 120 },
              { id: 102, name: 'Special Chicken Biryani', quantity: 1, price: 890 }
            ],
            subtotal: 1250,
            deliverySpeed: 'priority',
            deliveryFee: 150,
            tax: 80,
            grandTotal: 1480,
            status: 'Waiting for Rider',
            date: new Date().toISOString()
          },
          {
            id: 'NN-992812',
            restaurantId: 2,
            restaurantName: 'Khyber Shinwari (F-7)',
            restaurantAddress: 'F-7 Markaz, Islamabad',
            name: 'Ayesha Khan',
            phone: '0321-9876543',
            address: 'Apartment 4, Block C, F-10, Islamabad',
            items: [
              { id: 201, name: 'Garlic Butter Naan', quantity: 2, price: 150 },
              { id: 202, name: 'Chicken Karahi (Half)', quantity: 1, price: 1450 }
            ],
            subtotal: 1750,
            deliverySpeed: 'standard',
            deliveryFee: 120,
            tax: 120,
            grandTotal: 1990,
            status: 'Baking',
            date: new Date(Date.now() - 600000).toISOString()
          }
        ];
        localStorage.setItem('naannow_orders', JSON.stringify(mockOrders));
        parsed = mockOrders;
      }
      
      setOrders(parsed);
      
      // Defer setting the initialized flag to prevent scrolling on mount
      if (!isInitializedRef.current) {
        setTimeout(() => {
          isInitializedRef.current = true;
        }, 500);
      }
    };

    fetchOrders();

    // Check periodically for order changes
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders based on tabs
  const availableOrders = orders.filter(
    o => o.status !== 'Completed' && o.status !== 'Cancelled' && !o.riderId
  );
  const activeOrders = orders.filter(
    o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.riderId === 'RK-9821'
  );
  const completedOrders = orders.filter(
    o => o.status === 'Completed' && o.riderId === 'RK-9821'
  );

  // Compute completed earnings
  useEffect(() => {
    if (completedOrders.length > 0) {
      const trips = completedOrders.length;
      const baseEarnings = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 150), 0);
      const mockTips = trips * 40; // Simulated Rs. 40 tips per trip
      setStats({
        todayEarnings: 450 + baseEarnings + mockTips,
        tripsCount: 3 + trips,
        tipsAmount: 120 + mockTips,
        rating: 4.9
      });
    }
  }, [orders]);

  // Determine current active selection
  const currentActiveOrder = activeOrders.find(o => o.id === selectedOrderId) || activeOrders[0];
  const activeOrderId = currentActiveOrder?.id;

  // Map initialization
  useEffect(() => {
    if (!leafletLoaded || !activeOrderId || mapInitRef.current || activeTab !== 'active') return;

    const L = window.L;

    // Create Map centered between F-10 and F-8
    const map = L.map('map-rider', {
      zoomControl: true,
      attributionControl: false
    }).setView([33.6873, 73.0205], 14);

    mapRef.current = map;
    mapInitRef.current = true;

    // Standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Emoji icons
    const restaurantIcon = L.divIcon({
      html: `<div class="map-marker-pin restaurant-pin" style="font-size: 24px;">🔥</div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const customerIcon = L.divIcon({
      html: `<div class="map-marker-pin customer-pin" style="font-size: 24px;">🏠</div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const riderIcon = L.divIcon({
      html: `<div class="map-marker-pin rider-pin" style="font-size: 28px;">🛵</div>`,
      className: 'custom-div-icon',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });

    // Add Markers
    L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map)
      .bindPopup(`<b>${currentActiveOrder.restaurantName}</b><br/>Pick up location`);

    L.marker(customerCoords, { icon: customerIcon }).addTo(map)
      .bindPopup(`<b>${currentActiveOrder.name}</b><br/>${currentActiveOrder.address}`);

    // Draw route path
    const polyline = L.polyline(routePath, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);
    polylineRef.current = polyline;

    // Initial Rider Marker
    let startLoc = restaurantCoords;
    if (currentActiveOrder.status === 'Delivering' && currentActiveOrder.dispatchedAt) {
      const elapsed = (new Date().getTime() - new Date(currentActiveOrder.dispatchedAt).getTime()) / 1000;
      const progress = Math.min(Math.max(elapsed / 25, 0), 1);
      startLoc = getPointAlongPath(routePath, progress);
    } else if (currentActiveOrder.status === 'Completed') {
      startLoc = customerCoords;
    }

    const riderMarker = L.marker(startLoc, { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    // Zoom map bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitRef.current = false;
      }
    };
  }, [leafletLoaded, activeOrderId, activeTab]);

  // Handle live rider position updates if order is in delivering state
  useEffect(() => {
    if (!mapRef.current || !riderMarkerRef.current || !currentActiveOrder || currentActiveOrder.status !== 'Delivering') return;

    // If simulating, the simulation interval handles position.
    // Otherwise, calculate real position from dispatchedAt.
    if (isSimulating) return;

    const updatePosition = () => {
      if (!currentActiveOrder.dispatchedAt) return;
      const elapsed = (new Date().getTime() - new Date(currentActiveOrder.dispatchedAt).getTime()) / 1000;
      const progress = Math.min(Math.max(elapsed / 25, 0), 1);
      const currentLoc = getPointAlongPath(routePath, progress);
      
      riderMarkerRef.current.setLatLng(currentLoc);
      
      // Auto-center map on rider
      if (progress < 1) {
        mapRef.current.panTo(currentLoc, { animate: true, duration: 0.5 });
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [currentActiveOrder, isSimulating]);

  // Scroll to bottom of chat when new messages arrive internally (does not scroll window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentActiveOrder?.messages?.length]);

  // Send message from Rider Dashboard
  const handleRiderSendMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !currentActiveOrder) return;

    const riderMsg = {
      id: Date.now(),
      sender: 'rider',
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const saved = localStorage.getItem('naannow_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      const updated = parsed.map(o => {
        if (o.id === currentActiveOrder.id) {
          const msgs = o.messages || [];
          return { ...o, messages: [...msgs, riderMsg] };
        }
        return o;
      });
      localStorage.setItem('naannow_orders', JSON.stringify(updated));
      setOrders(updated);
    }
    setChatInputText('');
  };

  // Simulation Route Travel Runner
  const handleStartSimulation = () => {
    if (isSimulating || !currentActiveOrder) return;

    setIsSimulating(true);
    setSimProgress(0);

    // Update localStorage to record dispatch timestamp so customer sees sync
    const nowIso = new Date().toISOString();
    const updated = orders.map(o => {
      if (o.id === currentActiveOrder.id) {
        return {
          ...o,
          status: 'Delivering',
          dispatchedAt: nowIso,
          isManual: true
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5; // 5% increase every 500ms (10 seconds total)
      setSimProgress(progress);

      const latlng = getPointAlongPath(routePath, progress / 100);
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng(latlng);
      }
      if (mapRef.current) {
        mapRef.current.panTo(latlng, { animate: true, duration: 0.3 });
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        setSimProgress(100);
        
        // Auto update status to Ready for complete
        alert("📍 Navigation Alert: You have arrived at the customer's house address! Please deliver the food and complete the trip.");
      }
    }, 500);
  };

  // Assign Order to Rider
  const handleAcceptOrder = (orderId) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          riderId: 'RK-9821',
          riderName: 'Raja Kamran',
          riderPhone: '+92 300 9821245',
          riderVehicle: 'Honda CD70 (ICT-9821)',
          status: o.status === 'Preparing' || o.status === 'Baking' ? o.status : 'Waiting for Rider'
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
    setSelectedOrderId(orderId);
    setActiveTab('active');
  };

  // Arrive at Restaurant (Chef completes packaging)
  const handleArriveAtRestaurant = () => {
    if (!currentActiveOrder) return;
    const updated = orders.map(o => {
      if (o.id === currentActiveOrder.id) {
        return {
          ...o,
          status: 'Waiting for Rider',
          isManual: true
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
  };

  // Pick up food packages
  const handlePickUpOrder = () => {
    if (!currentActiveOrder) return;
    const nowIso = new Date().toISOString();
    const updated = orders.map(o => {
      if (o.id === currentActiveOrder.id) {
        return {
          ...o,
          status: 'Delivering',
          dispatchedAt: nowIso,
          isManual: true
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
  };

  // Complete delivery
  const handleCompleteOrder = () => {
    if (!currentActiveOrder) return;
    const updated = orders.map(o => {
      if (o.id === currentActiveOrder.id) {
        return {
          ...o,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          isManual: true
        };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
    alert("🎉 Fantastic! Trip completed successfully. Rs. " + (currentActiveOrder.deliveryFee + 40) + " has been added to your daily earnings.");
    setActiveTab('history');
  };

  return (
    <div className="rider-dashboard-page">
      <div className="rider-dashboard-container">
        
        {/* Rider Header Bar */}
        <div className="rider-header">
          <div className="rider-profile-info">
            <div className="rider-avatar-large">RK</div>
            <div className="rider-name-details">
              <h2>Raja Kamran (Rider Portal)</h2>
              <p>Honda CD70 • <strong style={{ color: '#fff' }}>ICT-9821</strong></p>
            </div>
          </div>
          
          <div className="status-toggle-wrapper">
            <span className={`status-lbl ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '● Online & Accepting Jobs' : '○ Offline'}
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isOnline} 
                onChange={(e) => setIsOnline(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Stats Row */}
        <div className="rider-stats-grid">
          <div className="stat-card-modern">
            <div className="stat-icon-container">💰</div>
            <div className="stat-info">
              <h3>Today's Earnings</h3>
              <p className="stat-value">Rs. {stats.todayEarnings}</p>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon-container">🏍️</div>
            <div className="stat-info">
              <h3>Completed Trips</h3>
              <p className="stat-value">{stats.tripsCount} Deliveries</p>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon-container">🎁</div>
            <div className="stat-info">
              <h3>Tips Received</h3>
              <p className="stat-value">Rs. {stats.tipsAmount}</p>
            </div>
          </div>
          <div className="stat-card-modern">
            <div className="stat-icon-container">⭐</div>
            <div className="stat-info">
              <h3>Rider Rating</h3>
              <p className="stat-value">{stats.rating} / 5.0</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="rider-tabs-nav">
          <button 
            className={`rider-tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available Jobs
            <span className="tab-badge">{availableOrders.length}</span>
          </button>
          <button 
            className={`rider-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Deliveries
            <span className="tab-badge">{activeOrders.length}</span>
          </button>
          <button 
            className={`rider-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History & Earnings
            <span className="tab-badge">{completedOrders.length}</span>
          </button>
        </div>

        {/* Offline View Panel */}
        {!isOnline ? (
          <div className="rider-offline-panel">
            <div className="offline-icon-large">📴</div>
            <h2>You are currently Offline</h2>
            <p>Go online to view live incoming available orders from the clay-oven tandoors around Islamabad!</p>
            <button className="btn-go-online" onClick={() => setIsOnline(true)}>
              Go Online Now
            </button>
          </div>
        ) : (
          <div className="rider-workspace-grid">
            
            {/* LEFT SIDE: List of orders / active details */}
            {activeTab === 'available' && (
              <div className="orders-list-panel">
                {availableOrders.length === 0 ? (
                  <div className="no-orders-fallback">
                    <h3>No available orders nearby</h3>
                    <p style={{ marginTop: '8px' }}>Please wait for customers to place new hot naan orders on the store, or place one yourself!</p>
                  </div>
                ) : (
                  availableOrders.map(order => (
                    <div key={order.id} className="order-card-rider">
                      <div className="order-card-header">
                        <span className="order-id-lbl">{order.id}</span>
                        <span className={`speed-tag ${order.deliverySpeed}`}>
                          {order.deliverySpeed === 'priority' ? '⚡ Priority' : '🛵 Standard'}
                        </span>
                      </div>
                      
                      <div className="restaurant-title">{order.restaurantName}</div>
                      
                      <div className="address-item">
                        <span className="address-icon">🥣</span>
                        <span>{order.restaurantAddress || 'F-10 Markaz, Islamabad'}</span>
                      </div>
                      
                      <div className="address-item">
                        <span className="address-icon">🏠</span>
                        <span>{order.address}</span>
                      </div>

                      <div className="order-details-summary">
                        <div className="order-bill">Rs. {order.grandTotal}</div>
                        <div className="delivery-payout">
                          Payout: <strong>Rs. {order.deliveryFee + 40}</strong>
                        </div>
                      </div>

                      <button 
                        className="btn-accept-order" 
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        Accept & Start Job
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div className="orders-list-panel">
                {!currentActiveOrder ? (
                  <div className="no-orders-fallback">
                    <h3>No active accepted deliveries</h3>
                    <p style={{ marginTop: '8px' }}>Accept a job from the "Available Jobs" tab to start your transit route!</p>
                  </div>
                ) : (
                  <div className="active-delivery-panel">
                    <div className="active-delivery-header">
                      <h3>Active Order Details</h3>
                      <p>ID: <strong>{currentActiveOrder.id}</strong> • Status: <strong style={{ color: 'var(--color-tandoori)' }}>{currentActiveOrder.status}</strong></p>
                    </div>

                    <div className="active-delivery-body">
                      {/* Waypoints */}
                      <div className="delivery-waypoints">
                        <div className="waypoint-node">
                          <span className="waypoint-label">Restaurant Pick Up</span>
                          <div className="waypoint-name">{currentActiveOrder.restaurantName}</div>
                          <div className="waypoint-address">{currentActiveOrder.restaurantAddress || 'F-10 Markaz, Islamabad'}</div>
                        </div>

                        <div className="waypoint-node customer-destination">
                          <span className="waypoint-label">Customer Drop Off</span>
                          <div className="waypoint-name">{currentActiveOrder.name} ({currentActiveOrder.phone})</div>
                          <div className="waypoint-address">{currentActiveOrder.address}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="delivery-items-card">
                        <h4>Items Summary</h4>
                        <ul className="items-mini-list">
                          {currentActiveOrder.items.map((item, idx) => (
                            <li key={idx}>
                              <span><strong className="item-qty-tag">{item.quantity}x</strong> {item.name}</span>
                              <span>Rs. {item.price * item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Progression Control Panel */}
                      <div className="lifecycle-controller">
                        {currentActiveOrder.status === 'Preparing' || currentActiveOrder.status === 'Baking' ? (
                          <>
                            <h4>🍳 Kitchen Preparing...</h4>
                            <p>Chefs are baking naans inside the clay tandoor. You can wait or let them know you've arrived.</p>
                            <button className="btn-lifecycle-action waiting-state" onClick={handleArriveAtRestaurant}>
                              Arrive at Restaurant
                            </button>
                          </>
                        ) : currentActiveOrder.status === 'Waiting for Rider' ? (
                          <>
                            <h4>📦 Order Ready at Counter!</h4>
                            <p>Verify all items are packaged correctly inside the thermal heat bag before picking up.</p>
                            <button className="btn-lifecycle-action waiting-state" onClick={handlePickUpOrder}>
                              Confirm Pick Up & Start Delivery
                            </button>
                          </>
                        ) : currentActiveOrder.status === 'Delivering' ? (
                          <>
                            <h4>🛵 In Transit to Customer</h4>
                            <p>Head to {currentActiveOrder.address}. You can simulate the travel navigation on the map.</p>
                            
                            <button className="btn-lifecycle-action delivering-state" onClick={handleCompleteOrder}>
                              Mark Delivered & Complete
                            </button>

                            {isSimulating ? (
                              <div className="simulation-indicator-box">
                                <div className="simulation-stats-row">
                                  <span>Simulating GPS Ride...</span>
                                  <span>{simProgress}%</span>
                                </div>
                                <div className="simulation-bar-wrapper">
                                  <div className="simulation-bar-fill" style={{ width: `${simProgress}%` }}></div>
                                </div>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Rider marker is moving along the map route in real-time.</span>
                              </div>
                            ) : (
                              <button className="btn-simulate-drive" onClick={handleStartSimulation}>
                                🧭 Start Route Simulation (10s Ride)
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>

                      {/* Customer chat area */}
                      <div className="chat-drawer-rider">
                        <div className="chat-header-rider">
                          <h4>Chat with {currentActiveOrder.name}</h4>
                          <span style={{ fontSize: '11px', color: '#10b981' }}>Connected</span>
                        </div>
                        
                        <div className="rider-chat-messages" ref={chatContainerRef}>
                          {(currentActiveOrder.messages || []).map((msg, index) => (
                            <div key={index} className={`rider-chat-msg ${msg.sender}`}>
                              <div className="rider-chat-bubble">
                                <p className="rider-chat-text">{msg.text}</p>
                                <span className="rider-chat-time">{msg.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <form className="rider-chat-input-form" onSubmit={handleRiderSendMessage}>
                          <input
                            type="text"
                            placeholder="Type a reply to customer..."
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                          />
                          <button type="submit" disabled={!chatInputText.trim()}>
                            Send
                          </button>
                        </form>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="orders-list-panel" style={{ gridColumn: 'span 2' }}>
                <div className="history-payouts-summary">
                  <div>
                    <h3>Accumulated Session Earnings</h3>
                    <p className="total-payout-val">Rs. {stats.todayEarnings}</p>
                  </div>
                  <div className="trip-count-pills">
                    <strong>{stats.tripsCount}</strong> Trips Total<br/>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Rating: {stats.rating} ⭐</span>
                  </div>
                </div>

                <div className="history-orders-container">
                  {completedOrders.length === 0 ? (
                    <div className="no-orders-fallback" style={{ borderStyle: 'solid' }}>
                      <h3>No completed trips this session</h3>
                      <p style={{ marginTop: '8px' }}>Deliver active orders to see them recorded in your dispatch logs here.</p>
                    </div>
                  ) : (
                    completedOrders.map((order, idx) => (
                      <div key={idx} className="history-order-card">
                        <div className="history-order-left">
                          <h4>{order.restaurantName} ➔ {order.name}</h4>
                          <p>ID: {order.id} • Date: {new Date(order.date).toLocaleDateString()}</p>
                          <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Destination: {order.address}</p>
                        </div>
                        <div className="history-order-right">
                          <div className="history-order-earnings">Rs. {order.deliveryFee}</div>
                          <div className="history-order-tips">+ Rs. 40 Tip</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* RIGHT SIDE: Interactive Leaflet Map for Active Orders */}
            {activeTab === 'active' && (
              <div className="map-view-column">
                <div className="map-view-header">
                  <h3>Real-time Route Navigation</h3>
                  {leafletLoaded ? (
                    <span className="leaflet-loaded-status">GPS Online</span>
                  ) : (
                    <span className="leaflet-loaded-status" style={{ background: '#374151', color: '#9ca3af' }}>Connecting...</span>
                  )}
                </div>

                <div id="map-rider">
                  {!currentActiveOrder && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '14px' }}>
                      Accept an order to display delivery maps.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default RiderDashboard;
