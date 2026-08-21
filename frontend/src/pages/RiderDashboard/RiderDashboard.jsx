import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import BlockedTicketWidget from '../../components/BlockedTicketWidget/BlockedTicketWidget';
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
  const [currentUser, setCurrentUser] = useState(null);

  // Wizard state for verification
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    dob: '',
    address: '',
    cnicNumber: '',
    cnicFront: '',
    cnicBack: '',
    licenseNumber: '',
    licenseImage: '',
    bikeRegistration: '',
    bikeModel: '',
    bikeColor: '',
    avatar: '',
    bankName: '',
    accountNumber: '',
    walletNumber: ''
  });
  const [wizardError, setWizardError] = useState('');

  const [wizardFiles, setWizardFiles] = useState({});

  const formatCNIC = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setWizardFiles(prev => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setWizardData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResubmitAction = () => {
    setWizardStep(1);
    setCurrentUser(prev => ({ ...prev, status: 'unverified' }));
  };

  const handleWizardSubmit = async (e) => {
    e.preventDefault();
    setWizardError('');

    const { dob, address, cnicNumber, cnicFront, cnicBack, licenseNumber, licenseImage, bikeRegistration, bikeModel, bikeColor, avatar } = wizardData;

    if (!dob || !address || !cnicNumber || !cnicFront || !cnicBack || !licenseNumber || !licenseImage || !bikeRegistration || !bikeModel || !bikeColor || !avatar) {
      setWizardError('Please fill in all required fields and upload all requested documents.');
      return;
    }

    const age = calculateAge(dob);
    if (age < 18) {
      setWizardError('Rider must be at least 18 years old.');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(wizardData).forEach(key => {
        if (wizardFiles[key]) {
          formData.append(key, wizardFiles[key]);
        } else if (wizardData[key]) {
          formData.append(key, wizardData[key]);
        }
      });
      // specific rider fields
      formData.append('vehicleDetails', `${wizardData.bikeModel} (${wizardData.bikeColor})`);
      formData.append('licensePlate', wizardData.bikeRegistration);

      const updatedUser = await api.uploadDocs(formData);
      setCurrentUser(updatedUser);
      alert('Verification submitted successfully!');
    } catch (err) {
      console.error(err);
      setWizardError('Failed to submit verification.');
    }
  };

  // Load user details and verify role/status on mount
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const user = await api.getMe();
        if (user.role !== 'rider') {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
        setIsOnline(user.isOnline !== false);
      } catch (err) {
        navigate('/login');
      }
    };
    const fetchSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (settings) setPlatformSettings(settings);
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      }
    };
    fetchAuth();
    fetchSettings();
  }, [navigate]);

  // Rider state
  const [isOnline, setIsOnline] = useState(true);

  const handleToggleOnline = async (newVal) => {
    setIsOnline(newVal);
    try {
      await api.toggleRiderOnline(newVal);
    } catch (err) {
      console.error("Failed to toggle online status:", err);
    }
  };
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'active', 'history'
  const [platformSettings, setPlatformSettings] = useState({ deliveryCharges: 150 });
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 100 %

  // Earnings summary
  const [stats, setStats] = useState({
    todayEarnings: 0,
    tripsCount: 0,
    tipsAmount: 0,
    rating: currentUser?.rating || 0
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
  // Fetch all orders from API
  useEffect(() => {
    if (currentUser?.status !== 'approved') return;

    const fetchOrders = async () => {
      try {
        const parsed = await api.getOrders();
        setOrders(parsed);

        // Defer setting the initialized flag to prevent scrolling on mount
        if (!isInitializedRef.current) {
          setTimeout(() => {
            isInitializedRef.current = true;
          }, 500);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };

    fetchOrders();

    // Check periodically for order changes
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Filter orders based on tabs
  const availableOrders = orders.filter(
    o => ['pending', 'preparing', 'ready_for_pickup'].includes(o.status) && !o.riderId
  );
  const activeOrders = orders.filter(
    o => ['ready_for_pickup', 'out_for_delivery'].includes(o.status) && o.riderId?._id === currentUser?._id
  );
  const completedOrders = orders.filter(
    o => ['delivered', 'completed'].includes(o.status) && o.riderId?._id === currentUser?._id
  );

  // Compute completed earnings
  useEffect(() => {
    const trips = completedOrders.length;
    const baseEarnings = completedOrders.reduce((sum, o) => sum + (o.deliveryFee || 150), 0);
    const mockTips = trips * 40; // Simulated Rs. 40 tips per trip
    setStats({
      todayEarnings: baseEarnings + mockTips,
      tripsCount: trips,
      tipsAmount: mockTips,
      rating: currentUser?.rating || 0
    });
  }, [orders]);

  // Determine current active selection
  const currentActiveOrder = activeOrders.find(o => o._id === selectedOrderId) || activeOrders[0];
  const activeOrderId = currentActiveOrder?._id;

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
    if (currentActiveOrder.status === 'out_for_delivery' && currentActiveOrder.updatedAt) {
      const elapsed = (new Date().getTime() - new Date(currentActiveOrder.updatedAt).getTime()) / 1000;
      const progress = Math.min(Math.max(elapsed / 25, 0), 1);
      startLoc = getPointAlongPath(routePath, progress);
    } else if (currentActiveOrder.status === 'completed' || currentActiveOrder.status === 'delivered') {
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
    if (!mapRef.current || !riderMarkerRef.current || !currentActiveOrder || currentActiveOrder.status !== 'out_for_delivery') return;

    // If simulating, the simulation interval handles position.
    // Otherwise, calculate real position from dispatchedAt.
    if (isSimulating) return;

    const updatePosition = () => {
      if (!currentActiveOrder.updatedAt) return;
      const elapsed = (new Date().getTime() - new Date(currentActiveOrder.updatedAt).getTime()) / 1000;
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
  const handleRiderSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !currentActiveOrder) return;

    const riderMsg = {
      id: Date.now(),
      sender: 'rider',
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setOrders(prev => prev.map(o => {
      if (o._id === currentActiveOrder._id) {
        return { ...o, messages: [...(o.messages || []), riderMsg] };
      }
      return o;
    }));
    setChatInputText('');

    try {
      await api.addOrderMessage(currentActiveOrder._id, riderMsg.text);
    } catch (err) {
      console.error(err);
    }
  };

  // Simulation Route Travel Runner
  const handleStartSimulation = async () => {
    if (isSimulating || !currentActiveOrder) return;

    setIsSimulating(true);
    setSimProgress(0);

    try {
      const updatedOrder = await api.updateOrderStatus(currentActiveOrder._id, 'out_for_delivery');
      setOrders(prev => prev.map(o => o._id === currentActiveOrder._id ? updatedOrder : o));
    } catch (err) {
      console.error(err);
      setIsSimulating(false);
      return;
    }

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
  const handleAcceptOrder = async (orderId) => {
    try {
      const updatedOrder = await api.assignOrder(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
      setSelectedOrderId(orderId);
      setActiveTab('active');
    } catch (err) {
      console.error(err);
      alert('Could not assign order');
    }
  };

  // Arrive at Restaurant (Chef completes packaging)
  const handleArriveAtRestaurant = async () => {
    if (!currentActiveOrder) return;
    try {
      const updatedOrder = await api.updateOrderStatus(currentActiveOrder._id, 'ready_for_pickup');
      setOrders(prev => prev.map(o => o._id === currentActiveOrder._id ? updatedOrder : o));
    } catch (err) {
      console.error(err);
    }
  };

  // Pick up food packages
  const handlePickUpOrder = async () => {
    if (!currentActiveOrder) return;
    try {
      const updatedOrder = await api.updateOrderStatus(currentActiveOrder._id, 'out_for_delivery');
      setOrders(prev => prev.map(o => o._id === currentActiveOrder._id ? updatedOrder : o));
    } catch (err) {
      console.error(err);
    }
  };

  // Complete delivery
  const handleCompleteOrder = async () => {
    if (!currentActiveOrder) return;
    try {
      const updatedOrder = await api.updateOrderStatus(currentActiveOrder._id, 'delivered');
      setOrders(prev => prev.map(o => o._id === currentActiveOrder._id ? updatedOrder : o));
      alert("📦 Order marked as delivered! The customer will confirm receipt to complete the order and finalize payout.");
      setActiveTab('history');
    } catch (err) {
      console.error(err);
    }
  };

  // Show loading screen while user data is being fetched
  if (!currentUser) {
    return (
      <div className="dashboard-loading">
        Loading rider portal...
      </div>
    );
  }

  if (currentUser && currentUser.status !== 'approved') {
    const isRevoked = currentUser.status === 'revoked';
    const isRejected = currentUser.status === 'rejected';
    const isPending = currentUser.status === 'pending';
    const isUnverified = currentUser.status === 'unverified';

    return (
      <div className="dashboard-status-screen">
        {isPending ? (
          <div className="status-card" style={{ maxWidth: '600px' }}>
            <div className="status-icon">⏳</div>
            <h2>Application Under Review</h2>
            <p className="status-message" style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              Your documents are currently under review.<br />
              <strong>Our team will verify your information before activating your account.</strong>
            </p>
            <div className="submitted-details-box" style={{ background: '#fcfaf7', border: '1px solid rgba(79,46,29,0.08)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px', fontSize: '13px' }}>
              <h4 style={{ color: 'var(--color-roasted)', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Submitted Verification Summary:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><strong>Full Name:</strong> {currentUser.name}</div>
                <div><strong>CNIC Number:</strong> {currentUser.cnicNumber || 'Submitted'}</div>
                <div><strong>Vehicle details:</strong> {currentUser.vehicleDetails || 'Submitted'}</div>
                <div><strong>Status:</strong> Pending Approval</div>
              </div>
            </div>
            <button className="btn-logout" onClick={() => {
              localStorage.removeItem('naannow_token');
              navigate('/login');
            }}>
              Log Out
            </button>
          </div>
        ) : (isUnverified || isRejected || isRevoked) ? (
          <div className="status-card" style={{ maxWidth: '720px', textAlign: 'left', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <div>
                <span className="admin-badge" style={{ backgroundColor: 'rgba(229,121,25,0.08)' }}>Rider Verification & Conflict Portal</span>
                <h2 style={{ marginTop: '8px', fontSize: '22px', fontWeight: '800' }}>
                  {isRevoked ? '🚫 Rider Approval Revoked' : 'Rider Verification Status'}
                </h2>
              </div>
            </div>

            {isRevoked && (
              <div className="auth-error-alert" style={{ marginBottom: '20px', backgroundColor: '#fef2f2', border: '1.5px solid #fca5a5', padding: '16px', borderRadius: '10px', color: '#b91c1c' }}>
                <strong style={{ fontSize: '15px', display: 'block', marginBottom: '6px' }}>⚠️ Approval Revoked by Administrator:</strong>
                <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5' }}>Reason: "{currentUser.rejectionReason || 'Compliance issue detected. Please re-upload valid verification documents to request re-approval.'}"</p>
              </div>
            )}

            {isRejected && (
              <div className="auth-error-alert" style={{ marginBottom: '20px', backgroundColor: '#fef2f2', border: '1.5px solid #fca5a5', padding: '14px', borderRadius: '10px', color: '#b91c1c' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>⚠️ Registration Rejected by Admin:</strong>
                <p style={{ fontSize: '13px', margin: 0 }}>Reason: "{currentUser.rejectionReason || 'Please check and resubmit your details.'}"</p>
              </div>
            )}

            <div className="wizard-progress-bar" style={{ display: 'flex', gap: '4px', marginBottom: '24px', height: '6px' }}>
              <div style={{ flex: 1, backgroundColor: wizardStep >= 1 ? 'var(--color-tandoori)' : '#e5e7eb', borderRadius: '3px' }} />
              <div style={{ flex: 1, backgroundColor: wizardStep >= 2 ? 'var(--color-tandoori)' : '#e5e7eb', borderRadius: '3px' }} />
              <div style={{ flex: 1, backgroundColor: wizardStep >= 3 ? 'var(--color-tandoori)' : '#e5e7eb', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '24px', fontWeight: '600' }}>
              <span style={{ color: wizardStep === 1 ? 'var(--color-tandoori)' : '#888' }}>1. Personal & CNIC</span>
              <span style={{ color: wizardStep === 2 ? 'var(--color-tandoori)' : '#888' }}>2. Bike & License</span>
              <span style={{ color: wizardStep === 3 ? 'var(--color-tandoori)' : '#888' }}>3. Profile & Bank</span>
            </div>

            {wizardError && <div className="auth-error-alert" style={{ marginBottom: '16px' }}>{wizardError}</div>}

            <form onSubmit={handleWizardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {wizardStep === 1 && (
                <>
                  <div className="form-group-field">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      min="1930-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      value={wizardData.dob}
                      onChange={(e) => {
                        setWizardData({ ...wizardData, dob: e.target.value });
                        if (e.target.value && calculateAge(e.target.value) < 18) {
                          setWizardError('Warning: You must be at least 18 years old to register as a rider.');
                        } else {
                          setWizardError('');
                        }
                      }}
                      required
                    />
                    {wizardData.dob && calculateAge(wizardData.dob) < 18 && (
                      <span style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                        ⚠️ You are under 18 years old ({calculateAge(wizardData.dob)} years). Minimum age required is 18.
                      </span>
                    )}
                  </div>
                  <div className="form-group-field">
                    <label>Current Address</label>
                    <input
                      type="text"
                      placeholder="Enter your home address"
                      value={wizardData.address}
                      onChange={(e) => setWizardData({ ...wizardData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-field">
                    <label>CNIC Number</label>
                    <input
                      type="text"
                      placeholder="00000-0000000-0"
                      value={wizardData.cnicNumber}
                      onChange={(e) => setWizardData({ ...wizardData, cnicNumber: formatCNIC(e.target.value) })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', boxSizing: 'border-box' }}>
                    <div className="form-group-field">
                      <label>CNIC Front Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cnicFront')}
                        required={!wizardData.cnicFront}
                      />
                      {wizardData.cnicFront && (
                        <div style={{ marginTop: '8px' }}>
                          <img src={wizardData.cnicFront} alt="CNIC Front Preview" style={{ height: '55px', borderRadius: '6px', border: '1px solid #ddd', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                    <div className="form-group-field">
                      <label>CNIC Back Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cnicBack')}
                        required={!wizardData.cnicBack}
                      />
                      {wizardData.cnicBack && (
                        <div style={{ marginTop: '8px' }}>
                          <img src={wizardData.cnicBack} alt="CNIC Back Preview" style={{ height: '55px', borderRadius: '6px', border: '1px solid #ddd', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div className="form-group-field">
                    <label>Driving License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. KP-882199A"
                      value={wizardData.licenseNumber}
                      onChange={(e) => setWizardData({ ...wizardData, licenseNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-field">
                    <label>Driving License Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'licenseImage')}
                      required={!wizardData.licenseImage}
                    />
                    {wizardData.licenseImage && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={wizardData.licenseImage} alt="License Preview" style={{ height: '55px', borderRadius: '6px', border: '1px solid #ddd', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                  <div className="form-group-field">
                    <label>Bike Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ICT-4491"
                      value={wizardData.bikeRegistration}
                      onChange={(e) => setWizardData({ ...wizardData, bikeRegistration: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group-field">
                      <label>Bike Model</label>
                      <input
                        type="text"
                        placeholder="e.g. Honda CD70"
                        value={wizardData.bikeModel}
                        onChange={(e) => setWizardData({ ...wizardData, bikeModel: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group-field">
                      <label>Bike Color</label>
                      <input
                        type="text"
                        placeholder="e.g. Red"
                        value={wizardData.bikeColor}
                        onChange={(e) => setWizardData({ ...wizardData, bikeColor: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <>
                  <div className="form-group-field">
                    <label>Rider Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'avatar')}
                      required={!wizardData.avatar}
                    />
                    {wizardData.avatar && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={wizardData.avatar} alt="Profile Preview" style={{ height: '65px', width: '65px', borderRadius: '50%', border: '1px solid #ddd', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                  <div className="form-group-field">
                    <label>Bank Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Meezan Bank"
                      value={wizardData.bankName}
                      onChange={(e) => setWizardData({ ...wizardData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label>Account Number / IBAN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. PK92MEZN001234567890"
                      value={wizardData.accountNumber}
                      onChange={(e) => setWizardData({ ...wizardData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label>Easypaisa/JazzCash Mobile Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="0000-0000000"
                      value={wizardData.walletNumber}
                      onChange={(e) => setWizardData({ ...wizardData, walletNumber: formatPhone(e.target.value) })}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {wizardStep > 1 && (
                  <button type="button" className="btn-detail-view" onClick={() => setWizardStep(wizardStep - 1)} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '600' }}>
                    Back
                  </button>
                )}
                {wizardStep < 3 ? (
                  <button type="button" className="btn-logout" onClick={() => {
                    const { dob, address, cnicNumber, cnicFront, cnicBack, licenseNumber, licenseImage, bikeRegistration, bikeModel, bikeColor } = wizardData;
                    if (wizardStep === 1) {
                      if (!dob || !address || !cnicNumber || !cnicFront || !cnicBack) {
                        setWizardError('Please fill in all fields before proceeding.');
                        return;
                      }
                      if (calculateAge(dob) < 18) {
                        setWizardError('Form submission paused: You must be at least 18 years old to proceed.');
                        return;
                      }
                    }
                    if (wizardStep === 2 && (!licenseNumber || !licenseImage || !bikeRegistration || !bikeModel || !bikeColor)) {
                      setWizardError('Please fill in all fields before proceeding.');
                      return;
                    }
                    setWizardError('');
                    setWizardStep(wizardStep + 1);
                  }} style={{ flex: 1 }}>
                    Next Step
                  </button>
                ) : (
                  <button type="submit" className="btn-logout" style={{ flex: 1, backgroundColor: 'var(--color-coriander)' }}>
                    Submit Verification
                  </button>
                )}
                {isRejected && (
                  <button type="button" className="btn-detail-view" onClick={handleResubmitAction} style={{ padding: '14px', borderRadius: '12px', fontWeight: '600' }}>
                    Resubmit Documents
                  </button>
                )}
              </div>
            </form>
            <button className="btn-logout" onClick={() => {
              localStorage.removeItem('naannow_token');
              navigate('/login');
            }} style={{ marginTop: '24px', backgroundColor: '#e5e7eb', color: '#4b5563' }}>
              Log Out
            </button>
          </div>
        ) : (
          <div className="status-card" style={{ maxWidth: '680px', textAlign: 'center' }}>
            <div className="status-icon">🔒</div>
            <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>Rider Account Suspended</h2>
            <p className="status-message" style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6', marginBottom: '20px' }}>
              Your rider account has been suspended by system administration.
            </p>
            <div className="submitted-details-box" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '14px', color: '#7f1d1d' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#991b1b', textTransform: 'uppercase', fontSize: '12px' }}>Reason for Suspension:</strong>
              "{currentUser.blockReason || 'Violation of platform terms or rider safety guidelines.'}"
            </div>

            <BlockedTicketWidget user={currentUser} />

            <button className="btn-logout" onClick={() => { localStorage.removeItem('naannow_token'); navigate('/login'); }} style={{ marginTop: '24px' }}>
              Sign Out & Return to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rider-dashboard-page">
      <div className="rider-dashboard-container">

        {/* Rider Header Bar */}
        <div className="rider-header">
          <div className="rider-profile-info">
            <div className="rider-avatar-large">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="rider-name-details">
              <h2>{currentUser.name} (Rider Portal)</h2>
              <p>
                {currentUser.vehicleDetails || 'No vehicle info'} •{' '}
                <strong style={{ color: '#fff' }}>
                  {currentUser.licensePlate || 'N/A'}
                </strong>
              </p>
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
                onChange={(e) => handleToggleOnline(e.target.checked)}
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
            <div className="stat-icon-container">📏</div>
            <div className="stat-info">
              <h3>Per KM Delivery Rate</h3>
              <p className="stat-value">Rs. {platformSettings?.deliveryCharges || 150} / km</p>
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
                    <div key={order._id} className="order-card-rider">
                      <div className="order-card-header">
                        <span className="order-id-lbl">{order.orderNumber}</span>
                        <span className={`speed-tag ${order.deliverySpeed}`}>
                          {order.deliverySpeed === 'priority' ? '⚡ Priority' : '🛵 Standard'}
                        </span>
                      </div>

                      <div className="restaurant-title">{order.restaurantId?.name || 'Restaurant'}</div>

                      <div className="address-item">
                        <span className="address-icon">🥣</span>
                        <span>{order.restaurantId?.address || 'F-10 Markaz, Islamabad'}</span>
                      </div>

                      <div className="address-item">
                        <span className="address-icon">🏠</span>
                        <span>{order.deliveryAddress || order.address}</span>
                      </div>

                      <div className="order-details-summary">
                        <div className="order-bill">Rs. {order.grandTotal}</div>
                        <div className="delivery-payout">
                          Payout: <strong>Rs. {(order.deliveryFee || 150) + 40}</strong>
                        </div>
                      </div>

                      <button
                        className="btn-accept-order"
                        onClick={() => handleAcceptOrder(order._id)}
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
                      <p>ID: <strong>{currentActiveOrder.orderNumber}</strong> • Status: <strong style={{ color: 'var(--color-tandoori)' }}>{currentActiveOrder.status}</strong></p>
                    </div>

                    <div className="active-delivery-body">
                      {/* Waypoints */}
                      <div className="delivery-waypoints">
                        <div className="waypoint-node">
                          <span className="waypoint-label">Restaurant Pick Up</span>
                          <div className="waypoint-name">{currentActiveOrder.restaurantId?.name || 'Restaurant'}</div>
                          <div className="waypoint-address">{currentActiveOrder.restaurantId?.address || 'F-10 Markaz, Islamabad'}</div>
                        </div>

                        <div className="waypoint-node customer-destination">
                          <span className="waypoint-label">Customer Drop Off</span>
                          <div className="waypoint-name">{currentActiveOrder.customerId?.name || currentActiveOrder.name} ({currentActiveOrder.customerId?.phone || currentActiveOrder.phone})</div>
                          <div className="waypoint-address">{currentActiveOrder.deliveryAddress || currentActiveOrder.address}</div>
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
                        {currentActiveOrder.status === 'preparing' || currentActiveOrder.status === 'pending' ? (
                          <>
                            <h4>🍳 Kitchen Preparing...</h4>
                            <p>Chefs are baking naans inside the clay tandoor. You can wait or let them know you've arrived.</p>
                            <button className="btn-lifecycle-action waiting-state" onClick={handleArriveAtRestaurant}>
                              Arrive at Restaurant
                            </button>
                          </>
                        ) : currentActiveOrder.status === 'ready_for_pickup' ? (
                          <>
                            <h4>📦 Order Ready at Counter!</h4>
                            <p>Verify all items are packaged correctly inside the thermal heat bag before picking up.</p>
                            <button className="btn-lifecycle-action waiting-state" onClick={handlePickUpOrder}>
                              Confirm Pick Up & Start Delivery
                            </button>
                          </>
                        ) : currentActiveOrder.status === 'out_for_delivery' ? (
                          <>
                            <h4>🛵 In Transit to Customer</h4>
                            <p>Head to {currentActiveOrder.deliveryAddress || currentActiveOrder.address}. You can simulate the travel navigation on the map.</p>

                            <button className="btn-lifecycle-action delivering-state" onClick={handleCompleteOrder}>
                              Mark as Delivered
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
                    <strong>{stats.tripsCount}</strong> Trips Total<br />
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
