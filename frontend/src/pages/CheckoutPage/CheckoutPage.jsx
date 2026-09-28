import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CartContext } from '../../components/Context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPhone } from '../../utils/formatters';
import './CheckoutPage.css';

// Dynamic Leaflet Loader
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

// Haversine distance calculator
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

// Leaflet Map Picker Component for Checkout
function CheckoutLocationPickerMap({ deliveryCoords, onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = deliveryCoords ? deliveryCoords[0] : 33.6844;
  const defaultLng = deliveryCoords ? deliveryCoords[1] : 73.0479;

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
        marker.bindPopup('📍 Drop pin for exact delivery location').openPopup();

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

  useEffect(() => {
    if (deliveryCoords && mapInstanceRef.current && markerRef.current) {
      const [lat, lng] = deliveryCoords;
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [deliveryCoords]);

  return (
    <div className="map-picker-container" style={{ marginTop: '16px', marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: '#374151' }}>
        🗺️ Select Delivery Location on Map (Pin Point Location)
      </label>
      <div ref={mapRef} style={{ width: '100%', height: '220px', borderRadius: '12px', border: '1px solid #d1d5db', overflow: 'hidden' }} />
      <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', display: 'block' }}>
        Click anywhere on the map or drag the pin to mark your exact delivery location.
      </span>
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useContext(CartContext);
  const { user: currentUser } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
  });

  // Location & Delivery Fee States
  const [perKmRate, setPerKmRate] = useState(150);
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [restaurantCoords, setRestaurantCoords] = useState(null); // [lat, lng]
  const [deliveryCoords, setDeliveryCoords] = useState(null); // [lat, lng]
  const [userInteractedWithMap, setUserInteractedWithMap] = useState(false);

  // Saved Cards & Payment Verification
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [errors, setErrors] = useState({});

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Order status states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [customerOtp, setCustomerOtp] = useState('');

  // Pre-fill user profile data if available
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        phone: prev.phone || (currentUser.phone ? formatPhone(currentUser.phone) : ''),
        address: prev.address || currentUser.address || ''
      }));
    }
  }, [currentUser]);

  // Load user saved cards
  useEffect(() => {
    api.getCards().then(cards => {
      setSavedCards(cards);
      if (cards.length > 0) {
        setSelectedCardId(cards[0]._id);
      }
    }).catch(err => console.error("Failed to load cards:", err));
  }, []);

  // Load platform settings for per-km delivery rate
  useEffect(() => {
    api.getSettings().then(st => {
      if (st && st.deliveryCharges) {
        setPerKmRate(Number(st.deliveryCharges));
      }
    }).catch(() => { });
  }, []);

  // Fetch restaurant coords accurately from DB
  useEffect(() => {
    const firstItem = cartItems[0];
    if (firstItem?.restaurantId) {
      api.getRestaurantById(firstItem.restaurantId).then(res => {
        if (res && res.lat && res.lng) {
          setRestaurantCoords([res.lat, res.lng]);
        } else if (res && res.address) {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(res.address + ', Pakistan')}`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                setRestaurantCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
              } else {
                setRestaurantCoords([33.6923, 73.0105]); // Default F-10 Markaz
              }
            }).catch(() => setRestaurantCoords([33.6923, 73.0105]));
        } else {
          setRestaurantCoords([33.6923, 73.0105]);
        }
      }).catch(() => setRestaurantCoords([33.6923, 73.0105]));
    }
  }, [cartItems]);

  // Calculate distance-based delivery fee (min Rs 150)
  useEffect(() => {
    if (restaurantCoords && deliveryCoords) {
      const dist = calculateDistanceKm(restaurantCoords[0], restaurantCoords[1], deliveryCoords[0], deliveryCoords[1]);
      if (dist) {
        setCalculatedDistance(dist);
        const calc = Math.round(dist * perKmRate);
        setDeliveryFee(Math.max(150, calc));
      } else {
        setCalculatedDistance(null);
        setDeliveryFee(150);
      }
    } else {
      setCalculatedDistance(null);
      setDeliveryFee(150);
    }
  }, [restaurantCoords, deliveryCoords, perKmRate]);

  const handleAddressBlur = () => {
    if (formData.address.trim() && !userInteractedWithMap) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ', Pakistan')}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setDeliveryCoords([lat, lng]);
          }
        })
        .catch(() => { });
    }
  };

  const handleMapLocationSelect = (coords) => {
    setDeliveryCoords(coords);
    setUserInteractedWithMap(true);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.display_name) {
          const shortAddr = data.display_name.split(',').slice(0, 4).join(',');
          setFormData(prev => ({ ...prev, address: shortAddr }));
        }
      })
      .catch(() => { });
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // Calculate prices
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const platformFee = cartItems.length > 0 ? 30 : 0;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discount = Math.round(subtotal * (appliedPromo.discount / 100));
    } else if (appliedPromo.type === 'flat') {
      discount = appliedPromo.discount;
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee - discount);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();

    if (!code) return;

    if (code === 'NAAN20') {
      setAppliedPromo({
        code: 'NAAN20',
        discount: 20,
        type: 'percent',
      });
      setPromoCode('');
    } else if (code === 'WELCOME50') {
      setAppliedPromo({
        code: 'WELCOME50',
        discount: 50,
        type: 'flat',
      });
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code. Try NAAN20 or WELCOME50');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  // Validate form details
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Full name is required';

    const rawPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,11}$/.test(rawPhone)) {
      tempErrors.phone = 'Please enter a valid phone number (10-11 digits)';
    }

    if (!formData.address.trim()) tempErrors.address = 'Delivery address is required';

    if (!selectedCardId) {
      tempErrors.card = 'Please select a card from your saved profile cards';
    }

    if (!cardPin.trim()) {
      tempErrors.pin = 'Card PIN is required to verify ownership';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle place order action
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPlacingOrder(true);

    let finalCoords = deliveryCoords;
    if (!finalCoords && formData.address.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ', Pakistan')}`);
        const data = await res.json();
        if (data && data.length > 0) {
          finalCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error('Geocode search failed on submit:', err);
      }
    }

    const firstItem = cartItems[0];
    const resId = firstItem?.restaurantId;

    const orderData = {
      restaurantId: resId,
      items: cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: grandTotal,
      subtotal,
      platformFee,
      cardId: selectedCardId,
      pin: cardPin,
      deliveryAddress: formData.address,
      paymentMethod: 'Credit / Debit Card',
      instructions: formData.instructions,
      phone: formData.phone,
      name: formData.name,
      deliveryLat: finalCoords ? finalCoords[0] : null,
      deliveryLng: finalCoords ? finalCoords[1] : null,
      deliveryFee: deliveryFee
    };

    try {
      const createdOrder = await api.createOrder(orderData);
      setOrderId(createdOrder.orderNumber);
      setCustomerOtp(createdOrder.customerOtp || 'SEC123');

      setTimeout(() => {
        setIsPlacingOrder(false);
        setOrderPlaced(true);
        clearCart();
      }, 2000);
    } catch (err) {
      console.error("Failed to create order:", err);
      setIsPlacingOrder(false);
      alert(err.message || "Failed to place order. Please check card PIN and balance.");
    }
  };

  if (cartItems.length === 0 && !orderPlaced && !isPlacingOrder) {
    return (
      <div className="checkout-empty-container">
        <div className="checkout-empty-card">
          <div className="empty-tokri-icon">🧺</div>
          <h2>Your Tokri is Empty!</h2>
          <p>You haven't added any fresh, hot naans or curry to your basket yet.</p>
          <button className="empty-back-home-btn" onClick={() => navigate('/')}>
            Go To Menu
          </button>
        </div>
      </div>
    );
  }

  if (isPlacingOrder) {
    return (
      <div className="checkout-loading-container">
        <div className="tandoor-baking-loader">
          <div className="fire-embers">
            <span className="ember">🔥</span>
            <span className="ember">🔥</span>
            <span className="ember">🔥</span>
          </div>
          <div className="dough-spin">🍞</div>
        </div>
        <h2>Verifying Card & Baking Order...</h2>
        <p>Validating your card credentials with profile cards and starting prep. Please wait.</p>
      </div>
    );
  }

  // Render Tracking/Success Page
  if (orderPlaced) {
    return (
      <div className="order-success-container">
        <div className="success-header-card">
          <div className="success-badge">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2>Order Placed & Payment Escrowed!</h2>
          <p className="order-id">Order Reference: <span>{orderId}</span></p>

          {/* Customer OTP Box */}
          <div className="customer-otp-card" style={{
            background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '16px',
            textAlign: 'center',
            border: '2px dashed #E57919'
          }}>
            <span style={{ fontSize: '13px', color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🔐 Your Security Delivery OTP
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B', letterSpacing: '4px', display: 'block', margin: '6px 0' }}>
              {customerOtp}
            </span>
            <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Only share this code with your rider when your order arrives at your gate.
            </span>
          </div>
        </div>

        {/* 6 Standardized Tracking steps */}
        <div className="tracking-timeline-card" style={{ marginTop: '24px' }}>
          <h3>Order Status Progress</h3>
          <div className="timeline-steps">
            <div className="timeline-step active current">
              <div className="step-icon">📋</div>
              <div className="step-details">
                <h4>1. Placed</h4>
                <p>Order submitted & payment verified into escrow.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-icon">🍳</div>
              <div className="step-details">
                <h4>2. Preparing</h4>
                <p>Restaurant is preparing your food.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-icon">📦</div>
              <div className="step-details">
                <h4>3. Prepared</h4>
                <p>Food is packed and ready for rider.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-icon">🤝</div>
              <div className="step-details">
                <h4>4. Handed over to rider</h4>
                <p>Rider verified handover OTP at restaurant.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-icon">🛵</div>
              <div className="step-details">
                <h4>5. Out for delivery</h4>
                <p>Rider is driving to your location.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-icon">✅</div>
              <div className="step-details">
                <h4>6. Delivered</h4>
                <p>Food delivered safely to doorstep.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details Summary Card */}
        <div className="summary-details-card" style={{ marginTop: '24px' }}>
          <h3>Delivery Address Details</h3>
          <p><strong>Destination:</strong> {formData.address}</p>
          <p><strong>Customer Name:</strong> {formData.name}</p>
          <p><strong>Contact Phone:</strong> {formData.phone}</p>
          {formData.instructions && <p><strong>Delivery Note:</strong> {formData.instructions}</p>}
          <p><strong>Payment Mode:</strong> Profile Card (Verified)</p>
        </div>

        <button className="finish-checkout-btn" onClick={() => navigate('/orders')}>
          Track Order on My Orders Page
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      {/* Breadcrumb row */}
      <div className="checkout-header-bar">
        <div className="checkout-breadcrumbs">
          <button className="breadcrumb-link" onClick={() => navigate('/')}>Home</button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Checkout</span>
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>
          ← Back to Shopping
        </button>
      </div>

      <h1 className="checkout-title">Finalize Your Order</h1>

      <form className="checkout-layout-grid" onSubmit={handlePlaceOrder}>
        {/* Left Form Column */}
        <div className="checkout-forms-column">

          {/* Section 1: Delivery Information */}
          <div className="checkout-section-card">
            <div className="section-title-row">
              <span className="section-number">1</span>
              <h2>Where should we bring your Naan?</h2>
            </div>

            <div className="form-fields-grid">
              <div className="form-group half-width">
                <label htmlFor="name">Receiver Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  className={errors.name ? 'error-input' : ''}
                />
                {errors.name && <span className="field-error-message">{errors.name}</span>}
              </div>

              <div className="form-group half-width">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="e.g. 0300-1234567"
                  className={errors.phone ? 'error-input' : ''}
                />
                {errors.phone && <span className="field-error-message">{errors.phone}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Delivery Address *</label>
                <textarea
                  id="address"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  onBlur={handleAddressBlur}
                  placeholder="Street No, House No, Sector/Area, City (e.g. House 42B, Street 11, F-10/2, Islamabad)"
                  className={errors.address ? 'error-input' : ''}
                />
                {errors.address && <span className="field-error-message">{errors.address}</span>}
              </div>

              {/* Interactive OpenStreetMap Picker */}
              <div className="form-group full-width">
                <CheckoutLocationPickerMap
                  deliveryCoords={deliveryCoords}
                  onLocationSelect={handleMapLocationSelect}
                />
                {calculatedDistance && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#10B981', fontWeight: 'bold' }}>
                    📏 Distance to Restaurant: {calculatedDistance} km (Delivery fee: Rs {deliveryFee})
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="instructions">Rider Instructions (Optional)</label>
                <input
                  type="text"
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g. Ring doorbell twice / Leave at gate with security"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Details (Profile Cards Only) */}
          <div className="checkout-section-card">
            <div className="section-title-row">
              <span className="section-number">2</span>
              <h2>Pay for Order (Select Profile Card)</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Select one of your saved cards from your profile. Unregistered or unknown cards are not allowed.
            </p>

            {savedCards.length === 0 ? (
              <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B' }}>
                ⚠️ You have no active cards saved in your profile.
                <button
                  type="button"
                  style={{ marginLeft: '10px', textDecoration: 'underline', color: '#991B1B', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/profile')}
                >
                  Click here to add a card to your profile
                </button>
              </div>
            ) : (
              <div className="card-selection-area">
                <div className="form-group full-width">
                  <label htmlFor="savedCardSelect">Choose Saved Card *</label>
                  <select
                    id="savedCardSelect"
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  >
                    {savedCards.map(card => (
                      <option key={card._id} value={card._id}>
                        💳 Card ending in {card.cardNumber.slice(-4)} (Exp: {card.expiryDate}) — Available Balance: Rs {card.balance}
                      </option>
                    ))}
                  </select>
                  {errors.card && <span className="field-error-message">{errors.card}</span>}
                </div>

                <div className="form-group half-width" style={{ marginTop: '16px' }}>
                  <label htmlFor="cardPin">Enter Card Security PIN *</label>
                  <input
                    type="password"
                    id="cardPin"
                    maxLength={4}
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (default 1234)"
                    className={errors.pin ? 'error-input' : ''}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                  {errors.pin && <span className="field-error-message">{errors.pin}</span>}
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                    Required to confirm cardholder identity before deducting funds.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="checkout-summary-column">
          <div className="summary-sticky-card">
            <h3>Basket Summary</h3>

            <div className="checkout-items-review">
              {cartItems.map((item) => (
                <div className="review-item-row" key={item.id || item._id}>
                  <img src={item.image} alt={item.name} className="review-item-img" />
                  <div className="review-item-info">
                    <h4>{item.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="review-item-price">
                    Rs {item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="promo-input-section">
              {appliedPromo ? (
                <div className="promo-badge-applied">
                  <span className="badge-text">
                    🏷️ Coupon <strong>{appliedPromo.code}</strong> Applied!
                  </span>
                  <button type="button" className="remove-promo-btn" onClick={handleRemovePromo}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="promo-form-row">
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. NAAN20)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button type="button" onClick={handleApplyPromo} className="apply-promo-btn">
                    Apply
                  </button>
                </div>
              )}
              {promoError && <p className="promo-error-message">{promoError}</p>}
            </div>

            <div className="summary-calculation-rows">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>Rs {subtotal}</span>
              </div>

              <div className="calc-row">
                <span>Delivery Fee</span>
                <span>Rs {deliveryFee}</span>
              </div>

              <div className="calc-row">
                <span>Platform Fee</span>
                <span>Rs {platformFee}</span>
              </div>

              {appliedPromo && (
                <div className="calc-row discount-row">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>- Rs {discount}</span>
                </div>
              )}

              <div className="calc-row grand-total-row">
                <span>Grand Total</span>
                <span>Rs {grandTotal}</span>
              </div>
            </div>

            <button type="submit" className="place-order-submit-btn" disabled={isPlacingOrder || savedCards.length === 0}>
              Verify PIN & Place Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
