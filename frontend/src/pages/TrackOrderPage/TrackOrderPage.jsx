import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import './TrackOrderPage.css';

// Load Leaflet dynamically
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
  script.onload = () => {
    callback();
  };
  document.body.appendChild(script);
};

const getOrderProgress = (status) => {
  switch (status) {
    case 'pending':
      return { status: 'Placed', step: 1 };
    case 'preparing':
      return { status: 'Preparing', step: 2 };
    case 'ready_for_pickup':
      return { status: 'Prepared', step: 3 };
    case 'handed_over':
      return { status: 'Handed Over', step: 4 };
    case 'out_for_delivery':
      return { status: 'Out for Delivery', step: 5 };
    case 'delivered':
    case 'completed':
      return { status: 'Delivered', step: 6 };
    default:
      return { status: 'Placed', step: 1 };
  }
};

function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Rating states
  const [riderRating, setRiderRating] = useState(5);
  const [riderReview, setRiderReview] = useState('');
  const [itemRatings, setItemRatings] = useState({});

  // Leaflet refs
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const mapInitRef = useRef(false);
  const chatContainerRef = useRef(null);
  const chatSectionRef = useRef(null);

  const scrollToChat = () => {
    if (chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load Leaflet Script
  useEffect(() => {
    loadLeaflet(() => {
      setLeafletLoaded(true);
    });
  }, []);

  // Sync order status and chat messages from API periodically (3s)
  useEffect(() => {
    if (!orderId) return;
    const syncOrder = async () => {
      try {
        const found = await api.getOrderById(orderId);
        if (found) {
          setOrder(found);
          if (found.messages) {
            setMessages(found.messages);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      }
    };

    syncOrder();
    const interval = setInterval(syncOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Initialize Map and handle Rider marker placement
  useEffect(() => {
    if (!leafletLoaded || !order || mapInitRef.current) return;

    const L = window.L;

    const resLat = order.restaurantId?.lat || 33.6923;
    const resLng = order.restaurantId?.lng || 73.0105;
    const custLat = order.deliveryLat || 33.6823;
    const custLng = order.deliveryLng || 73.0305;

    const map = L.map('map-tracker', {
      zoomControl: false,
      attributionControl: false
    }).setView([resLat, resLng], 13);

    mapRef.current = map;
    mapInitRef.current = true;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const restaurantIcon = L.divIcon({
      html: `<div class="map-marker-pin restaurant-pin">🔥<div class="pulse-ring"></div></div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const customerIcon = L.divIcon({
      html: `<div class="map-marker-pin customer-pin">🏠<div class="pulse-ring"></div></div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const riderIcon = L.divIcon({
      html: `<div class="map-marker-pin rider-pin">🛵<div class="rider-pulse"></div></div>`,
      className: 'custom-div-icon',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });

    L.marker([resLat, resLng], { icon: restaurantIcon }).addTo(map)
      .bindPopup(`<b>${order.restaurantId?.name || 'Restaurant'}</b>`);

    L.marker([custLat, custLng], { icon: customerIcon }).addTo(map)
      .bindPopup(`<b>Delivery Address</b><br/>${order.deliveryAddress}`);

    const polyline = L.polyline([[resLat, resLng], [custLat, custLng]], {
      color: '#E57919',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 12'
    }).addTo(map);

    const initialRiderPos = order.riderLat && order.riderLng ? [order.riderLat, order.riderLng] : [resLat, resLng];
    const riderMarker = L.marker(initialRiderPos, { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitRef.current = false;
      }
    };
  }, [leafletLoaded, orderId]);

  // Update Rider Location marker ONLY (without recentering map automatically)
  useEffect(() => {
    if (!order || !riderMarkerRef.current) return;

    if (order.status === 'out_for_delivery' && order.riderLat && order.riderLng) {
      riderMarkerRef.current.setLatLng([order.riderLat, order.riderLng]);
    } else if (order.status === 'delivered' || order.status === 'completed') {
      const custLat = order.deliveryLat || 33.6823;
      const custLng = order.deliveryLng || 73.0305;
      riderMarkerRef.current.setLatLng([custLat, custLng]);
    }
  }, [order?.riderLat, order?.riderLng, order?.status]);

  // Manual recenter button handler
  const handleRecenterMap = () => {
    if (!mapRef.current || !order) return;
    let targetPos = [order.restaurantId?.lat || 33.6923, order.restaurantId?.lng || 73.0105];
    if (order.riderLat && order.riderLng) {
      targetPos = [order.riderLat, order.riderLng];
    } else if (order.status === 'delivered' || order.status === 'completed') {
      targetPos = [order.deliveryLat || 33.6823, order.deliveryLng || 73.0305];
    }
    mapRef.current.setView(targetPos, 15, { animate: true });
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !order) return;

    const msgText = inputText.trim();
    setInputText('');

    try {
      const updated = await api.addOrderMessage(order._id, msgText);
      setMessages(updated.messages || []);
    } catch (err) {
      console.error("Could not post message:", err);
    }
  };

  const handleCallRider = () => {
    if (order?.riderId?.phone) {
      alert(`📞 Calling Rider ${order.riderId.name} (${order.riderId.phone})...`);
    } else {
      alert(`📞 Rider details will be available once rider accepts your order.`);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!order) return;

    const ratingData = {
      riderRating,
      riderReview: riderReview.trim(),
      itemRatings
    };

    try {
      const updatedOrder = await api.rateOrder(order._id, ratingData);
      setOrder(updatedOrder);
      alert("Feedback submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Could not submit feedback.");
    }
  };

  if (!order) {
    return (
      <div className="track-order-fallback">
        <div className="fallback-card">
          <h2>Order Not Found</h2>
          <p>We couldn't locate this order ID.</p>
          <button className="back-orders-btn" onClick={() => navigate('/orders')}>
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const progInfo = getOrderProgress(order.status);
  const hasRider = Boolean(order.riderId);

  return (
    <div className="track-order-page">
      <div className="track-order-container">
        
        {/* Header Block */}
        <div className="track-page-header">
          <button className="btn-back" onClick={() => navigate('/orders')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Orders
          </button>
          
          <div className="order-summary-title">
            <h2>Order Tracking: <span className="ref-id">{order.orderNumber}</span></h2>
            <p>From: <strong>{order.restaurantId?.name || "NaanNow Kitchen"}</strong></p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="track-grid">
          
          {/* LEFT: MAP & 6 LEVELS PROGRESS */}
          <div className="track-map-column">
            
            {/* 6 Levels Stepper Progress */}
            <div className="status-progress-card" style={{ marginBottom: '24px' }}>
              <h3>Delivery Status ({progInfo.status})</h3>
              
              <div className="stepper-horizontal" style={{ marginTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', textAlign: 'center' }}>
                  {[
                    { num: 1, label: 'Placed', icon: '📋' },
                    { num: 2, label: 'Preparing', icon: '🍳' },
                    { num: 3, label: 'Prepared', icon: '📦' },
                    { num: 4, label: 'Handed Over', icon: '🤝' },
                    { num: 5, label: 'Out for Delivery', icon: '🛵' },
                    { num: 6, label: 'Delivered', icon: '✅' }
                  ].map(s => (
                    <div 
                      key={s.num} 
                      style={{ 
                        opacity: progInfo.step >= s.num ? 1 : 0.4,
                        background: progInfo.step >= s.num ? '#FEF3C7' : '#F3F4F6',
                        border: progInfo.step === s.num ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '8px 2px'
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>{s.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px', color: '#1F2937' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="map-wrapper-card" style={{ position: 'relative' }}>
              <div id="map-tracker" style={{ height: '360px' }}></div>
              
              {/* Recenter Button Overlay */}
              <button
                type="button"
                onClick={handleRecenterMap}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 1000,
                  backgroundColor: '#ffffff',
                  color: '#1F2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🎯 Recenter to Rider
              </button>
            </div>

            {/* Rating Section (Only when Completed) */}
            {(order.status === 'completed' || order.status === 'delivered') && (
              <div className="rating-feedback-card" style={{ marginTop: '24px' }}>
                {order.rating ? (
                  <div className="rating-success-message">
                    <h4>🎉 Thank you for your feedback!</h4>
                    <p>Your review helps us keep NaanNow high quality.</p>
                    <div className="rating-summary-stars">
                      Rider Rating: {'⭐'.repeat(order.rating.riderRating || 5)}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback}>
                    <h3>⭐ Share Your Experience</h3>
                    <p className="subtitle">Tell us how your rider did and how you liked the food!</p>

                    <div className="rating-section">
                      <h4>How was your Rider ({order.riderId?.name || 'Delivery Rider'})?</h4>
                      <div className="stars-selector-row">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${riderRating >= star ? 'active' : ''}`}
                            onClick={() => setRiderRating(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-textarea"
                        placeholder="Write a message about the delivery... (optional)"
                        rows={2}
                        value={riderReview}
                        onChange={(e) => setRiderReview(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn-submit-rating">
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* RIGHT: RIDER PROFILE & CHAT (ONLY SHOWN AFTER RIDER ACCEPTS) */}
          <div className="track-rider-column" ref={chatSectionRef}>
            
            {hasRider ? (
              <>
                {/* Rider Identity Card (Dynamic from DB) */}
                <div className="rider-card">
                  <div className="rider-avatar-row">
                    <div className="rider-avatar">
                      <span>{order.riderId?.name ? order.riderId.name.slice(0, 2).toUpperCase() : 'RD'}</span>
                      <span className="online-indicator"></span>
                    </div>
                    <div className="rider-meta">
                      <h4>{order.riderId.name}</h4>
                      <p className="rating">
                        ⭐ {order.riderId.rating > 0 ? order.riderId.rating : 'New Rider'}
                      </p>
                      <p className="vehicle">
                        {order.riderId.bikeModel || order.riderId.vehicleDetails || 'Bike'} ({order.riderId.bikeColor || 'Black'}) • <strong className="plate">{order.riderId.licensePlate || 'Registered'}</strong>
                      </p>
                    </div>
                  </div>
                  <button className="btn-call" onClick={handleCallRider}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Call Rider
                  </button>
                </div>

                {/* Dynamic Async Chat Module */}
                <div className="chat-wrapper-card">
                  <div className="chat-header">
                    <h4>Message Center</h4>
                    <span className="chat-badge-lbl">Rider Chat</span>
                  </div>
                  
                  {/* Message List */}
                  <div className="chat-messages-container" ref={chatContainerRef} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {messages.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', marginTop: '20px' }}>
                        No messages yet. Send a message to your rider below.
                      </p>
                    ) : (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`message-bubble-wrapper ${msg.sender}`}>
                          <div className="bubble">
                            <p className="msg-text">{msg.text}</p>
                            <span className="msg-time">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input with Visible Send Icon */}
                  <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Type a message to rider..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={order.status === 'delivered' || order.status === 'completed'}
                    />
                    <button 
                      type="submit" 
                      className="btn-send-message"
                      disabled={!inputText.trim() || order.status === 'delivered' || order.status === 'completed'}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E57919', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '36px' }}>🛵</span>
                <h4 style={{ margin: '12px 0 6px 0', color: '#1F2937' }}>Searching for a Rider</h4>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  Rider details and direct chat will open as soon as a rider accepts your order.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default TrackOrderPage;
