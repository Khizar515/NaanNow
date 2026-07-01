import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../components/Context/CartContext';
import './OrdersPage.css';

const MOCK_ORDERS = [
  {
    id: "NN-827364",
    restaurantName: "Tandoori Flames",
    items: [
      { id: 203, name: "Butter Garlic Naan", price: 150, quantity: 3, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80" },
      { id: 204, name: "Chicken Karahi (Half)", price: 950, quantity: 1, image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80" }
    ],
    subtotal: 1400,
    deliveryFee: 150,
    platformFee: 30,
    discount: 280,
    grandTotal: 1300,
    date: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5 hours ago
    status: 'Completed',
    address: "House 42B, Street 11, F-10/2, Islamabad",
    name: "Muhammad Saad",
    phone: "03001234567",
    instructions: "Ring bell twice, leave at gate",
    paymentMethod: "cod",
    deliverySpeed: "standard"
  },
  {
    id: "NN-194823",
    restaurantName: "Caffeine & Co.",
    items: [
      { id: 301, name: "Iced Spanish Latte", price: 380, quantity: 2, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80" },
      { id: 303, name: "Chocolate Fudge Slice", price: 320, quantity: 1, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80" }
    ],
    subtotal: 1080,
    deliveryFee: 250,
    platformFee: 30,
    discount: 50,
    grandTotal: 1310,
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'Completed',
    address: "House 42B, Street 11, F-10/2, Islamabad",
    name: "Muhammad Saad",
    phone: "03001234567",
    instructions: "Call on arrival",
    paymentMethod: "card",
    deliverySpeed: "priority"
  }
];

// Helper to determine simulated progress status based on creation time
const getOrderProgress = (order) => {
  if (order.isManual) {
    switch (order.status) {
      case 'Preparing':
        return { status: 'Preparing', step: 1, remaining: 45 };
      case 'Baking':
        return { status: 'Baking', step: 2, remaining: 30 };
      case 'Waiting for Rider':
        return { status: 'Waiting for Rider', step: 2.5, remaining: 15 };
      case 'Delivering':
      case 'Sent':
        return { status: 'Delivering', step: 3, remaining: 10 };
      case 'Completed':
        return { status: 'Completed', step: 4, remaining: 0 };
      default:
        return { status: order.status, step: 1, remaining: 10 };
    }
  }

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

function OrdersPage() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tick, setTick] = useState(0);

  // Load orders from localStorage or seed mock orders
  useEffect(() => {
    const saved = localStorage.getItem('naannow_orders');
    if (saved) {
      setOrders(JSON.parse(saved));
    } else {
      localStorage.setItem('naannow_orders', JSON.stringify(MOCK_ORDERS));
      setOrders(MOCK_ORDERS);
    }
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
  const selectedOrder = liveOrders.find(o => o.id === selectedOrderId) || activeOrders[0] || historyOrders[0];

  const handleReorder = (order, e) => {
    e.stopPropagation();
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image
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
                      key={order.id} 
                      className={`order-list-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="order-list-header">
                        <div className="restaurant-info">
                          <span className="restaurant-icon">🔥</span>
                          <h4>{order.restaurantName}</h4>
                        </div>
                        <span className={`status-badge-live ${order.liveStatus.toLowerCase()}`}>
                          {order.liveStatus === 'Preparing' && '🥣 Preparing'}
                          {order.liveStatus === 'Baking' && '🔥 Baking'}
                          {order.liveStatus === 'Delivering' && '🛵 Delivering'}
                        </span>
                      </div>
                      
                      <div className="order-list-body">
                        <p className="order-id-label">Order: <span>{order.id}</span></p>
                        <p className="order-items-summary">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </p>
                        <div className="order-list-footer">
                          <span className="order-price">Rs {order.grandTotal}</span>
                          <button 
                            className="track-order-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/track-order/${order.id}`);
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
                      key={order.id} 
                      className={`order-list-card history-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="order-list-header">
                        <div className="restaurant-info">
                          <span className="restaurant-icon">🍽️</span>
                          <h4>{order.restaurantName}</h4>
                        </div>
                        <span className="status-badge-completed">✅ Delivered</span>
                      </div>
                      
                      <div className="order-list-body">
                        <p className="order-id-label">Order: <span>{order.id}</span></p>
                        <p className="order-date-label">{formatDate(order.date)}</p>
                        <p className="order-items-summary">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </p>
                        <div className="order-list-footer">
                          <span className="order-price">Rs {order.grandTotal}</span>
                          <div className="history-actions">
                            <button 
                              className="view-details-link"
                              onClick={() => setSelectedOrderId(order.id)}
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
                    <p className="order-ref">ID: <span>{selectedOrder.id}</span></p>
                    <p className="order-date">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div className="restaurant-details">
                    <h4>{selectedOrder.restaurantName}</h4>
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
                      <div key={item.id} className="receipt-item-row">
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
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span>Rs {selectedOrder.subtotal}</span>
                  </div>
                  <div className="totals-row">
                    <span>Delivery Fee ({selectedOrder.deliverySpeed === 'priority' ? '⏱️ Priority' : '🛵 Standard'})</span>
                    <span>Rs {selectedOrder.deliveryFee}</span>
                  </div>
                  <div className="totals-row">
                    <span>Platform Fee</span>
                    <span>Rs {selectedOrder.platformFee}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="totals-row discount-row">
                      <span>Promo Discount</span>
                      <span>-Rs {selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="totals-row grand-total-row">
                    <span>Grand Total</span>
                    <span>Rs {selectedOrder.grandTotal}</span>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="receipt-delivery-section">
                  <h4>Delivery Credentials</h4>
                  <div className="delivery-info-grid">
                    <div className="info-block">
                      <span className="info-label">Customer</span>
                      <span className="info-value">{selectedOrder.name}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{selectedOrder.phone}</span>
                    </div>
                    <div className="info-block full-width">
                      <span className="info-label">Address</span>
                      <span className="info-value">{selectedOrder.address}</span>
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
                         selectedOrder.paymentMethod === 'card' ? '💳 Credit/Debit Card' : '📱 Mobile Wallet'}
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
