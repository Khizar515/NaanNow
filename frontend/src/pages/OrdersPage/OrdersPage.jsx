import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CartContext } from '../../components/Context/CartContext';
import './OrdersPage.css';

// Helper to determine standardized 6-step progress status based on database status
const getOrderProgress = (status) => {
  switch (status) {
    case 'pending':
      return { status: 'Placed', step: 1, text: '📋 Order submitted & preheating in kitchen.' };
    case 'preparing':
      return { status: 'Preparing', step: 2, text: '🍳 Chef is baking and preparing your flatbreads.' };
    case 'ready_for_pickup':
      return { status: 'Prepared', step: 3, text: '📦 Order is ready & packaged in thermal box.' };
    case 'handed_over':
      return { status: 'Handed over to rider', step: 4, text: '🤝 Rider has received order from restaurant.' };
    case 'out_for_delivery':
      return { status: 'Out for delivery', step: 5, text: '🛵 Rider is driving to your location.' };
    case 'delivered':
    case 'completed':
      return { status: 'Delivered', step: 6, text: '✅ Order delivered safely!' };
    default:
      return { status: 'Placed', step: 1, text: '📋 Order submitted.' };
  }
};

function OrdersPage() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [dismissedPopups, setDismissedPopups] = useState([]);

  // Rating Modal state
  const [ratingOrder, setRatingOrder] = useState(null);
  const [riderRating, setRiderRating] = useState(5);
  const [riderReview, setRiderReview] = useState('');
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantReview, setRestaurantReview] = useState('');

  // Load orders strictly for logged in user
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders(true); // myOrders = true
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders for active and completed
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'cancelled');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'cancelled');

  const selectedOrder = orders.find(o => o._id === selectedOrderId) || activeOrders[0] || historyOrders[0];

  // Rating popup for orders delivered in last 48 hours that have no rating
  const unratedRecentOrder = orders.find(o => {
    if ((o.status === 'delivered' || o.status === 'completed') && !o.rating?.riderRating) {
      if (dismissedPopups.includes(o._id)) return false;
      const deliveredTime = o.completedAt ? new Date(o.completedAt).getTime() : new Date(o.createdAt).getTime();
      const now = new Date().getTime();
      const hoursPassed = (now - deliveredTime) / (1000 * 60 * 60);
      return hoursPassed <= 48; // 1-2 days limit
    }
    return false;
  });

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingOrder) return;
    try {
      const updatedOrder = await api.rateOrder(ratingOrder._id, {
        riderRating,
        riderReview,
        restaurantRating,
        restaurantReview
      });
      setOrders(prev => prev.map(o => o._id === ratingOrder._id ? updatedOrder : o));
      alert('🎉 Thank you for rating your rider and restaurant!');
      setRatingOrder(null);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  };

  const handleReorder = (order, e) => {
    e.stopPropagation();
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart({
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000"
        });
      }
    });
    alert(`🛒 Reordered! ${order.items.length} unique items added back to your Tokri.`);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-page-container">
      {/* Breadcrumb section */}
      <div className="orders-header-bar">
        <div className="orders-breadcrumbs">
          <button className="breadcrumb-link" onClick={() => navigate('/')}>Home</button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">My Orders</span>
        </div>
        <button className="back-home-btn" onClick={() => navigate('/')}>
          ← Go To Menu
        </button>
      </div>

      <div className="orders-title-section">
        <h1>My Orders 📋</h1>
        <p>Track your fresh hot naans or browse your previous order history.</p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty-state">
          <div className="empty-state-icon">🧺</div>
          <h2>No Orders Placed Yet!</h2>
          <p>Hungry? Order some premium flatbreads and piping hot curries now.</p>
          <button className="order-now-btn" onClick={() => navigate('/')}>
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="orders-layout-grid">

          {/* Left Column: Lists */}
          <div className="orders-lists-column">

            {/* Active Orders Section */}
            <div className="orders-section-card">
              <h2 className="section-title active-title">
                Active Orders <span className="active-badge">{activeOrders.length}</span>
              </h2>
              {activeOrders.length === 0 ? (
                <div className="no-orders-prompt">
                  <p>No active baking sessions right now. Past orders are listed below.</p>
                </div>
              ) : (
                <div className="orders-card-list">
                  {activeOrders.map(order => {
                    const prog = getOrderProgress(order.status);
                    return (
                      <div
                        key={order._id}
                        className={`order-list-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                        onClick={() => setSelectedOrderId(order._id)}
                      >
                        <div className="order-list-header">
                          <div className="restaurant-info">
                            <span className="restaurant-icon">🔥</span>
                            <h4>{order.restaurantId?.name || "NaanNow Kitchen"}</h4>
                          </div>
                          <span className="status-badge-live">
                            {prog.status}
                          </span>
                        </div>

                        <div className="order-list-body">
                          <p className="order-id-label">Order: <span>{order.orderNumber}</span></p>
                          <p className="order-items-summary">
                            {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                          </p>
                          <div className="order-list-footer">
                            <span className="order-price">Rs {order.totalAmount}</span>
                            <button
                              className="track-order-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/track-order/${order._id}`);
                              }}
                            >
                              Track Order 🎯
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order History Section */}
            <div className="orders-section-card">
              <h2 className="section-title">Order History</h2>
              <div className="orders-card-list">
                {historyOrders.length === 0 ? (
                  <p className="no-orders-prompt">No historical orders found.</p>
                ) : (
                  historyOrders.map(order => (
                    <div
                      key={order._id}
                      className={`order-list-card history-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                      onClick={() => setSelectedOrderId(order._id)}
                    >
                      <div className="order-list-header">
                        <div className="restaurant-info">
                          <span className="restaurant-icon">🍽️</span>
                          <h4>{order.restaurantId?.name || "NaanNow Kitchen"}</h4>
                        </div>
                        <span className="status-badge-completed">
                          {order.status === 'cancelled' ? '❌ Cancelled' : '✅ Delivered'}
                        </span>
                      </div>

                      <div className="order-list-body">
                        <p className="order-id-label">Order: <span>{order.orderNumber}</span></p>
                        <p className="order-date-label">{formatDate(order.createdAt)}</p>
                        <p className="order-items-summary">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </p>
                        <div className="order-list-footer">
                          <span className="order-price">Rs {order.totalAmount}</span>
                          <div className="history-actions" style={{ gap: '6px' }}>
                            {!order.rating?.riderRating && order.status !== 'cancelled' && (
                              <button
                                type="button"
                                className="rate-order-btn"
                                style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f59e0b', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRatingOrder(order);
                                  setRiderRating(order.rating?.riderRating || 5);
                                  setRiderReview(order.rating?.riderReview || '');
                                  setRestaurantRating(order.rating?.restaurantRating || 5);
                                  setRestaurantReview(order.rating?.restaurantReview || '');
                                }}
                              >
                                Rate Order ⭐
                              </button>
                            )}
                            <button
                              className="view-details-link"
                              onClick={() => setSelectedOrderId(order._id)}
                            >
                              Details
                            </button>
                            <button
                              className="reorder-btn"
                              onClick={(e) => handleReorder(order, e)}
                            >
                              Reorder 🔄
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Current Detail & 6-Step Stepper */}
          {selectedOrder && (
            <div className="order-details-column">
              <div className="order-details-card">

                {/* Header info */}
                <div className="detail-header">
                  <div className="title-details">
                    <h3>Order Receipt</h3>
                    <p className="order-ref">ID: <span>{selectedOrder.orderNumber}</span></p>
                    <p className="order-date">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="restaurant-details">
                    <h4>{selectedOrder.restaurantId?.name || "NaanNow Kitchen"}</h4>
                    <p>{selectedOrder.restaurantId?.address || "Hot Tandoori Outlet"}</p>
                  </div>
                </div>

                {/* Progress Tracker Stepper (6 Levels) */}
                {(() => {
                  const prog = getOrderProgress(selectedOrder.status);
                  return (
                    <div className="detail-tracker-section">
                      <div className="tracker-status-row">
                        <span className="tracker-status-text">
                          Order Status: <strong style={{ color: '#E57919' }}>{prog.status}</strong>
                        </span>
                      </div>

                      {/* 6 Levels Visual Stepper */}
                      <div className="stepper-visual-container" style={{ marginTop: '6px', marginBottom: '60px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', textAlign: 'center' }}>
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
                                opacity: prog.step >= s.num ? 1 : 0.4,
                                background: prog.step >= s.num ? '#FEF3C7' : '#F3F4F6',
                                border: prog.step === s.num ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                                borderRadius: '8px',
                                padding: '6px 2px'
                              }}
                            >
                              <div style={{ fontSize: '16px' }}>{s.icon}</div>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px', color: '#1F2937' }}>
                                {s.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="status-explainer-card" style={{ padding: '10px 14px', background: '#FFFBEB', borderLeft: '4px solid #F59E0B', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                          {prog.text}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Items Summary Table */}
                <div className="receipt-items-section">
                  <h4>Tokri Summary</h4>
                  <div className="receipt-items-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={item._id || idx} className="receipt-item-row">
                        <div className="item-desc">
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                        <span className="item-total">Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="receipt-totals-section">
                  <div className="totals-row grand-total-row">
                    <span>Grand Total</span>
                    <span>Rs {selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {/* Delivery Credentials */}
                <div className="receipt-delivery-section">
                  <h4>Delivery Credentials</h4>
                  <div className="delivery-info-grid">
                    <div className="info-block">
                      <span className="info-label">Customer Name</span>
                      <span className="info-value">{selectedOrder.name || selectedOrder.customerId?.name}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Contact Phone</span>
                      <span className="info-value">{selectedOrder.phone || selectedOrder.customerId?.phone}</span>
                    </div>
                    <div className="info-block full-width">
                      <span className="info-label">Delivery Address</span>
                      <span className="info-value">{selectedOrder.deliveryAddress}</span>
                    </div>
                    {selectedOrder.customerOtp && (
                      <div className="info-block full-width" style={{ background: '#FFFBEB', padding: '8px', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                        <span className="info-label" style={{ color: '#B45309', fontWeight: 'bold' }}>🔐 Customer Security Delivery OTP</span>
                        <span className="info-value" style={{ fontSize: '18px', fontWeight: '800', color: '#D97706' }}>{selectedOrder.customerOtp}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Persistent floating banner popup for rating recent orders (within 48h) */}
      {unratedRecentOrder && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1F2937',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 9999,
          maxWidth: '340px',
          border: '2px solid #F59E0B'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#F59E0B' }}>⭐ How was your meal?</span>
            <button
              onClick={() => setDismissedPopups(prev => [...prev, unratedRecentOrder._id])}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px' }}
            >
              &times;
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#D1D5DB', margin: '0 0 12px 0' }}>
            Your order <strong>#{unratedRecentOrder.orderNumber}</strong> was delivered. Please rate the rider & restaurant!
          </p>
          <button
            onClick={() => {
              setRatingOrder(unratedRecentOrder);
              setRiderRating(5);
              setRestaurantRating(5);
            }}
            style={{
              width: '100%',
              backgroundColor: '#F59E0B',
              color: '#111827',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Rate Order Now ⭐
          </button>
        </div>
      )}

      {/* Rating & Review Modal Overlay */}
      {ratingOrder && (
        <div className="address-modal-backdrop" onClick={() => setRatingOrder(null)}>
          <div className="address-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>Rate Your Order Experience</h3>
              <button className="close-modal-btn" onClick={() => setRatingOrder(null)}>&times;</button>
            </div>
            <form onSubmit={handleRatingSubmit}>
              <div className="address-modal-body" style={{ gap: '18px' }}>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  Order <strong>#{ratingOrder.orderNumber}</strong> • {ratingOrder.restaurantId?.name || "NaanNow Kitchen"}
                </p>

                {/* Section 1: Rate Rider */}
                <div style={{ border: '1px solid #eee', padding: '14px', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🛵 Rate Rider ({ratingOrder.riderId?.name || 'Delivery Rider'})
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        style={{
                          fontSize: '24px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: star <= riderRating ? '#f59e0b' : '#d1d5db',
                          transition: '0.1s'
                        }}
                        onClick={() => setRiderRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Write an optional review for rider..."
                    value={riderReview}
                    onChange={(e) => setRiderReview(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px' }}
                  />
                </div>

                {/* Section 2: Rate Restaurant */}
                <div style={{ border: '1px solid #eee', padding: '14px', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🍽️ Rate Restaurant ({ratingOrder.restaurantId?.name || 'Restaurant'})
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        style={{
                          fontSize: '24px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: star <= restaurantRating ? '#f59e0b' : '#d1d5db',
                          transition: '0.1s'
                        }}
                        onClick={() => setRestaurantRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Write an optional review for restaurant..."
                    value={restaurantReview}
                    onChange={(e) => setRestaurantReview(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="address-modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="modal-cancel-btn" onClick={() => setRatingOrder(null)}>Skip</button>
                <button type="submit" className="modal-save-btn" style={{ backgroundColor: '#f59e0b' }}>
                  Submit Ratings ⭐
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
