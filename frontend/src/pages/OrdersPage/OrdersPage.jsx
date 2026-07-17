import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CartContext } from '../../components/Context/CartContext';
import './OrdersPage.css';

// Helper to determine simulated progress status based on creation time
const getOrderProgress = (order) => {
  if (order.status === 'completed' || order.status === 'delivered') {
    return { status: 'Completed', step: 4, remaining: 0 };
  }

  switch (order.status) {
    case 'pending':
      return { status: 'Preparing', step: 1, remaining: 45 };
    case 'preparing':
      return { status: 'Baking', step: 2, remaining: 30 };
    case 'ready_for_pickup':
      return { status: 'Waiting for Rider', step: 2.5, remaining: 15 };
    case 'out_for_delivery':
      return { status: 'Delivering', step: 3, remaining: 10 };
    default:
      return { status: 'Completed', step: 4, remaining: 0 };
  }
};

function OrdersPage() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tick, setTick] = useState(0);

  // Load orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    fetchOrders();
  }, []);

  // Tick timer to update statuses in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live orders with progress step calculated
  const liveOrders = orders.map(order => {
    const progress = getOrderProgress(order);
    return {
      ...order,
      liveStatus: progress.status,
      liveStep: progress.step,
      remainingTime: progress.remaining
    };
  });

  // Split into active and history
  const activeOrders = liveOrders.filter(o => o.liveStatus !== 'Completed');
  const historyOrders = liveOrders.filter(o => o.liveStatus === 'Completed');

  // Currently selected order
  const selectedOrder = liveOrders.find(o => o._id === selectedOrderId) || activeOrders[0] || historyOrders[0];

  const handleReorder = (order, e) => {
    e.stopPropagation();
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart({
          _id: item._id, // if item from history doesn't have restaurant details, this might be incomplete. It's just a simulation.
          name: item.name,
          price: item.price,
          image: item.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000"
        });
      }
    });
    alert(`🛒 Reordered! ${order.items.length} unique items added back to your Tokri.`);
  };

  const getStepClass = (stepNum, currentStep) => {
    if (currentStep > stepNum) return 'step-done';
    if (currentStep === stepNum) return 'step-active';
    return 'step-pending';
  };

  const getProgressPercentage = (step) => {
    switch (step) {
      case 1: return 12;
      case 2: return 40;
      case 2.5: return 55;
      case 3: return 72;
      case 4: return 100;
      default: return 0;
    }
  };

  const formatDate = (isoString) => {
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
        <p>Track your fresh hot naans or browse your previous tokris.</p>
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
                  {activeOrders.map(order => (
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
                        <span className={`status-badge-live ${order.liveStatus.toLowerCase().replace(/\s/g, '-')}`}>
                          {order.liveStatus === 'Preparing' && '🥣 Preparing'}
                          {order.liveStatus === 'Baking' && '🔥 Baking'}
                          {order.liveStatus === 'Waiting for Rider' && '⌛ Waiting'}
                          {order.liveStatus === 'Delivering' && '🛵 Delivering'}
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
                  ))}
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
                        <span className="status-badge-completed">✅ Delivered</span>
                      </div>
                      
                      <div className="order-list-body">
                        <p className="order-id-label">Order: <span>{order.orderNumber}</span></p>
                        <p className="order-date-label">{formatDate(order.createdAt)}</p>
                        <p className="order-items-summary">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </p>
                        <div className="order-list-footer">
                          <span className="order-price">Rs {order.totalAmount}</span>
                          <div className="history-actions">
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

          {/* Right Column: Current Detail & Stepper */}
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
                    <p>Hot Tandoori Outlet</p>
                  </div>
                </div>

                {/* Progress Tracker Stepper (Only active or tracking) */}
                <div className="detail-tracker-section">
                  <div className="tracker-status-row">
                    <span className="tracker-status-text">
                      Status: <strong>{selectedOrder.liveStatus}</strong>
                    </span>
                    {selectedOrder.liveStatus !== 'Completed' && (
                      <span className="tracker-eta">
                        ETA: <strong>{selectedOrder.remainingTime}s</strong>
                      </span>
                    )}
                  </div>

                  {/* The visual progress bars & circles */}
                  <div className="stepper-visual-container">
                    <div className="stepper-line-background"></div>
                    <div 
                      className="stepper-line-progress" 
                      style={{ width: `${getProgressPercentage(selectedOrder.liveStep)}%` }}
                    ></div>

                    <div className="stepper-steps-row">
                      <div className={`step-bubble ${getStepClass(1, selectedOrder.liveStep)}`}>
                        <span className="bubble-icon">🥣</span>
                        <span className="bubble-label">Received</span>
                      </div>
                      <div className={`step-bubble ${getStepClass(2, selectedOrder.liveStep)}`}>
                        <span className="bubble-icon">🔥</span>
                        <span className="bubble-label">Baking</span>
                      </div>
                      <div className={`step-bubble ${getStepClass(3, selectedOrder.liveStep)}`}>
                        <span className="bubble-icon">🛵</span>
                        <span className="bubble-label">Delivering</span>
                      </div>
                      <div className={`step-bubble ${getStepClass(4, selectedOrder.liveStep)}`}>
                        <span className="bubble-icon">✅</span>
                        <span className="bubble-label">Arrived</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Status Explainer */}
                  <div className="status-explainer-card">
                    {selectedOrder.liveStep === 1 && (
                      <p>🥣 <strong>Kitchen is warming up:</strong> We have received your order details and the Chef is preparing the fresh dough bases.</p>
                    )}
                    {selectedOrder.liveStep === 2 && (
                      <p>🔥 <strong>Naan in Tandoor:</strong> Flatbreads are stuck inside our hot clay oven. Preparing that perfect crispy golden crust.</p>
                    )}
                    {selectedOrder.liveStep === 2.5 && (
                      <p>⌛ <strong>Waiting for Rider:</strong> Food is ready and sealed in thermal packages. A rider will pick it up shortly.</p>
                    )}
                    {selectedOrder.liveStep === 3 && (
                      <p>🛵 <strong>Warm Delivery Transit:</strong> Food is sealed in thermal packages and our rider is speeding to your address.</p>
                    )}
                    {selectedOrder.liveStep === 4 && (
                      <p>✅ <strong>Delivered successfully:</strong> Enjoy your fresh NaanNow meal. Don't forget to review us!</p>
                    )}
                  </div>
                </div>

                {/* Items Summary Table */}
                <div className="receipt-items-section">
                  <h4>Tokri Summary</h4>
                  <div className="receipt-items-list">
                    {selectedOrder.items.map(item => (
                      <div key={item._id} className="receipt-item-row">
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

                {/* Delivery Information */}
                <div className="receipt-delivery-section">
                  <h4>Delivery Credentials</h4>
                  <div className="delivery-info-grid">
                    <div className="info-block">
                      <span className="info-label">Customer</span>
                      <span className="info-value">{selectedOrder.name || selectedOrder.customerId?.name}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{selectedOrder.phone || selectedOrder.customerId?.phone}</span>
                    </div>
                    <div className="info-block full-width">
                      <span className="info-label">Address</span>
                      <span className="info-value">{selectedOrder.deliveryAddress}</span>
                    </div>
                    {selectedOrder.instructions && (
                      <div className="info-block full-width instructions-block">
                        <span className="info-label">Rider Instructions</span>
                        <span className="info-value">“{selectedOrder.instructions}”</span>
                      </div>
                    )}
                    <div className="info-block">
                      <span className="info-label">Payment Mode</span>
                      <span className="info-value">
                        {selectedOrder.paymentMethod === 'cod' ? '💵 Cash on Delivery' : 
                         selectedOrder.paymentMethod === 'card' ? '💳 Credit/Debit Card' : 
                         selectedOrder.paymentMethod === 'wallet' ? '📱 Mobile Wallet' : selectedOrder.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default OrdersPage;
