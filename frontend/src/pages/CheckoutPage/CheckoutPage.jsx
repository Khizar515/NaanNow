import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CartContext } from '../../components/Context/CartContext';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useContext(CartContext);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    deliverySpeed: 'standard',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod | card | wallet
  const [cardData, setCardData] = useState({
    cardholder: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [walletPhone, setWalletPhone] = useState('');
  const [errors, setErrors] = useState({});

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Order status states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Calculate prices
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee = formData.deliverySpeed === 'priority' ? 250 : 150;
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

  // Handle promo code application
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

  // Card input formatting helpers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Format as 0000 0000 0000 0000
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData({ ...cardData, number: formatted });
  };

  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardData({ ...cardData, expiry: value });
  };

  const handleCardCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardData({ ...cardData, cvv: value });
  };

  const handleWalletPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 11);
    setWalletPhone(value);
  };

  // Validate form details
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Full name is required';
    
    // Pakistani mobile phone formatting: 10 to 11 digits
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
      tempErrors.phone = 'Please enter a valid phone number (10-11 digits)';
    }

    if (!formData.address.trim()) tempErrors.address = 'Delivery address is required';

    if (paymentMethod === 'card') {
      if (!cardData.cardholder.trim()) tempErrors.cardholder = 'Cardholder name is required';
      if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardData.number) && cardData.number.replace(/\s/g, '').length !== 16) {
        tempErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
        tempErrors.cardExpiry = 'Expiry must be MM/YY';
      } else {
        const [month, year] = cardData.expiry.split('/').map(Number);
        if (month < 1 || month > 12) {
          tempErrors.cardExpiry = 'Invalid month';
        }
      }
      if (cardData.cvv.length !== 3) tempErrors.cardCvv = 'CVV must be 3 digits';
    }

    if (paymentMethod === 'wallet') {
      if (!/^\d{11}$/.test(walletPhone)) {
        tempErrors.walletPhone = 'Please enter a valid 11-digit wallet number';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle place order action
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to errors if any
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPlacingOrder(true);
    
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
      deliveryAddress: formData.address,
      paymentMethod,
      deliverySpeed: formData.deliverySpeed,
      instructions: formData.instructions,
      phone: formData.phone,
      name: formData.name
    };

    try {
      const createdOrder = await api.createOrder(orderData);
      setOrderId(createdOrder.orderNumber);
      
      // Simulate baking state sequence
      setTimeout(() => {
        setIsPlacingOrder(false);
        setOrderPlaced(true);
        clearCart();
        
        // After placing, we just show the success screen here which does countdowns,
        // so no immediate navigate is needed unless desired.
        // navigate('/orders');
      }, 2500);
    } catch (err) {
      console.error("Failed to create order:", err);
      setIsPlacingOrder(false);
      alert("Failed to place order. Please try again.");
    }
  };

  // Track delivery sequence progress
  useEffect(() => {
    if (!orderPlaced) return;

    // Transition from Preheating (Step 1) to Baking (Step 2)
    const tandoorTimer = setTimeout(() => {
      setOrderStep(2);
    }, 4000);

    // Transition from Baking (Step 2) to Rider Delivering (Step 3)
    const deliveryTimer = setTimeout(() => {
      setOrderStep(3);
    }, 9000);

    // Simulated real-time estimated time countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 5 ? prev - 1 : prev));
    }, 6000);

    return () => {
      clearTimeout(tandoorTimer);
      clearTimeout(deliveryTimer);
      clearInterval(countdownInterval);
    };
  }, [orderPlaced]);

  // Render empty cart fallback page
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

  // Render loading placeholder while baking/placing order
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
        <h2>Baking Your Order...</h2>
        <p>Sending your request to the NaanNow tandoor. Please do not refresh or close this page.</p>
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
          <h2>Bake & Order Placed!</h2>
          <p className="order-id">Order Reference: <span>{orderId}</span></p>
          <div className="delivery-etd">
            <span className="etd-label">Estimated Delivery Time</span>
            <span className="etd-value">{countdown} mins</span>
          </div>
        </div>

        {/* Dynamic tracking steps */}
        <div className="tracking-timeline-card">
          <h3>Order Progress</h3>
          <div className="timeline-steps">
            <div className={`timeline-step ${orderStep >= 1 ? 'active' : ''} ${orderStep === 1 ? 'current' : ''}`}>
              <div className="step-icon">🥣</div>
              <div className="step-details">
                <h4>Order Received & Preheating</h4>
                <p>{orderStep === 1 ? 'Preheating tandoor & preparing dough...' : 'Completed'}</p>
              </div>
              <div className="step-status-bar"></div>
            </div>

            <div className={`timeline-step ${orderStep >= 2 ? 'active' : ''} ${orderStep === 2 ? 'current' : ''}`}>
              <div className="step-icon">🔥</div>
              <div className="step-details">
                <h4>Baking Your Naan</h4>
                <p>{orderStep === 2 ? 'Naan is in the clay oven, cooking to crispy perfection...' : orderStep > 2 ? 'Completed' : 'Pending tandoor prep'}</p>
              </div>
              <div className="step-status-bar"></div>
            </div>

            <div className={`timeline-step ${orderStep >= 3 ? 'active' : ''} ${orderStep === 3 ? 'current' : ''}`}>
              <div className="step-icon">🛵</div>
              <div className="step-details">
                <h4>Rider Dispatching</h4>
                <p>{orderStep === 3 ? 'Rider is carrying your warm food box directly to your location!' : 'Pending bakery completion'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details Summary Card */}
        <div className="summary-details-card">
          <h3>Delivery Address Details</h3>
          <p><strong>Rider Destination:</strong> {formData.address}</p>
          <p><strong>Customer Name:</strong> {formData.name}</p>
          <p><strong>Contact Phone:</strong> {formData.phone}</p>
          {formData.instructions && <p><strong>Delivery Note:</strong> {formData.instructions}</p>}
          <p><strong>Payment Mode:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'card' ? 'Debit/Credit Card' : 'Mobile Wallet'}</p>
        </div>

        <button className="finish-checkout-btn" onClick={() => navigate('/')}>
          Back to Main Menu
        </button>
      </div>
    );
  }

  // Render normal checkout form layout
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
              <div className="form-group full-width">
                <label htmlFor="name">Receiver Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Muhammad Saad"
                  className={errors.name ? 'error-input' : ''}
                />
                {errors.name && <span className="field-error-message">{errors.name}</span>}
              </div>

              <div className="form-group half-width">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 03001234567"
                  className={errors.phone ? 'error-input' : ''}
                />
                {errors.phone && <span className="field-error-message">{errors.phone}</span>}
              </div>

              <div className="form-group half-width">
                <label>Delivery Speed</label>
                <div className="speed-selector-group">
                  <label className={`speed-option ${formData.deliverySpeed === 'standard' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="standard"
                      checked={formData.deliverySpeed === 'standard'}
                      onChange={() => setFormData({ ...formData, deliverySpeed: 'standard' })}
                    />
                    <div className="speed-label-text">
                      <span>Standard</span>
                      <small>Rs 150</small>
                    </div>
                  </label>

                  <label className={`speed-option ${formData.deliverySpeed === 'priority' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="priority"
                      checked={formData.deliverySpeed === 'priority'}
                      onChange={() => setFormData({ ...formData, deliverySpeed: 'priority' })}
                    />
                    <div className="speed-label-text">
                      <span>Priority</span>
                      <small>Rs 250</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Delivery Address</label>
                <textarea
                  id="address"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street No, House No, Sector/Area, City (e.g. House 42B, Street 11, F-10/2, Islamabad)"
                  className={errors.address ? 'error-input' : ''}
                />
                {errors.address && <span className="field-error-message">{errors.address}</span>}
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

          {/* Section 2: Payment Details */}
          <div className="checkout-section-card">
            <div className="section-title-row">
              <span className="section-number">2</span>
              <h2>Choose Payment Method</h2>
            </div>

            <div className="payment-method-tabs">
              <button
                type="button"
                className={`payment-tab ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <span className="payment-icon">💵</span>
                Cash on Delivery
              </button>

              <button
                type="button"
                className={`payment-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="payment-icon">💳</span>
                Credit/Debit Card
              </button>

              <button
                type="button"
                className={`payment-tab ${paymentMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <span className="payment-icon">📱</span>
                Mobile Wallet
              </button>
            </div>

            {/* Cash on Delivery Details */}
            {paymentMethod === 'cod' && (
              <div className="payment-description-box">
                <p>Pay with cash when the rider delivers your piping hot Naans directly to your doorstep. Please try to keep exact change handy!</p>
              </div>
            )}

            {/* Credit/Debit Card Form */}
            {paymentMethod === 'card' && (
              <div className="card-form-inputs">
                <div className="form-group full-width">
                  <label htmlFor="cardholder">Cardholder Name</label>
                  <input
                    type="text"
                    id="cardholder"
                    value={cardData.cardholder}
                    onChange={(e) => setCardData({ ...cardData, cardholder: e.target.value })}
                    placeholder="e.g. Muhammad Saad"
                    className={errors.cardholder ? 'error-input' : ''}
                  />
                  {errors.cardholder && <span className="field-error-message">{errors.cardholder}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="cardNumber">Card Number</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardData.number}
                    onChange={handleCardNumberChange}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className={errors.cardNumber ? 'error-input' : ''}
                  />
                  {errors.cardNumber && <span className="field-error-message">{errors.cardNumber}</span>}
                </div>

                <div className="form-group half-width">
                  <label htmlFor="cardExpiry">Expiration Date</label>
                  <input
                    type="text"
                    id="cardExpiry"
                    value={cardData.expiry}
                    onChange={handleCardExpiryChange}
                    placeholder="MM/YY"
                    className={errors.cardExpiry ? 'error-input' : ''}
                  />
                  {errors.cardExpiry && <span className="field-error-message">{errors.cardExpiry}</span>}
                </div>

                <div className="form-group half-width">
                  <label htmlFor="cardCvv">CVV / CVC Code</label>
                  <input
                    type="password"
                    id="cardCvv"
                    value={cardData.cvv}
                    onChange={handleCardCvvChange}
                    placeholder="123"
                    className={errors.cardCvv ? 'error-input' : ''}
                  />
                  {errors.cardCvv && <span className="field-error-message">{errors.cardCvv}</span>}
                </div>
              </div>
            )}

            {/* Mobile Wallet Form */}
            {paymentMethod === 'wallet' && (
              <div className="wallet-form-inputs">
                <p className="wallet-instructions">Enter your account number. We will send a security OTP prompt to authorize mobile wallet debit.</p>
                <div className="form-group full-width">
                  <label htmlFor="walletPhone">EasyPaisa / JazzCash Mobile Number</label>
                  <input
                    type="tel"
                    id="walletPhone"
                    value={walletPhone}
                    onChange={handleWalletPhoneChange}
                    placeholder="e.g. 03211234567"
                    className={errors.walletPhone ? 'error-input' : ''}
                  />
                  {errors.walletPhone && <span className="field-error-message">{errors.walletPhone}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="checkout-summary-column">
          <div className="summary-sticky-card">
            <h3>Basket Summary</h3>
            
            {/* Items review block */}
            <div className="checkout-items-review">
              {cartItems.map((item) => (
                <div className="review-item-row" key={item.id}>
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

            {/* Voucher input form */}
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

            {/* Summary calculation rows */}
            <div className="summary-calculation-rows">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>Rs {subtotal}</span>
              </div>
              
              <div className="calc-row">
                <span>Delivery Charge</span>
                <span>Rs {deliveryFee}</span>
              </div>

              <div className="calc-row">
                <span>Service/Platform Fee</span>
                <span>Rs {platformFee}</span>
              </div>

              {appliedPromo && (
                <div className="calc-row discount-row">
                  <span>Promo Discount ({appliedPromo.code})</span>
                  <span>- Rs {discount}</span>
                </div>
              )}

              <hr className="divider-line" />

              <div className="calc-row grand-total-row">
                <span>Total Amount</span>
                <span>Rs {grandTotal}</span>
              </div>
            </div>

            <button type="submit" className="submit-order-btn">
              Bake & Place Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
