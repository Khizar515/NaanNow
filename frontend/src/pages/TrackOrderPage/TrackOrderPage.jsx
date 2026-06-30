import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TrackOrderPage.css';

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

// Web Audio API dual-tone notification chime
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    // Friendly dual-tone notification chime
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.08); // A5

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.log('Web Audio Context error:', e);
  }
};

const getOrderProgress = (order) => {
  if (order.status === 'Completed') {
    return { status: 'Completed', step: 4, remaining: 0 };
  }

  const elapsed = (new Date().getTime() - new Date(order.date).getTime()) / 1000;

  if (elapsed < 15) {
    return { status: 'Preparing', step: 1, remaining: Math.ceil(55 - elapsed) };
  } else if (elapsed < 30) {
    return { status: 'Baking', step: 2, remaining: Math.ceil(55 - elapsed) };
  } else if (elapsed < 55) {
    return { status: 'Delivering', step: 3, remaining: Math.ceil(55 - elapsed) };
  } else {
    return { status: 'Completed', step: 4, remaining: 0 };
  }
};

function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [tick, setTick] = useState(0);
  const [liveOrderState, setLiveOrderState] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'rider',
      text: 'Salam! I am Raja Kamran, your rider. I am heading to the restaurant to collect your hot order. 🛵',
      time: new Date(Date.now() - 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Leaflet refs
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const mapInitRef = useRef(false);
  const chatEndRef = useRef(null);
  const chatSectionRef = useRef(null);

  const scrollToChat = () => {
    if (chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Message trigger refs to prevent double messages on ticks
  const triggeredMsgs = useRef({
    baking: false,
    delivering: false,
    completed: false
  });

  // Load Leaflet Script
  useEffect(() => {
    loadLeaflet(() => {
      setLeafletLoaded(true);
    });
  }, []);

  // Fetch Order
  useEffect(() => {
    const saved = localStorage.getItem('naannow_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      setOrders(parsed);
      const found = parsed.find(o => o.id === orderId);
      if (found) {
        setOrder(found);
      }
    }
  }, [orderId]);

  // Tick timer
  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Compute live order state
  useEffect(() => {
    if (!order) return;

    const progress = getOrderProgress(order);
    setLiveOrderState({
      liveStatus: progress.status,
      liveStep: progress.step,
      remainingTime: progress.remaining
    });

    // Write back completed state to localStorage if transitioned
    const elapsed = (new Date().getTime() - new Date(order.date).getTime()) / 1000;
    if (elapsed >= 55 && order.status !== 'Completed') {
      const updatedOrders = JSON.parse(localStorage.getItem('naannow_orders') || '[]').map(o => {
        if (o.id === order.id) {
          return { ...o, status: 'Completed' };
        }
        return o;
      });
      localStorage.setItem('naannow_orders', JSON.stringify(updatedOrders));
      setOrder(prev => ({ ...prev, status: 'Completed' }));
    }
  }, [order, tick]);

  // Scroll to bottom of chat whenever messages list changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Handle automatic messages from rider based on progress
  useEffect(() => {
    if (!liveOrderState || !order) return;

    const status = liveOrderState.liveStatus;

    if (status === 'Baking' && !triggeredMsgs.current.baking) {
      triggeredMsgs.current.baking = true;
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'rider',
            text: 'Tandoor is heating up! The chefs are baking your fresh naans now. Smells incredible! 🥯🔥',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        playNotificationSound();
      }, 1000);
    }

    if (status === 'Delivering' && !triggeredMsgs.current.delivering) {
      triggeredMsgs.current.delivering = true;
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'rider',
            text: 'I have picked up your order! Fresh out of the oven. Speeding your way now! 🛵💨',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        playNotificationSound();
      }, 1000);
    }

    if (status === 'Completed' && !triggeredMsgs.current.completed) {
      triggeredMsgs.current.completed = true;
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'rider',
            text: 'Arrived at your doorstep! Please receive your warm NaanNow meal. Enjoy! 😊👍',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        playNotificationSound();
      }, 1000);
    }
  }, [liveOrderState, order]);

  // Initialize Map and handle real-time Rider marker placement
  useEffect(() => {
    if (!leafletLoaded || !order || mapInitRef.current) return;

    const L = window.L;

    // Create Map centered in Islamabad F-10/F-8 area
    const map = L.map('map-tracker', {
      zoomControl: false,
      attributionControl: false
    }).setView([33.6873, 73.0205], 14);

    mapRef.current = map;
    mapInitRef.current = true;

    // Zoom controls in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Div icons with emoji & pulsing animations
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

    // Add markers
    L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map)
      .bindPopup(`<b>${order.restaurantName}</b><br/>Clay oven tandoor output`);

    L.marker(customerCoords, { icon: customerIcon }).addTo(map)
      .bindPopup(`<b>Your Address</b><br/>${order.address}`);

    // Create path line
    const polyline = L.polyline(routePath, {
      color: 'var(--color-tandoori)',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 12',
      className: 'route-polyline'
    }).addTo(map);
    polylineRef.current = polyline;

    // Create rider marker initial position
    const riderMarker = L.marker(restaurantCoords, { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    // Fit map bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitRef.current = false;
      }
    };
  }, [leafletLoaded, order]);

  // Update Rider Location dynamically on the map based on simulated coordinates
  useEffect(() => {
    if (!order || !riderMarkerRef.current || !liveOrderState) return;

    const elapsed = (new Date().getTime() - new Date(order.date).getTime()) / 1000;
    let targetCoords = restaurantCoords;

    if (liveOrderState.liveStatus === 'Delivering') {
      const p = Math.min(Math.max((elapsed - 30) / 25, 0), 1);
      targetCoords = getPointAlongPath(routePath, p);
    } else if (liveOrderState.liveStatus === 'Completed') {
      targetCoords = customerCoords;
    }

    // Set position
    riderMarkerRef.current.setLatLng(targetCoords);

    // Pan map to follow rider slightly if delivering
    if (liveOrderState.liveStatus === 'Delivering' && mapRef.current) {
      mapRef.current.panTo(targetCoords, { animate: true, duration: 0.5 });
    }
  }, [liveOrderState, order]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const lowerText = userMsg.text.toLowerCase();

    // Rider automated response simulation after a short delay
    setTimeout(() => {
      let replyText = "Got it! I am currently focused on driving safely. Will talk soon! 🛵";

      if (liveOrderState?.liveStatus === 'Completed') {
        replyText = "Your hot naan order is already delivered! Hope you love it. Please review us on the store! 😊👍";
      } else if (lowerText.includes('where') || lowerText.includes('location') || lowerText.includes('map') || lowerText.includes('eta') || lowerText.includes('time') || lowerText.includes('kahan')) {
        if (liveOrderState?.liveStatus === 'Preparing' || liveOrderState?.liveStatus === 'Baking') {
          replyText = "I am waiting at the restaurant. They are cooking it right now, will pick up soon! 🍕";
        } else {
          const rem = liveOrderState?.remainingTime || 12;
          replyText = `I have crossed the main road, heading towards your house. Map shows my live position! Arriving in about ${rem} seconds. 🏍️`;
        }
      } else if (lowerText.includes('hot') || lowerText.includes('fresh') || lowerText.includes('garam') || lowerText.includes('oven')) {
        replyText = "Don't worry! I have the food inside my special thermal heat-bag. It will remain extremely hot and soft! 🎒🔥";
      } else if (lowerText.includes('call') || lowerText.includes('phone') || lowerText.includes('number') || lowerText.includes('contact')) {
        replyText = `Understood! I will call you on your number (${order?.phone || '0300-1234567'}) as soon as I arrive at your gate! 📞`;
      } else if (lowerText.includes('sauce') || lowerText.includes('raita') || lowerText.includes('coke') || lowerText.includes('chilli') || lowerText.includes('extra') || lowerText.includes('bread')) {
        replyText = "Yes, I verified the checklist with the chef. Everything you ordered is packed inside the bag! 📦✅";
      } else if (lowerText.includes('salam') || lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
        replyText = "Walaikum Assalam! Doing great, hope you are hungry. Speeding to bring your delicious flatbreads! 😃";
      } else if (lowerText.includes('thank') || lowerText.includes('thanks') || lowerText.includes('shukriya') || lowerText.includes('great') || lowerText.includes('ok')) {
        replyText = "No worries at all! Serving you fresh food is my pleasure. 🌟";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'rider',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
      playNotificationSound();
    }, 1500 + Math.random() * 800);
  };

  const handleFakeCall = () => {
    alert(`📞 Calling Rider Raja Kamran (+92 300 9821245) via cellular bridge...\n\n(Rider's screen: "Incoming call from ${order?.name || 'Customer'}").`);
  };

  if (!order) {
    return (
      <div className="track-order-fallback">
        <div className="fallback-card">
          <h2>Order Not Found</h2>
          <p>We couldn't locate this order ID in your session cache.</p>
          <button className="back-orders-btn" onClick={() => navigate('/orders')}>
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const getStepClass = (stepNum, currentStep) => {
    if (currentStep > stepNum) return 'tracker-step-done';
    if (currentStep === stepNum) return 'tracker-step-active';
    return 'tracker-step-pending';
  };

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
            <h2>Order Tracking: <span className="ref-id">{order.id}</span></h2>
            <p>From: <strong>{order.restaurantName}</strong> • Speed: <strong>{order.deliverySpeed === 'priority' ? '⚡ Priority' : '🛵 Standard'}</strong></p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="track-grid">
          
          {/* LEFT: MAP & PROGRESS */}
          <div className="track-map-column">
            
            {/* Map Container */}
            <div className="map-wrapper-card">
              <div id="map-tracker"></div>
              
              {/* Overlay Float Card */}
              {liveOrderState && (
                <div className="map-overlay-banner">
                  <div className="overlay-indicator">
                    <span className="live-dot"></span>
                    <span className="live-status-lbl">
                      {liveOrderState.liveStatus === 'Preparing' && '🥣 Kitchen Preparing'}
                      {liveOrderState.liveStatus === 'Baking' && '🔥 Baking Hot Naan'}
                      {liveOrderState.liveStatus === 'Delivering' && '🛵 Transit to Address'}
                      {liveOrderState.liveStatus === 'Completed' && '✅ Order Arrived'}
                    </span>
                  </div>
                  {liveOrderState.liveStatus !== 'Completed' ? (
                    <div className="overlay-eta">
                      ETA: <strong>{liveOrderState.remainingTime}s</strong>
                    </div>
                  ) : (
                    <div className="overlay-eta arrived">
                      Delivered
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Progress */}
            {liveOrderState && (
              <div className="status-progress-card">
                <h3>Delivery Status</h3>
                
                <div className="stepper-horizontal">
                  <div className="stepper-line">
                    <div 
                      className="stepper-fill" 
                      style={{ 
                        width: `${
                          liveOrderState.liveStep === 1 ? '0%' :
                          liveOrderState.liveStep === 2 ? '33%' :
                          liveOrderState.liveStep === 3 ? '66%' : '100%'
                        }` 
                      }}
                    ></div>
                  </div>

                  <div className="steps-row">
                    <div className={`step-item ${getStepClass(1, liveOrderState.liveStep)}`}>
                      <div className="step-circle">🥣</div>
                      <span className="step-text">Prepared</span>
                    </div>

                    <div className={`step-item ${getStepClass(2, liveOrderState.liveStep)}`}>
                      <div className="step-circle">🔥</div>
                      <span className="step-text">Baking</span>
                    </div>

                    <div className={`step-item ${getStepClass(3, liveOrderState.liveStep)}`}>
                      <div className="step-circle">🛵</div>
                      <span className="step-text">On the Way</span>
                    </div>

                    <div className={`step-item ${getStepClass(4, liveOrderState.liveStep)}`}>
                      <div className="step-circle">✅</div>
                      <span className="step-text">Arrived</span>
                    </div>
                  </div>
                </div>

                <div className="progress-note">
                  {liveOrderState.liveStep === 1 && "👩‍🍳 The chef is preparing your customized naans and curries."}
                  {liveOrderState.liveStep === 2 && "🔥 Baking your flatbreads inside the clay oven tandoor for perfect crunch."}
                  {liveOrderState.liveStep === 3 && "🛵 Rider has collected the order and is driving to your location."}
                  {liveOrderState.liveStep === 4 && "✨ Food is here! Please open the door and enjoy your fresh warm meal."}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: RIDER PROFILE & CHAT */}
          <div className="track-rider-column" ref={chatSectionRef}>
            
            {/* Rider Identity Card */}
            <div className="rider-card">
              <div className="rider-avatar-row">
                <div className="rider-avatar">
                  <span>RK</span>
                  <span className="online-indicator"></span>
                </div>
                <div className="rider-meta">
                  <h4>Raja Kamran</h4>
                  <p className="rating">⭐ 4.9 (120+ trips)</p>
                  <p className="vehicle">Honda CD70 • <strong className="plate">ICT-9821</strong></p>
                </div>
              </div>
              <button className="btn-call" onClick={handleFakeCall}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Call Rider
              </button>
            </div>

            {/* Chat Module */}
            <div className="chat-wrapper-card">
              <div className="chat-header">
                <h4>Message Center</h4>
                <span className="chat-badge-lbl">Live Connection</span>
              </div>
              
              {/* Message List */}
              <div className="chat-messages-container">
                {messages.map(msg => (
                  <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}`}>
                    <div className="bubble">
                      <p className="msg-text">{msg.text}</p>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-bubble-wrapper rider">
                    <div className="bubble typing-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message to the rider..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={liveOrderState?.liveStatus === 'Completed'}
                />
                <button 
                  type="submit" 
                  className="btn-send-message"
                  disabled={!inputText.trim() || liveOrderState?.liveStatus === 'Completed'}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Chat FAB for Mobiles */}
      <button className="mobile-chat-fab" onClick={scrollToChat} aria-label="Scroll to Chat">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
  );
}

export default TrackOrderPage;
