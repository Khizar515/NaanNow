import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import BlockedTicketWidget from '../../components/BlockedTicketWidget/BlockedTicketWidget';
import './RestaurantDashboard.css';

// Image templates for quick menu item creation
const IMAGE_TEMPLATES = [
  { name: 'Classic Naan', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80' },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sizzling Kabab / BBQ', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80' },
  { name: 'Alfredo Pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80' },
  { name: 'Decadent Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80' },
  { name: 'Sparkling Drink', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80' }
];

// Dynamic Leaflet loader
const loadLeaflet = (callback) => {
  if (window.L) {
    callback();
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => callback();
  document.body.appendChild(script);
};

// Leaflet Location Picker Component for Manager
function RestaurantLocationPickerMap({ initialLat, initialLng, onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = initialLat || 33.6923;
  const defaultLng = initialLng || 73.0105;

  useEffect(() => {
    loadLeaflet(() => {
      if (!mapRef.current) return;
      const L = window.L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
        marker.bindPopup('📍 Drag pin or click map to set exact restaurant location').openPopup();

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onLocationSelect([pos.lat, pos.lng]);
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationSelect([lat, lng]);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>
        🗺️ Select Restaurant Location on Map
      </label>
      <div ref={mapRef} style={{ width: '100%', height: '220px', borderRadius: '12px', border: '1px solid #d1d5db', overflow: 'hidden' }} />
      <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
        Click anywhere on the map or drag the pin to set your exact GPS coordinates.
      </span>
    </div>
  );
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Verification Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    cnicNumber: '',
    cnicFront: '',
    cnicBack: '',
    restaurantName: '',
    restaurantAddress: '',
    lat: 33.6923,
    lng: 73.0105,
    city: '',
    mapsLocation: '',
    restaurantPhone: '',
    restaurantEmail: '',
    logo: '',
    cover: '',
    photoFront: '',
    photoKitchen: '',
    photoDining: '',
    certDoc: '',
    licenseDoc: '',
    ntnDoc: '',
    bankName: '',
    holderName: '',
    accountNumber: ''
  });
  const [wizardError, setWizardError] = useState('');
  const [wizardFiles, setWizardFiles] = useState({});

  // Handover OTP state
  const [handoverInputOtp, setHandoverInputOtp] = useState('');

  // Location Update Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationUpdateCoords, setLocationUpdateCoords] = useState([33.6923, 73.0105]);

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

    const { cnicNumber, cnicFront, cnicBack, restaurantName, restaurantAddress, city, restaurantPhone, restaurantEmail, logo, cover, photoFront, photoKitchen, certDoc, licenseDoc, bankName, holderName, accountNumber } = wizardData;

    if (!cnicNumber || !cnicFront || !cnicBack || !restaurantName || !restaurantAddress || !city || !restaurantPhone || !restaurantEmail || !logo || !cover || !photoFront || !photoKitchen || !certDoc || !licenseDoc || !bankName || !holderName || !accountNumber) {
      setWizardError('Please fill in all required fields and upload all requested documents.');
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

      const updatedUser = await api.uploadDocs(formData);
      setCurrentUser(updatedUser);
      alert('Verification submitted successfully!');
    } catch (err) {
      console.error(err);
      setWizardError('Failed to submit verification.');
    }
  };

  // Auth check
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const user = await api.getMe();
        if (user.role !== 'manager') {
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

  // Main State
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantLoadError, setRestaurantLoadError] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({ commission: 15 });
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu'
  const [orderFilter, setOrderFilter] = useState('active'); // 'all' | 'active' | 'past'
  const [menuFilter, setMenuFilter] = useState('All');

  // Menu Modal State
  const [dbCategories, setDbCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    imageFile: null
  });
  const [formError, setFormError] = useState('');

  // Load baseline data
  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await api.getCategories();
        setDbCategories(cats || []);
      } catch (err) {}
      try {
        const rest = await api.getMyRestaurant();
        setSelectedRestaurant(rest);
        if (rest && rest.lat && rest.lng) {
          setLocationUpdateCoords([rest.lat, rest.lng]);
        }
        setRestaurantLoadError(false);
      } catch (err) {
        setRestaurantLoadError(true);
      }
      try {
        const settings = await api.getSettings();
        if (settings) setPlatformSettings(settings);
      } catch (err) {}
      try {
        const resOrders = await api.getOrders();
        setOrders(resOrders);
      } catch (err) {}
    };
    if (currentUser?.status === 'approved') {
      loadData();
    }
  }, [currentUser]);

  // Interval polling
  useEffect(() => {
    if (currentUser?.status !== 'approved') return;
    const interval = setInterval(async () => {
      try {
        const resOrders = await api.getOrders();
        setOrders(resOrders);
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      const resOrders = await api.getOrders();
      setOrders(resOrders);
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleVerifyHandoverOtp = async (orderId) => {
    if (!handoverInputOtp.trim()) {
      return alert("Please enter the Handover OTP provided by the rider.");
    }
    try {
      await api.verifyHandoverOtp(orderId, handoverInputOtp.trim());
      alert("Handover OTP verified successfully! Order status updated to Handed over to rider.");
      setHandoverInputOtp('');
      const resOrders = await api.getOrders();
      setOrders(resOrders);
    } catch (err) {
      alert(err.message || "Incorrect Handover OTP.");
    }
  };

  const handleSaveLocationUpdate = async () => {
    if (!selectedRestaurant) return;
    try {
      await api.updateRestaurantLocation(selectedRestaurant._id, locationUpdateCoords[0], locationUpdateCoords[1]);
      alert("Restaurant location updated! Your restaurant status is now Pending re-approval by Admin.");
      setIsLocationModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert(err.message || "Failed to update location");
    }
  };

  // Menu item CRUD handlers
  const openMenuModal = (mode, item = null) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && item) {
      setEditingItem(item);
      setMenuForm({
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        image: item.image,
        imageFile: null
      });
    } else {
      setEditingItem(null);
      setMenuForm({
        name: '',
        price: '',
        category: dbCategories[0]?.name || 'General',
        description: '',
        image: IMAGE_TEMPLATES[0].url,
        imageFile: null
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.name.trim() || !menuForm.price || !menuForm.category) {
      setFormError('Please fill in Name, Price, and Category.');
      return;
    }

    try {
      let res;
      if (modalMode === 'add') {
        const formData = new FormData();
        formData.append('name', menuForm.name);
        formData.append('price', menuForm.price);
        formData.append('category', menuForm.category);
        formData.append('description', menuForm.description);
        if (menuForm.imageFile) {
          formData.append('image', menuForm.imageFile);
        } else {
          formData.append('image', menuForm.image);
        }
        res = await api.addMenuItem(selectedRestaurant._id, formData);
      } else {
        const formData = new FormData();
        formData.append('name', menuForm.name);
        formData.append('price', menuForm.price);
        formData.append('category', menuForm.category);
        formData.append('description', menuForm.description);
        if (menuForm.imageFile) {
          formData.append('image', menuForm.imageFile);
        } else {
          formData.append('image', menuForm.image);
        }
        res = await api.updateMenuItem(selectedRestaurant._id, editingItem._id || editingItem.id, formData);
      }
      setSelectedRestaurant(res);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await api.deleteMenuItem(selectedRestaurant._id, itemId);
      setSelectedRestaurant(res);
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  if (!currentUser) {
    return <div className="dashboard-loading">Loading portal configurations...</div>;
  }

  // Verification status views
  if (currentUser && currentUser.status !== 'approved') {
    const isPending = currentUser.status === 'pending';
    const isRejected = currentUser.status === 'rejected';

    return (
      <div className="restaurant-portal-container">
        <div className="status-card" style={{ maxWidth: '680px', margin: '60px auto', background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          {isPending ? (
            <>
              <div className="status-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>⌛</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-roasted)', marginBottom: '8px' }}>Manager Approval Pending</h2>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
                Your restaurant registration details and verification documents are under review by system admin.
              </p>
            </>
          ) : isRejected ? (
            <>
              <div className="status-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#991B1B', marginBottom: '8px' }}>Registration Application Rejected</h2>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>Reason: "{currentUser.rejectionReason || 'Documents incomplete or invalid'}"</p>
            </>
          ) : (
            <form onSubmit={handleWizardSubmit}>
              <h2>Manager Verification Wizard</h2>
              {/* Wizard Steps */}
              {wizardStep === 1 && (
                <div>
                  <h3>Step 1: CNIC & Identity</h3>
                  <div className="form-group-field" style={{ marginBottom: '12px' }}>
                    <label>CNIC Number</label>
                    <input type="text" placeholder="00000-0000000-0" value={wizardData.cnicNumber} onChange={(e) => setWizardData({ ...wizardData, cnicNumber: formatCNIC(e.target.value) })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group-field">
                      <label>CNIC Front</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cnicFront')} required={!wizardData.cnicFront} />
                    </div>
                    <div className="form-group-field">
                      <label>CNIC Back</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cnicBack')} required={!wizardData.cnicBack} />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <h3>Step 2: Restaurant Profile & Map Location</h3>
                  <div className="form-group-field" style={{ marginBottom: '12px' }}>
                    <label>Restaurant Name</label>
                    <input type="text" placeholder="e.g. KFC (F-10)" value={wizardData.restaurantName} onChange={(e) => setWizardData({ ...wizardData, restaurantName: e.target.value })} required />
                  </div>
                  <div className="form-group-field" style={{ marginBottom: '12px' }}>
                    <label>Address & City</label>
                    <input type="text" placeholder="Address" value={wizardData.restaurantAddress} onChange={(e) => setWizardData({ ...wizardData, restaurantAddress: e.target.value })} required />
                    <input type="text" placeholder="City" value={wizardData.city} onChange={(e) => setWizardData({ ...wizardData, city: e.target.value })} required style={{ marginTop: '8px' }} />
                  </div>

                  <RestaurantLocationPickerMap
                    initialLat={wizardData.lat}
                    initialLng={wizardData.lng}
                    onLocationSelect={(coords) => setWizardData(prev => ({ ...prev, lat: coords[0], lng: coords[1] }))}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group-field">
                      <label>Phone</label>
                      <input type="text" placeholder="0300-0000000" value={wizardData.restaurantPhone} onChange={(e) => setWizardData({ ...wizardData, restaurantPhone: formatPhone(e.target.value) })} required />
                    </div>
                    <div className="form-group-field">
                      <label>Email</label>
                      <input type="email" placeholder="Email" value={wizardData.restaurantEmail} onChange={(e) => setWizardData({ ...wizardData, restaurantEmail: e.target.value })} required />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <h3>Step 3: Verification Documents & Bank Account</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group-field">
                      <label>Registration Cert</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'certDoc')} required={!wizardData.certDoc} />
                    </div>
                    <div className="form-group-field">
                      <label>Food Auth License</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'licenseDoc')} required={!wizardData.licenseDoc} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group-field">
                      <label>Bank Name</label>
                      <input type="text" value={wizardData.bankName} onChange={(e) => setWizardData({ ...wizardData, bankName: e.target.value })} required />
                    </div>
                    <div className="form-group-field">
                      <label>Account / IBAN</label>
                      <input type="text" value={wizardData.accountNumber} onChange={(e) => setWizardData({ ...wizardData, accountNumber: e.target.value })} required />
                    </div>
                  </div>
                </div>
              )}

              {wizardError && <p style={{ color: 'red', marginTop: '12px' }}>{wizardError}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                {wizardStep > 1 && <button type="button" className="sub-tab-btn" onClick={() => setWizardStep(wizardStep - 1)}>Back</button>}
                {wizardStep < 3 ? (
                  <button type="button" className="action-advance-btn btn-prepare" onClick={() => setWizardStep(wizardStep + 1)}>Next Step</button>
                ) : (
                  <button type="submit" className="action-advance-btn btn-complete">Submit Registration</button>
                )}
              </div>
            </form>
          )}

          <button className="sub-tab-btn" onClick={() => { localStorage.removeItem('naannow_token'); navigate('/login'); }} style={{ marginTop: '24px' }}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.status === 'approved' && !selectedRestaurant) {
    if (restaurantLoadError) {
      return (
        <div className="dashboard-loading" style={{ flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px' }}>🏪</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-roasted)' }}>No Restaurant Found</h2>
          <p style={{ maxWidth: '400px', lineHeight: '1.6', color: '#666' }}>Your account is approved but no restaurant is linked yet. Please contact admin.</p>
          <button className="sub-tab-btn" style={{ maxWidth: '200px' }} onClick={() => { localStorage.removeItem('naannow_token'); navigate('/login'); }}>Log Out</button>
        </div>
      );
    }
    return <div className="dashboard-loading">Loading portal configurations...</div>;
  }

  const restaurantOrders = orders;
  const completedOrders = restaurantOrders.filter(o => o.status === 'delivered' || o.status === 'completed');
  const activeOrdersCount = restaurantOrders.filter(o => ['pending', 'preparing', 'ready_for_pickup', 'handed_over', 'out_for_delivery'].includes(o.status)).length;
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  const filteredOrders = restaurantOrders.filter(order => {
    if (orderFilter === 'active') return ['pending', 'preparing', 'ready_for_pickup', 'handed_over', 'out_for_delivery'].includes(order.status);
    if (orderFilter === 'past') return order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled';
    return true;
  });

  const activeOrder = restaurantOrders.find(o => o._id === selectedOrderId) || filteredOrders[0];

  const menuCategories = ['All', ...dbCategories.map(c => c.name)];
  const filteredMenuItems = selectedRestaurant?.menu ? selectedRestaurant.menu.filter(item => {
    if (menuFilter === 'All') return true;
    return item.category === menuFilter;
  }) : [];

  return (
    <div className="restaurant-portal-container">
      {/* 1. Portal Header Bar */}
      <div className="portal-header" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75)), url(${selectedRestaurant?.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src={selectedRestaurant?.logo || 'https://via.placeholder.com/85'} alt="Logo" className="portal-logo-img" />
          <div className="portal-meta">
            <span className="portal-badge">{selectedRestaurant?.cuisine || 'Hot Tandoori Outlet'}</span>
            <h1>{selectedRestaurant?.name}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span>📍 {selectedRestaurant?.address} • {selectedRestaurant?.city}</span>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.2s ease'
                }}
              >
                🗺️ Update Map Location
              </button>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="res-selector-dropdown"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => {
              selectedRestaurant.isOpen = !selectedRestaurant.isOpen;
              setSelectedRestaurant({ ...selectedRestaurant });
            }}
          >
            {selectedRestaurant.isOpen !== false ? '🟢 Open for Orders' : '🔴 Closed'}
          </button>
        </div>
      </div>

      {/* 2. Metrics Grid */}
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

        <div className="metric-card commission" style={{ borderLeft: '4px solid var(--color-tandoori)' }}>
          <div className="card-header">
            <span className="card-title">Platform Commission</span>
            <span className="card-icon">🏷️</span>
          </div>
          <div className="card-value" style={{ color: 'var(--color-tandoori)' }}>{platformSettings?.commission || 15}%</div>
          <div className="card-description">Fixed platform deduction per order</div>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="portal-tabs">
        <button className={`portal-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📋 Orders Manager ({filteredOrders.length})
        </button>
        <button className={`portal-tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍽️ Menu Configurator ({selectedRestaurant.menu.length})
        </button>
      </div>

      {/* 4. Tab Layouts */}
      {activeTab === 'orders' ? (
        <div className="orders-workspace">
          {/* Left Side: Orders Queue */}
          <div className="orders-list-pane">
            <div className="pane-header">
              <h3>Order Queue</h3>
              <div className="order-sub-tabs">
                <button className={`sub-tab-btn ${orderFilter === 'active' ? 'active' : ''}`} onClick={() => { setOrderFilter('active'); setSelectedOrderId(null); }}>
                  Active ({restaurantOrders.filter(o => ['pending', 'preparing', 'ready_for_pickup', 'handed_over', 'out_for_delivery'].includes(o.status)).length})
                </button>
                <button className={`sub-tab-btn ${orderFilter === 'past' ? 'active' : ''}`} onClick={() => { setOrderFilter('past'); setSelectedOrderId(null); }}>
                  Past ({completedOrders.length})
                </button>
                <button className={`sub-tab-btn ${orderFilter === 'all' ? 'active' : ''}`} onClick={() => { setOrderFilter('all'); setSelectedOrderId(null); }}>
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
                  const isActive = activeOrder?._id === order._id;
                  return (
                    <div
                      key={order._id}
                      className={`order-queue-card ${isActive ? 'selected' : ''}`}
                      onClick={() => setSelectedOrderId(order._id)}
                    >
                      <div className="card-top-row">
                        <span className="order-id">{order.orderNumber}</span>
                        <span className={`status-badge-lbl ${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="card-customer">{order.name || order.customerId?.name || 'Customer'}</div>
                      <div className="card-meta-row">
                        <span>Items: {order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                        <span>Rs. {order.totalAmount}</span>
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
                    <h2>Receipt Detail: {activeOrder.orderNumber}</h2>
                    <p className="order-date-time">Placed: {new Date(activeOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`status-badge-lbl large ${activeOrder.status.toLowerCase().replace(/\s/g, '-')}`}>
                    {activeOrder.status}
                  </span>
                </div>

                {/* Workflow Status Controller */}
                <div className="order-status-controller">
                  <h4>Pipeline Action</h4>
                  
                  {activeOrder.status === 'pending' && (
                    <div className="action-row">
                      <p>Customer placed this order. Click to mark cooking in progress:</p>
                      <button className="action-advance-btn btn-prepare" onClick={() => handleUpdateOrderStatus(activeOrder._id, 'preparing')}>
                        Start Cooking (Mark Preparing) 🍳
                      </button>
                    </div>
                  )}

                  {activeOrder.status === 'preparing' && (
                    <div>
                      <p style={{ color: '#D97706', fontWeight: '600', marginBottom: '10px' }}>
                        🔍 Searching for rider — Cooking is in progress! (Food preparation is active).
                      </p>
                      <button className="action-advance-btn btn-ready" onClick={() => handleUpdateOrderStatus(activeOrder._id, 'ready_for_pickup')}>
                        Mark Food Prepared & Packaged 📦
                      </button>
                    </div>
                  )}

                  {(activeOrder.status === 'ready_for_pickup' || (activeOrder.status === 'preparing' && activeOrder.riderId)) && activeOrder.status !== 'handed_over' && (
                    <div style={{ marginTop: '12px', background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1F2937' }}>🤝 Rider Handover Verification</h4>
                      {activeOrder.riderId ? (
                        <>
                          <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '10px' }}>
                            Rider <strong>{activeOrder.riderId.name}</strong> ({activeOrder.riderId.bikeModel || 'Bike'} - {activeOrder.riderId.licensePlate || 'Plate'}) is assigned.
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter 6-char Handover OTP from Rider"
                              value={handoverInputOtp}
                              onChange={(e) => setHandoverInputOtp(e.target.value.toUpperCase())}
                              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', letterSpacing: '2px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyHandoverOtp(activeOrder._id)}
                              className="action-advance-btn btn-dispatch"
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              Verify OTP & Hand Over
                            </button>
                          </div>
                        </>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#D97706' }}>
                          Waiting for rider to accept order to generate Handover OTP...
                        </p>
                      )}
                    </div>
                  )}

                  {activeOrder.status === 'handed_over' && (
                    <div className="action-success-complete">
                      <span>🤝 Order handed over to rider! Rider will mark Out for Delivery.</span>
                    </div>
                  )}

                  {activeOrder.status === 'out_for_delivery' && (
                    <div className="action-success-complete">
                      <span>🛵 Order is currently Out for Delivery with rider.</span>
                    </div>
                  )}

                  {(activeOrder.status === 'completed' || activeOrder.status === 'delivered') && (
                    <div className="action-success-complete">
                      <span>🎉 Order has been fully delivered and completed!</span>
                    </div>
                  )}
                </div>

                {/* Customer Credentials */}
                <div className="details-section customer-info-sec">
                  <h3>Order Details</h3>
                  <div className="customer-details-grid">
                    <div>
                      <strong>Full Name:</strong>
                      <p>{activeOrder.name || activeOrder.customerId?.name || 'Customer'}</p>
                    </div>
                    <div>
                      <strong>Contact Phone:</strong>
                      <p>{activeOrder.phone ? formatPhone(activeOrder.phone) : (activeOrder.customerId?.phone ? formatPhone(activeOrder.customerId.phone) : 'N/A')}</p>
                    </div>
                    <div>
                      <strong>Payment Mode:</strong>
                      <p>{activeOrder.paymentMethod || 'Credit / Debit Card'}</p>
                    </div>
                  </div>
                  <div className="customer-address-sec">
                    <strong>Delivery Address:</strong>
                    <p>{activeOrder.deliveryAddress}</p>
                  </div>
                  {activeOrder.instructions && (
                    <div className="customer-notes">
                      <strong>Cooking/Rider Instructions:</strong>
                      <p className="notes-box">📝 {activeOrder.instructions}</p>
                    </div>
                  )}
                </div>

                {/* Receipt Items & Bill Breakdown */}
                <div className="details-section items-info-sec">
                  <h3>Itemized Checklist</h3>
                  <div className="items-receipt-list">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="receipt-item-row">
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

                  {(() => {
                    const subtotal = activeOrder.subtotal || activeOrder.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                    const deliveryFee = activeOrder.deliveryFee || 150;
                    const platformFee = activeOrder.platformFee || 30;
                    const grandTotal = activeOrder.totalAmount || (subtotal + deliveryFee + platformFee);

                    return (
                      <div className="totals-table">
                        <div className="totals-row">
                          <span>Subtotal:</span>
                          <span>Rs. {subtotal}</span>
                        </div>
                        <div className="totals-row">
                          <span>Delivery Charges:</span>
                          <span>Rs. {deliveryFee}</span>
                        </div>
                        <div className="totals-row">
                          <span>Platform Fee:</span>
                          <span>Rs. {platformFee}</span>
                        </div>
                        <div className="totals-row grand-total-row">
                          <span>Grand Total:</span>
                          <span>Rs. {grandTotal}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="details-empty-state">
                <div className="chef-icon">👨‍🍳</div>
                <h3>Order Pane</h3>
                <p>Select an active ticket from the left panel to view receipt details.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Menu Workspace Configurator */
        <div className="menu-workspace">
          <div className="menu-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="category-tabs-row" style={{ display: 'flex', gap: '8px' }}>
              {menuCategories.map(cat => (
                <button
                  key={cat}
                  className={`sub-tab-btn ${menuFilter === cat ? 'active' : ''}`}
                  onClick={() => setMenuFilter(cat)}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button className="action-advance-btn btn-prepare" onClick={() => openMenuModal('add')} style={{ padding: '10px 20px' }}>
              ➕ Add New Menu Item
            </button>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="empty-orders-pane">
              <div className="empty-icon">🍽️</div>
              <h4>No items in this category</h4>
              <p>Add fresh items using the "Add New Menu Item" button above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {filteredMenuItems.map(item => (
                <div key={item._id || item.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0eb' }}>
                  <img src={item.image || IMAGE_TEMPLATES[0].url} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px' }}>
                    <span className="portal-badge" style={{ fontSize: '0.7rem', marginBottom: '6px' }}>{item.category}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '4px 0', color: 'var(--color-roasted)' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>{item.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-tandoori)' }}>Rs. {item.price}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => openMenuModal('edit', item)} style={{ background: '#f0f0eb', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Edit</button>
                        <button type="button" onClick={() => handleDeleteMenuItem(item._id || item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Item CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.3rem', color: 'var(--color-roasted)' }}>
              {modalMode === 'add' ? '✨ Add New Menu Item' : '✏️ Edit Menu Item'}
            </h3>
            <form onSubmit={handleSaveMenuItem}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Item Name *</label>
                <input type="text" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Price (Rs.) *</label>
                <input type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Category *</label>
                <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                  {dbCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea rows="2" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Item Image URL</label>
                <input type="text" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '8px' }} />
                <span style={{ fontSize: '0.75rem', color: '#888' }}>Or choose a template image below:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                  {IMAGE_TEMPLATES.map(t => (
                    <button type="button" key={t.name} onClick={() => setMenuForm({ ...menuForm, image: t.url })} style={{ border: menuForm.image === t.url ? '2px solid var(--color-tandoori)' : '1px solid #ccc', borderRadius: '6px', padding: '4px', cursor: 'pointer', background: '#fff' }}>
                      <img src={t.url} alt={t.name} style={{ width: '100%', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.65rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '12px' }}>{formError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="sub-tab-btn" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="action-advance-btn btn-prepare" style={{ padding: '8px 20px' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Update Modal */}
      {isLocationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ color: 'var(--color-roasted)', marginBottom: '4px' }}>Update Restaurant Location on Map</h3>
            <p style={{ fontSize: '0.8rem', color: '#D97706', marginBottom: '16px' }}>
              ⚠️ Updating your location will reset your approval status to Pending for Admin re-approval.
            </p>
            <RestaurantLocationPickerMap
              initialLat={locationUpdateCoords[0]}
              initialLng={locationUpdateCoords[1]}
              onLocationSelect={(coords) => setLocationUpdateCoords(coords)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setIsLocationModalOpen(false)} className="sub-tab-btn" style={{ padding: '8px 16px' }}>Cancel</button>
              <button type="button" onClick={handleSaveLocationUpdate} className="action-advance-btn btn-prepare" style={{ padding: '8px 20px' }}>Save Location</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;
