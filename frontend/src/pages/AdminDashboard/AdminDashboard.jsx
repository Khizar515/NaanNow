import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import naanSvg from '../../assets/naan-removebg-svg.svg';

// ==========================================================================
// Vector Icons Helper Component (Crisp Custom SVGs for a Premium SaaS Look)
// ==========================================================================
const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
    orders: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    restaurants: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    riders: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="17.5" r="2.5" /><path d="M15 6h1a2 2 0 0 1 2 2v2" /><path d="M8 17.5h7.5M12 13.5l3-3.5 3 .5" /><circle cx="12" cy="9" r="1.5" />
      </svg>
    ),
    customers: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    menu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    payments: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" /><line x1="12" y1="18" x2="12" y2="18.01" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    promotions: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    verification: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" />
      </svg>
    ),
    analytics: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    support: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    notifications: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    sun: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    moon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    ban: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    export: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    plane: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    arrowRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    arrowLeft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  };

  return icons[name] || <span className={`fallback-icon ${className}`}>?</span>;
};

// Pre-defined street route coordinates for riders in Islamabad sectors
const MAP_ROUTE_1 = [
  { x: 10, y: 30 }, { x: 22, y: 30 }, { x: 35, y: 30 }, { x: 50, y: 30 },
  { x: 65, y: 30 }, { x: 78, y: 30 }, { x: 90, y: 30 }
];
const MAP_ROUTE_2 = [
  { x: 75, y: 80 }, { x: 75, y: 62 }, { x: 52, y: 62 }, { x: 35, y: 62 },
  { x: 35, y: 45 }, { x: 35, y: 25 }
];
const MAP_ROUTE_3 = [
  { x: 15, y: 75 }, { x: 15, y: 60 }, { x: 30, y: 60 }, { x: 30, y: 48 },
  { x: 48, y: 48 }, { x: 48, y: 75 }, { x: 30, y: 75 }
];

// ==========================================================================
// Main React AdminDashboard Redesign Component
// ==========================================================================
function AdminDashboard() {
  const navigate = useNavigate();

  // ------------------------------------------------------------------------
  // Core UI Toggles & States
  // ------------------------------------------------------------------------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('naannow_admin_theme') === 'dark';
  });
  const [globalSearch, setGlobalSearch] = useState('');

  // Upgraded Map States
  const [mapTheme, setMapTheme] = useState('dark'); // dark, light, cyberpunk, blueprint
  const [mapSearch, setMapSearch] = useState('');
  const [mapFilter, setMapFilter] = useState('all'); // all, active, idle
  const [mapZoom, setMapZoom] = useState(1); // 1 to 2.5
  const [hudRider, setHudRider] = useState(null); // rider coordinates inspected on map HUD
  const [selectedChartPoint, setSelectedChartPoint] = useState(null); // active graph data point details

  // ------------------------------------------------------------------------
  // Database States (loaded from localStorage or initialized dynamically)
  // ------------------------------------------------------------------------
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Custom Modules State
  const [tickets, setTickets] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    commission: 15,
    deliveryCharges: 150,
    taxes: 5,
    mapsApiKey: "AIzaSyD_mockMapKey2026_NaanNow",
    maintenanceMode: false,
    backupInterval: "Daily"
  });

  // UI Detail Modals / Dialogs states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [zoomedDoc, setZoomedDoc] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);

  // Dialog confirmations / inputs
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, text, actionType, payload, onConfirm }
  const [rejectionModal, setRejectionModal] = useState(null); // { type: 'rider'|'restaurant', email, name }
  const [rejectionInput, setRejectionInput] = useState('');

  // Toast System
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  // Live map & activities simulated data states
  const [liveActivities, setLiveActivities] = useState([]);
  const [riderCoordinates, setRiderCoordinates] = useState({});

  // Filters State
  const [orderFilter, setOrderFilter] = useState('Today'); // Today, Yesterday, This Week, Statuses...
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all'); // all, pending, approved, suspended
  const [riderFilter, setRiderFilter] = useState('all'); // all, pending, approved, suspended, online
  const [customerFilter, setCustomerFilter] = useState('all'); // all, active, blocked

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Chat message support text
  const [supportReplyText, setSupportReplyText] = useState('');

  // Promotions form builder states
  const [promoForm, setPromoForm] = useState({ code: '', discount: 20, type: 'Percentage', maxDiscount: 500, minBasket: 400 });
  // Notifications template builder states
  const [notifForm, setNotifForm] = useState({ title: '', body: '', image: '', target: 'All' });

  // References for keyboard search trigger
  const searchInputRef = useRef(null);

  // ------------------------------------------------------------------------
  // Toast Helper
  // ------------------------------------------------------------------------
  const triggerToast = (text, type = 'success') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ------------------------------------------------------------------------
  // 1. Initial Seeding and Database Loading
  // ------------------------------------------------------------------------
  useEffect(() => {
    // Auth Check
    const currentUserStr = localStorage.getItem('naannow_currentUser');
    if (!currentUserStr) {
      navigate('/login');
      return;
    }
    const currentUser = JSON.parse(currentUserStr);
    if (currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Load all data from API
    const loadAdminData = async () => {
      try {
        const [
          usersData,
          ordersData,
          restaurantsData,
          ticketsData,
          promotionsData,
          withdrawalsData,
          settingsData
        ] = await Promise.all([
          api.getAllUsers(),
          api.getOrders(),
          api.getRestaurants(),
          api.getTickets().catch(() => []),
          api.getPromotions().catch(() => []),
          api.getWithdrawals().catch(() => []),
          api.getSettings().catch(() => platformSettings)
        ]);
        
        setUsers(usersData);
        setOrders(ordersData);
        setRestaurants(restaurantsData);
        setTickets(ticketsData);
        setPromotions(promotionsData);
        setWithdrawals(withdrawalsData);
        setPlatformSettings(settingsData);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      }
    };

    loadAdminData();

    // Initialize Map Rider Coordinates
    const initialRiderCoords = {
      "ali@rider.com": {
        email: "ali@rider.com", x: 10, y: 30, angle: 0, status: "delivering", name: "Ali Khan",
        route: MAP_ROUTE_1, routeIndex: 0, direction: 1, battery: 88, speed: 25, orderId: "NN-194823",
        restaurant: "Caffeine & Co.", destination: "Sector F-10, Islamabad"
      },
      "hamza@rider.com": {
        email: "hamza@rider.com", x: 75, y: 80, angle: 90, status: "delivering", name: "Hamza Ahmed",
        route: MAP_ROUTE_2, routeIndex: 0, direction: 1, battery: 94, speed: 28, orderId: "NN-827364",
        restaurant: "Tandoori Flames", destination: "Sector G-11, Islamabad"
      },
      "bilal@rider.com": {
        email: "bilal@rider.com", x: 15, y: 75, angle: 0, status: "idle", name: "Bilal Butt",
        route: MAP_ROUTE_3, routeIndex: 0, direction: 1, battery: 42, speed: 12, orderId: null,
        restaurant: null, destination: null
      }
    };
    setRiderCoordinates(initialRiderCoords);

    // Initial Live Activities Ticker Seeding
    setLiveActivities([
      { id: 1, type: "order", text: "New Order #NN-827364 placed by Muhammad Saad", time: "2 min ago", status: "success" },
      { id: 2, type: "rider", text: "Rider Hamza Ahmed went Online in Sector F-10", time: "5 min ago", status: "info" },
      { id: 3, type: "restaurant", text: "Restaurant Tandoori Flames updated their Friday hours", time: "15 min ago", status: "warning" },
      { id: 4, type: "payout", text: "Platform payout of Rs. 32,500 processed for Tandoori Flames", time: "1 hr ago", status: "success" }
    ]);
  }, []);

  // ------------------------------------------------------------------------
  // Dark/Light Mode Side Effects
  // ------------------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('naannow_admin_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Move riders along their route smoothly
      setRiderCoordinates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(email => {
          const rider = updated[email];
          if (rider.status !== "offline" && rider.route) {
            let nextIndex = rider.routeIndex + rider.direction;
            let nextDirection = rider.direction;

            // Reversing direction when reaching endpoints
            if (nextIndex >= rider.route.length) {
              nextIndex = rider.route.length - 2;
              nextDirection = -1;
            } else if (nextIndex < 0) {
              nextIndex = 1;
              nextDirection = 1;
            }

            const currPt = rider.route[rider.routeIndex];
            const nextPt = rider.route[nextIndex];

            // Calculate bearing direction angle
            const angle = Math.round(Math.atan2(nextPt.y - currPt.y, nextPt.x - currPt.x) * (180 / Math.PI));

            // Decaying battery & fluctuating speed slightly
            const speedFluctuate = Math.max(10, Math.min(45, rider.speed + Math.floor(Math.random() * 5 - 2)));
            const batteryDecay = Math.max(1, rider.battery - (Math.random() > 0.8 ? 1 : 0));

            updated[email] = {
              ...rider,
              x: nextPt.x,
              y: nextPt.y,
              angle,
              routeIndex: nextIndex,
              direction: nextDirection,
              speed: speedFluctuate,
              battery: batteryDecay
            };
          }
        });
        return updated;
      });

      // 2. Random Live Activity event triggers
      const eventChance = Math.random();
      if (eventChance > 0.6) {
        const events = [
          { type: "order", text: "Order #NN-194823 has been accepted by Caffeine & Co.", status: "success" },
          { type: "rider", text: "Rider Ali Khan received delivery assignment for NN-827364", status: "info" },
          { type: "complaint", text: "Customer complaint ticket TK-102 updated", status: "error" },
          { type: "order", text: "Order #NN-827364 status changed to Preparing", status: "warning" },
          { type: "restaurant", text: "New restaurant request: Khyber Shinwari (F-7)", status: "info" }
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const newEvent = {
          id: Date.now(),
          type: randomEvent.type,
          text: randomEvent.text,
          time: "Just now",
          status: randomEvent.status
        };
        setLiveActivities(prev => [newEvent, ...prev.slice(0, 10)]);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------------------
  // Global Keyboard Shortcuts Hook
  // ------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC closes overlays
      if (e.key === "Escape") {
        setSelectedOrder(null);
        setSelectedRestaurant(null);
        setSelectedRider(null);
        setSelectedCustomer(null);
        setZoomedDoc(null);
        setConfirmDialog(null);
        setRejectionModal(null);
        setActiveTicket(null);
      }

      // Ctrl + / focuses Global search bar
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }

      // Nav Shortcuts: alt + g + key
      if (e.altKey && e.key === "d") setActiveMenuTab('dashboard');
      if (e.altKey && e.key === "o") setActiveMenuTab('orders');
      if (e.altKey && e.key === "r") setActiveMenuTab('restaurants');
      if (e.altKey && e.key === "m") setActiveMenuTab('riders');
      if (e.altKey && e.key === "c") setActiveMenuTab('customers');
      if (e.altKey && e.key === "p") setActiveMenuTab('payments');
      if (e.altKey && e.key === "s") setActiveMenuTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset pagination on tab switches
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMenuTab, orderFilter, orderStatusFilter, restaurantFilter, riderFilter, customerFilter, globalSearch]);

  // ------------------------------------------------------------------------
  // Platform Actions Handlers
  // ------------------------------------------------------------------------

  // User Verification Actions
  const handleApproveUser = (email, role) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const updated = { ...u, status: 'approved', rejectionReason: '' };
        // Sync approved manager's restaurant
        if (role === 'manager') {
          syncRestaurantData(updated);
        }
        return updated;
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    triggerToast(`${role.toUpperCase()} approved successfully!`);

    // Sync modals
    if (selectedRider && selectedRider.email === email) setSelectedRider(prev => ({ ...prev, status: 'approved' }));
    if (selectedRestaurant && selectedRestaurant.email === email) setSelectedRestaurant(prev => ({ ...prev, status: 'approved' }));
  };

  const handleOpenReject = (email, name, role) => {
    setRejectionModal({ type: role, email, name });
    setRejectionInput('');
  };

  const handleConfirmRejection = () => {
    if (!rejectionInput.trim()) {
      alert("Please specify a reason.");
      return;
    }
    const { email, type } = rejectionModal;
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, status: 'rejected', rejectionReason: rejectionInput.trim() };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    triggerToast(`${type.toUpperCase()} rejected. Notes saved.`);
    setRejectionModal(null);

    // Sync modal
    if (selectedRider && selectedRider.email === email) setSelectedRider(prev => ({ ...prev, status: 'rejected', rejectionReason: rejectionInput }));
    if (selectedRestaurant && selectedRestaurant.email === email) setSelectedRestaurant(prev => ({ ...prev, status: 'rejected', rejectionReason: rejectionInput }));
  };

  const handleSuspendUser = (email, role) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, status: 'blocked' };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    triggerToast(`${role.toUpperCase()} account suspended.`);

    // Sync modal
    if (selectedRider && selectedRider.email === email) setSelectedRider(prev => ({ ...prev, status: 'blocked' }));
    if (selectedRestaurant && selectedRestaurant.email === email) setSelectedRestaurant(prev => ({ ...prev, status: 'blocked' }));
    if (selectedCustomer && selectedCustomer.email === email) setSelectedCustomer(prev => ({ ...prev, status: 'blocked' }));
  };

  const handleUnblockUser = (email, role) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, status: 'approved' };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
    triggerToast(`${role.toUpperCase()} account reactivated.`);

    // Sync modal
    if (selectedRider && selectedRider.email === email) setSelectedRider(prev => ({ ...prev, status: 'approved' }));
    if (selectedRestaurant && selectedRestaurant.email === email) setSelectedRestaurant(prev => ({ ...prev, status: 'approved' }));
    if (selectedCustomer && selectedCustomer.email === email) setSelectedCustomer(prev => ({ ...prev, status: 'approved' }));
  };

  // Helper to sync Manager Approved Restaurant
  const syncRestaurantData = (manager) => {
    const savedRes = localStorage.getItem('naannow_restaurants');
    let resList = [];
    if (savedRes) {
      resList = JSON.parse(savedRes);
    }
    const exists = resList.some(r => r.name.toLowerCase() === manager.restaurantName.toLowerCase());
    if (!exists) {
      const newRestaurant = {
        id: Date.now(),
        name: manager.restaurantName,
        cuisine: "Continental • Desi • Fast Food",
        rating: 4.5,
        deliveryTime: "30-40 min",
        deliveryFee: "Rs. 150",
        image: manager.cover || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000",
        logo: manager.logo || "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80",
        isSuper: true,
        deal: "Platform Approved",
        commissionRate: platformSettings.commission,
        city: manager.city || "Islamabad",
        owner: manager.name,
        phone: manager.phone || "N/A",
        email: manager.email,
        status: "approved",
        orders: 0
      };
      resList.push(newRestaurant);
      localStorage.setItem('naannow_restaurants', JSON.stringify(resList));
      setRestaurants(resList);
    }
  };

  // Order Actions (Cancel / Refund / Status Changes)
  const handleCancelOrder = (orderId) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'Cancelled' };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
    triggerToast(`Order ${orderId} has been Cancelled`, 'warning');
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: 'Cancelled' }));
    }
  };

  const handleRefundOrder = (orderId) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'Refunded' };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
    triggerToast(`Refund processed for order ${orderId}`, 'success');
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: 'Refunded' }));
    }
  };

  const handleSaveAdminNotes = (orderId, notesText) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, adminNotes: notesText };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('naannow_orders', JSON.stringify(updated));
    triggerToast(`Notes updated for order ${orderId}`);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, adminNotes: notesText }));
    }
  };

  // Support Reply Send
  const handleSendSupportReply = (ticketId) => {
    if (!supportReplyText.trim()) return;

    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const newMsg = { sender: "support", text: supportReplyText.trim(), time: "Just now" };
        return { ...t, chat: [...t.chat, newMsg], status: "Resolved" };
      }
      return t;
    });
    setTickets(updated);
    localStorage.setItem('naannow_tickets', JSON.stringify(updated));
    setSupportReplyText('');
    triggerToast("Reply sent to customer ticket!");

    // Sync modal active state
    const currentTicket = updated.find(t => t.id === ticketId);
    setActiveTicket(currentTicket);
  };

  const handleAssignTicket = (ticketId, staffName) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, assignedTo: staffName };
      }
      return t;
    });
    setTickets(updated);
    localStorage.setItem('naannow_tickets', JSON.stringify(updated));
    triggerToast(`Ticket assigned to support specialist: ${staffName}`);
    setActiveTicket(prev => ({ ...prev, assignedTo: staffName }));
  };

  // Promotions Creators
  const handleCreatePromo = (e) => {
    e.preventDefault();
    if (!promoForm.code.trim()) return;
    const exists = promotions.some(p => p.code.toUpperCase() === promoForm.code.toUpperCase());
    if (exists) {
      triggerToast("Promo code already exists!", "error");
      return;
    }
    const newPromo = {
      code: promoForm.code.toUpperCase(),
      discount: Number(promoForm.discount),
      type: promoForm.type,
      minBasket: Number(promoForm.minBasket),
      maxDiscount: Number(promoForm.maxDiscount),
      status: "Active"
    };
    const updated = [newPromo, ...promotions];
    setPromotions(updated);
    localStorage.setItem('naannow_promotions', JSON.stringify(updated));
    triggerToast(`Coupon ${newPromo.code} created successfully!`);
    setPromoForm({ code: '', discount: 20, type: 'Percentage', maxDiscount: 500, minBasket: 400 });
  };

  const handleTogglePromoStatus = (code) => {
    const updated = promotions.map(p => {
      if (p.code === code) {
        return { ...p, status: p.status === 'Active' ? 'Expired' : 'Active' };
      }
      return p;
    });
    setPromotions(updated);
    localStorage.setItem('naannow_promotions', JSON.stringify(updated));
    triggerToast(`Promo status updated for ${code}`);
  };

  // Push Notifications Composer
  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.body.trim()) return;
    const newNotification = {
      id: Date.now(),
      title: notifForm.title.trim(),
      body: notifForm.body.trim(),
      image: notifForm.image.trim() || null,
      target: notifForm.target,
      sentAt: new Date().toISOString()
    };
    const updated = [newNotification, ...sentNotifications];
    setSentNotifications(updated);
    localStorage.setItem('naannow_sentNotifications', JSON.stringify(updated));
    triggerToast(`Rich notification broadcast sent to target: ${notifForm.target}!`);
    setNotifForm({ title: '', body: '', image: '', target: 'All' });
  };

  // Settings modification
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('naannow_platformSettings', JSON.stringify(platformSettings));
    triggerToast("Settings saved and operational globally!");
  };

  // DB Backup Exporter
  const handleExportDB = () => {
    const keys = ['naannow_registeredUsers', 'naannow_orders', 'naannow_restaurants', 'naannow_tickets', 'naannow_promotions', 'naannow_withdrawals', 'naannow_platformSettings'];
    const db = {};
    keys.forEach(k => {
      db[k] = localStorage.getItem(k);
    });
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `naannow_admin_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    triggerToast("Database state successfully backed up!");
  };

  const handleRestoreDB = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      Object.keys(parsed).forEach(k => {
        if (parsed[k]) {
          localStorage.setItem(k, parsed[k]);
        }
      });
      // Refresh views
      setUsers(JSON.parse(localStorage.getItem('naannow_registeredUsers') || '[]'));
      setOrders(JSON.parse(localStorage.getItem('naannow_orders') || '[]'));
      setRestaurants(JSON.parse(localStorage.getItem('naannow_restaurants') || '[]'));
      setTickets(JSON.parse(localStorage.getItem('naannow_tickets') || '[]'));
      setPromotions(JSON.parse(localStorage.getItem('naannow_promotions') || '[]'));
      setWithdrawals(JSON.parse(localStorage.getItem('naannow_withdrawals') || '[]'));
      setPlatformSettings(JSON.parse(localStorage.getItem('naannow_platformSettings') || '{}'));
      triggerToast("System restore complete!", "success");
    } catch (err) {
      alert("Invalid restore token format.");
    }
  };

  // Financial payout action
  const handleProcessPayout = (txnId) => {
    const updated = withdrawals.map(w => {
      if (w.id === txnId) {
        return { ...w, status: 'Completed' };
      }
      return w;
    });
    setWithdrawals(updated);
    localStorage.setItem('naannow_withdrawals', JSON.stringify(updated));
    triggerToast(`Payout processed successfully!`);
  };

  // CSV Report Generator
  const handleExportCSV = (dataset, filename) => {
    if (!dataset || dataset.length === 0) return;
    const headers = Object.keys(dataset[0]).join(',');
    const rows = dataset.map(row =>
      Object.values(row).map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("CSV downloaded successfully!");
  };

  // Printable layout generator (Mocking PDF printer stream)
  const handlePrintPDF = (title) => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem('naannow_currentUser');
    navigate('/login');
  };

  // ------------------------------------------------------------------------
  // Data Filtering Engine
  // ------------------------------------------------------------------------

  // 1. Dashboard Sales calculations
  const totalSales = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const activeOrdersCount = orders.filter(o => ['Preparing', 'Baking', 'Waiting for Rider', 'Delivering', 'Sent'].includes(o.status)).length;

  const pendingApprovalsCount = users.filter(u => u.status === 'pending' && (u.role === 'rider' || u.role === 'manager')).length;
  const ridersCount = users.filter(u => u.role === 'rider').length;
  const managersCount = users.filter(u => u.role === 'manager').length;
  const customersCount = users.filter(u => u.role === 'customer').length;

  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

  // Dynamic calculation for Daily Revenue Trend (last 7 calendar days)
  const getDailyRevenueData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // Compile labels for the last 7 calendar days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      last7Days.push({
        dateStr: d.toDateString(),
        dayLabel: days[d.getDay()],
        revenue: 0,
        ordersList: [] // track orders contributing to this day's sales
      });
    }

    // Accumulate total completed/active orders revenue by date matching
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        const oDate = new Date(o.date).toDateString();
        const found = last7Days.find(item => item.dateStr === oDate);
        if (found) {
          found.revenue += (o.grandTotal || 0);
          found.ordersList.push(o);
        }
      }
    });

    // Fallback simulated values if there is no order data yet
    const hasTransactions = last7Days.some(d => d.revenue > 0);
    if (!hasTransactions) {
      const mockRevenues = [14000, 18000, 12000, 21000, 23000, 25000, 28000];
      last7Days.forEach((item, index) => {
        item.revenue = mockRevenues[index];
        item.ordersList = [
          { id: `NN-8273${index}1`, grandTotal: Math.round(item.revenue * 0.45), status: 'Delivered', restaurantName: 'Tandoori Flames', date: item.dateStr },
          { id: `NN-8273${index}2`, grandTotal: Math.round(item.revenue * 0.55), status: 'Delivered', restaurantName: 'Caffeine & Co.', date: item.dateStr }
        ];
      });
    }

    // Map calculated values directly to SVG coordinates
    // SVG x coordinates span from 40 to 478
    const xCoords = [40, 113, 186, 259, 332, 405, 478];
    const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1000);

    const points = last7Days.map((item, idx) => {
      const x = xCoords[idx];
      const ratio = item.revenue / maxRevenue;
      const y = 170 - (ratio * 120); // y fits exactly inside graph boundaries
      return {
        ...item,
        x,
        y: Math.round(y)
      };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `M 40 170 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 478 170 Z`;

    return { points, linePath, areaPath, maxRevenue };
  };

  const dailyRevenue = getDailyRevenueData();

  // 2. Orders Filtering
  const getFilteredOrders = () => {
    let list = [...orders];

    // Search bar matching
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.restaurantName && o.restaurantName.toLowerCase().includes(q))
      );
    }

    // Time frame filter
    const now = new Date();
    if (orderFilter === 'Today') {
      list = list.filter(o => {
        const oDate = new Date(o.date);
        return oDate.toDateString() === now.toDateString();
      });
    } else if (orderFilter === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      list = list.filter(o => {
        const oDate = new Date(o.date);
        return oDate.toDateString() === yesterday.toDateString();
      });
    } else if (orderFilter === 'This Week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 7);
      list = list.filter(o => new Date(o.date) >= startOfWeek);
    }

    // Status filter
    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }

    return list;
  };

  // 3. Restaurants Filtering
  const getFilteredRestaurants = () => {
    let list = users.filter(u => u.role === 'manager');

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(r =>
        (r.restaurantName && r.restaurantName.toLowerCase().includes(q)) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }

    if (restaurantFilter !== 'all') {
      list = list.filter(r => r.status === restaurantFilter);
    }

    return list;
  };

  // 4. Riders Filtering
  const getFilteredRiders = () => {
    let list = users.filter(u => u.role === 'rider');

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.vehicleDetails && r.vehicleDetails.toLowerCase().includes(q)) ||
        (r.licensePlate && r.licensePlate.toLowerCase().includes(q))
      );
    }

    if (riderFilter === 'online') {
      // hamza is online, ali is pending online status based on dummy coords
      list = list.filter(r => r.email === 'hamza@rider.com' || r.email === 'ali@rider.com');
    } else if (riderFilter !== 'all') {
      list = list.filter(r => r.status === riderFilter);
    }

    return list;
  };

  // 5. Customers Filtering
  const getFilteredCustomers = () => {
    let list = users.filter(u => u.role === 'customer');

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    if (customerFilter !== 'all') {
      list = list.filter(c => c.status === customerFilter);
    }

    return list;
  };

  // Helpers for pagination computations
  const getPaginatedList = (fullList) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return fullList.slice(startIndex, startIndex + itemsPerPage);
  };

  // Helper for Order item image safety
  const safeGetImg = (item) => {
    return item.image || "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200";
  };

  return (
    <div className={`admin-dashboard-page ${darkMode ? 'dark-theme' : ''}`}>

      {/* ====================================================================
         LEFT SIDEBAR (COLLAPSIBLE)
         ==================================================================== */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="brand-wrapper" onClick={() => setActiveMenuTab('dashboard')}>
            <div className="brand-icon">
              <img src={naanSvg} alt="Naan Logo" className="brand-logo-img" />
            </div>
            <span className="brand-name">NaanNow Admin</span>
          </div>
          <button className="toggle-sidebar-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <Icon name="arrowRight" size={16} /> : <Icon name="arrowLeft" size={16} />}
          </button>
        </div>

        <ul className="admin-sidebar-menu">
          <div className="menu-section-label">General</div>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenuTab('dashboard')}>
              <span className="menu-link-icon"><Icon name="dashboard" /></span>
              <span className="menu-text">Dashboard</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveMenuTab('orders')}>
              <span className="menu-link-icon"><Icon name="orders" /></span>
              <span className="menu-text">Orders ({orders.length})</span>
            </button>
          </li>

          <div className="menu-section-label">Partners</div>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveMenuTab('restaurants')}>
              <span className="menu-link-icon"><Icon name="restaurants" /></span>
              <span className="menu-text">Restaurants ({managersCount})</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'riders' ? 'active' : ''}`} onClick={() => setActiveMenuTab('riders')}>
              <span className="menu-link-icon"><Icon name="riders" /></span>
              <span className="menu-text">Riders ({ridersCount})</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveMenuTab('customers')}>
              <span className="menu-link-icon"><Icon name="customers" /></span>
              <span className="menu-text">Customers</span>
            </button>
          </li>

          <div className="menu-section-label">Platform Control</div>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'verification' ? 'active' : ''}`} onClick={() => setActiveMenuTab('verification')}>
              <span className="menu-link-icon"><Icon name="verification" /></span>
              <span className="menu-text">Verification Center {pendingApprovalsCount > 0 && <span className="status-pill cancelled" style={{ padding: '2px 6px', fontSize: '9px', marginLeft: '6px' }}>{pendingApprovalsCount}</span>}</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'menu_categories' ? 'active' : ''}`} onClick={() => setActiveMenuTab('menu_categories')}>
              <span className="menu-link-icon"><Icon name="menu" /></span>
              <span className="menu-text">Categories</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveMenuTab('payments')}>
              <span className="menu-link-icon"><Icon name="payments" /></span>
              <span className="menu-text">Payments & Ledger</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'promotions' ? 'active' : ''}`} onClick={() => setActiveMenuTab('promotions')}>
              <span className="menu-link-icon"><Icon name="promotions" /></span>
              <span className="menu-text">Promotions</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveMenuTab('analytics')}>
              <span className="menu-link-icon"><Icon name="analytics" /></span>
              <span className="menu-text">Analytics</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'support' ? 'active' : ''}`} onClick={() => setActiveMenuTab('support')}>
              <span className="menu-link-icon"><Icon name="support" /></span>
              <span className="menu-text">Customer Support {tickets.filter(t => t.status === 'Open').length > 0 && <span className="status-pill cancelled" style={{ padding: '2px 6px', fontSize: '9px', marginLeft: '6px' }}>{tickets.filter(t => t.status === 'Open').length}</span>}</span>
            </button>
          </li>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveMenuTab('notifications')}>
              <span className="menu-link-icon"><Icon name="notifications" /></span>
              <span className="menu-text">Rich Alerts</span>
            </button>
          </li>

          <div className="menu-section-label">System</div>

          <li className="menu-item">
            <button className={`menu-link ${activeMenuTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenuTab('settings')}>
              <span className="menu-link-icon"><Icon name="settings" /></span>
              <span className="menu-text">Settings</span>
            </button>
          </li>
        </ul>

        <div className="admin-sidebar-footer">
          <div className="quick-profile">
            <div className="quick-avatar">AD</div>
            <div className="quick-info">
              <span className="quick-name">System Administrator</span>
              <span className="quick-role">NaanNow Executive</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
         MAIN EXECUTIVE CONTAINER LAYOUT
         ==================================================================== */}
      <div className="admin-layout-container">

        {/* ====================================================================
           TOPBAR NAVIGATION
           ==================================================================== */}
        <nav className="admin-topnav">
          <div className="topnav-left">
            <div className="global-search-container">
              <div className="search-input-wrapper">
                <Icon name="search" size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Global Search (Press Alt+D to navigate panels)..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
                <span className="search-shortcut-badge">Ctrl+/</span>
              </div>
            </div>
          </div>

          <div className="topnav-right">
            {/* Theme Toggle */}
            <button className="topnav-action-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme mode">
              {darkMode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>

            {/* Support Messages shortcut */}
            <button className="topnav-action-btn" onClick={() => setActiveMenuTab('support')} title="View support desk">
              <Icon name="support" />
              {tickets.filter(t => t.status === 'Open').length > 0 && <span className="badge-dot" />}
            </button>

            {/* Notifications panel toggle */}
            <button className="topnav-action-btn" onClick={() => setActiveMenuTab('notifications')} title="Rich push campaigns">
              <Icon name="notifications" />
            </button>

            {/* Profile actions dropdown */}
            <div className="user-profile-menu" onClick={handleLogout} title="Click to log out safely">
              <div className="user-avatar">SA</div>
              <div className="user-meta-desktop">
                <span className="user-name-txt">Super Admin</span>
                <span className="user-role-txt">Governance Panel</span>
              </div>
              <Icon name="logout" size={14} className="logout-icon" />
            </div>
          </div>
        </nav>

        {/* ====================================================================
           SUB-VIEWS WRAPPER
           ==================================================================== */}
        <main className="admin-content-area">

          {/* SKELETON LOADER EXAMPLE IF LOADING */}
          {users.length === 0 && orders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="skeleton-box" style={{ height: '80px', width: '40%' }}></div>
              <div className="stats-grid">
                <div className="skeleton-box" style={{ height: '120px' }}></div>
                <div className="skeleton-box" style={{ height: '120px' }}></div>
                <div className="skeleton-box" style={{ height: '120px' }}></div>
                <div className="skeleton-box" style={{ height: '120px' }}></div>
              </div>
              <div className="skeleton-box" style={{ height: '350px' }}></div>
            </div>
          ) : (
            <>
              {/* ====================================================================
                 VIEW 1: EXECUTIVE DASHBOARD
                 ==================================================================== */}
              {activeMenuTab === 'dashboard' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Business Overview Dashboard</h1>
                      <p>Complete executive review of the NaanNow ecosystem metrics & performance charts.</p>
                    </div>
                    <div className="header-actions-row">
                      <button className="btn-secondary" onClick={() => handlePrintPDF('Dashboard Summary')}>
                        <Icon name="export" size={14} /> Print Summary
                      </button>
                      <button className="btn-primary" onClick={() => setActiveMenuTab('orders')}>
                        Manage Operations <Icon name="arrowRight" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Top Stats Cards */}
                  <div className="stats-grid">
                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Today's Revenue</span>
                        <div className="metric-icon-box"><Icon name="payments" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">Rs. {totalSales.toLocaleString()}</span>
                        <span className="metric-trend trend-up">▲ 12.8%</span>
                      </div>
                      <span className="metric-card-footer">Compared to Rs. 21,700 yesterday</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Today's Orders</span>
                        <div className="metric-icon-box"><Icon name="orders" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{orders.length}</span>
                        <span className="metric-trend trend-up">▲ 8.4%</span>
                      </div>
                      <span className="metric-card-footer">{activeOrdersCount} active delivery streams currently</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Active Riders</span>
                        <div className="metric-icon-box"><Icon name="riders" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{ridersCount}</span>
                        <span className="metric-trend trend-up">▲ 14 online</span>
                      </div>
                      <span className="metric-card-footer">Online and serving sectors right now</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Total Restaurants</span>
                        <div className="metric-icon-box"><Icon name="restaurants" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{managersCount}</span>
                        <span className="metric-trend trend-up">▲ +2 new</span>
                      </div>
                      <span className="metric-card-footer">Active managers registered</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Active Customers</span>
                        <div className="metric-icon-box"><Icon name="customers" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{customersCount}</span>
                        <span className="metric-trend trend-up">▲ 24% YoY</span>
                      </div>
                      <span className="metric-card-footer">Registered customer profiles</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Pending Approvals</span>
                        <div className="metric-icon-box"><Icon name="verification" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{pendingApprovalsCount}</span>
                        <span className={`metric-trend ${pendingApprovalsCount > 0 ? 'trend-down' : 'trend-up'}`}>
                          {pendingApprovalsCount > 0 ? 'Action Needed' : 'All Clear'}
                        </span>
                      </div>
                      <span className="metric-card-footer">Riders & managers verification inbox</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Cancelled Orders</span>
                        <div className="metric-icon-box"><Icon name="ban" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">{cancelledOrdersCount}</span>
                        <span className="metric-trend trend-down">▼ 15% reduction</span>
                      </div>
                      <span className="metric-card-footer">Failed / rejected checkout transactions</span>
                    </div>

                    <div className="metric-card">
                      <div className="metric-card-header">
                        <span className="metric-card-title">Monthly Growth</span>
                        <div className="metric-icon-box"><Icon name="analytics" /></div>
                      </div>
                      <div className="metric-card-body">
                        <span className="metric-num">24.8%</span>
                        <span className="metric-trend trend-up">▲ +3.2%</span>
                      </div>
                      <span className="metric-card-footer">Target business benchmark is 20%</span>
                    </div>
                  </div>

                  {/* Interactive SVG Charts Section */}
                  <div className="charts-grid">
                    {/* Revenue Trend Area Chart */}
                    <div className="chart-card">
                      <div className="chart-header" style={{ marginBottom: '12px' }}>
                        <div className="chart-title">
                          <h3>Daily Revenue Trend</h3>
                          <p>Aggregated sales trends. Click any data point to audit transactions.</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
                        {/* SVG Graph View */}
                        <div className="chart-container-box" style={{ flex: '1 1 300px', height: '220px', margin: 0 }}>
                          <svg viewBox="0 0 500 220" width="100%" height="100%">
                            <defs>
                              <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line x1="40" y1="20" x2="480" y2="20" className="svg-chart-grid-line" />
                            <line x1="40" y1="70" x2="480" y2="70" className="svg-chart-grid-line" />
                            <line x1="40" y1="120" x2="480" y2="120" className="svg-chart-grid-line" />
                            <line x1="40" y1="170" x2="480" y2="170" className="svg-chart-grid-line" />

                            {/* Area & Line */}
                            <path d={dailyRevenue.areaPath} className="svg-chart-area" />
                            <path d={dailyRevenue.linePath} className="svg-chart-line" />

                            {/* Data points */}
                            {dailyRevenue.points.map((p, idx) => {
                              const isSelected = selectedChartPoint && selectedChartPoint.dateStr === p.dateStr;
                              return (
                                <circle
                                  key={idx}
                                  cx={p.x}
                                  cy={p.y}
                                  r={isSelected ? 7 : 5}
                                  fill={isSelected ? 'var(--accent-color)' : 'var(--accent-color)'}
                                  stroke={isSelected ? 'var(--success-color)' : 'white'}
                                  strokeWidth={isSelected ? 3 : 1.5}
                                  className="chart-dot"
                                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                  onClick={() => setSelectedChartPoint(p)}
                                  title={`${p.dayLabel}: Rs. ${p.revenue.toLocaleString()}`}
                                />
                              );
                            })}

                            {/* Labels */}
                            {dailyRevenue.points.map((p, idx) => (
                              <text
                                key={idx}
                                x={p.x}
                                y="195"
                                fill="var(--text-muted)"
                                fontSize="10"
                                textAnchor="middle"
                              >
                                {p.dayLabel}
                              </text>
                            ))}

                            <text x="30" y="110" fill="var(--text-muted)" fontSize="9" textAnchor="end">
                              {Math.round(dailyRevenue.maxRevenue / 2 / 1000)}k
                            </text>
                            <text x="30" y="50" fill="var(--text-muted)" fontSize="9" textAnchor="end">
                              {Math.round(dailyRevenue.maxRevenue / 1000)}k
                            </text>
                          </svg>
                        </div>

                        {/* Interactive Data inspector side panel */}
                        <div className="chart-point-details-panel" style={{
                          flex: '0 1 200px',
                          padding: '16px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          justifyContent: 'center',
                          minWidth: '200px'
                        }}>
                          {selectedChartPoint ? (
                            <div style={{ animation: 'fadeIn 0.25s ease' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                                📊 {selectedChartPoint.dayLabel} Summary
                              </h4>
                              <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Calendar Date</span>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {new Date(selectedChartPoint.dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Daily Revenue</span>
                                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success-color)' }}>
                                  Rs. {selectedChartPoint.revenue.toLocaleString()}
                                </span>
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Total Orders</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {selectedChartPoint.ordersList.length} deliveries
                                </span>
                              </div>

                              <div>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Contributing Transactions</span>
                                <div style={{ maxHeight: '72px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
                                  {selectedChartPoint.ordersList.length > 0 ? (
                                    selectedChartPoint.ordersList.map((o, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          fontSize: '11px',
                                          padding: '4px 6px',
                                          borderRadius: '6px',
                                          backgroundColor: 'var(--bg-primary)',
                                          border: '1px solid var(--border-color)'
                                        }}
                                      >
                                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>#{o.id.toString().slice(-5).toUpperCase()}</span>
                                        <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>Rs. {o.grandTotal.toLocaleString()}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No active sales.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>
                              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💡</div>
                              <p style={{ fontSize: '12px', lineHeight: '1.4', margin: 0 }}>Click any graph data point to audit transaction details, daily totals, and invoice items.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Status Pie Chart & Peak Hours Bar Chart */}
                    <div className="chart-card">
                      <div className="chart-header">
                        <div className="chart-title">
                          <h3>Operational Breakdowns</h3>
                          <p>Order Status metrics and Top Cities distribution</p>
                        </div>
                      </div>
                      <div className="chart-container-box" style={{ flexDirection: 'column' }}>
                        {/* Custom SVG Pie Chart */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                          <svg width="150" height="150" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--scrollbar-track)" strokeWidth="4" />
                            {/* Segment 1: Delivered (65%) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--success-color)" strokeWidth="4.2" strokeDasharray="65 35" strokeDashoffset="25" className="pie-segment" />
                            {/* Segment 2: Preparing (15%) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning-color)" strokeWidth="4.2" strokeDasharray="15 85" strokeDashoffset="-40" className="pie-segment" />
                            {/* Segment 3: Out for Delivery (10%) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--info-color)" strokeWidth="4.2" strokeDasharray="10 90" strokeDashoffset="-55" className="pie-segment" />
                            {/* Segment 4: Cancelled (10%) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--error-color)" strokeWidth="4.2" strokeDasharray="10 90" strokeDashoffset="-65" className="pie-segment" />
                          </svg>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: 'var(--success-color)' }}></span> Delivered: 65%</div>
                            <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: 'var(--warning-color)' }}></span> Preparing: 15%</div>
                            <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: 'var(--info-color)' }}></span> Out for Delivery: 10%</div>
                            <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: 'var(--error-color)' }}></span> Cancelled: 10%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Ticker Activity stream */}
                  <div className="activity-grid">
                    <div className="activity-card">
                      <div className="chart-header">
                        <h3><span className="live-pulse-indicator"></span>Live Activity Stream</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-updating in real-time</span>
                      </div>
                      <div className="activity-list">
                        {liveActivities.map((act) => (
                          <div className="activity-item" key={act.id}>
                            <div className={`activity-badge-icon ${act.status}`}>
                              {act.type === 'order' && '📦'}
                              {act.type === 'rider' && '🛵'}
                              {act.type === 'restaurant' && '🏪'}
                              {act.type === 'complaint' && '🎫'}
                              {act.type === 'payout' && '💳'}
                            </div>
                            <div className="activity-info">
                              <p className="activity-title-text">{act.text}</p>
                              <span className="activity-desc-text">NaanNow Live Hub Tracker</span>
                            </div>
                            <span className="activity-time-lbl">{act.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 2: ORDERS MANAGEMENT
                 ==================================================================== */}
              {activeMenuTab === 'orders' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Orders Management Ledger</h1>
                      <p>View, track, cancel, refund, and administer details of all food deliveries.</p>
                    </div>
                  </div>

                  {/* Table Filter card */}
                  <div className="table-filter-card">
                    <div className="filter-left">
                      <button className={`filter-chip ${orderFilter === 'Today' ? 'active' : ''}`} onClick={() => setOrderFilter('Today')}>Today</button>
                      <button className={`filter-chip ${orderFilter === 'Yesterday' ? 'active' : ''}`} onClick={() => setOrderFilter('Yesterday')}>Yesterday</button>
                      <button className={`filter-chip ${orderFilter === 'This Week' ? 'active' : ''}`} onClick={() => setOrderFilter('This Week')}>This Week</button>
                      <button className={`filter-chip ${orderFilter === 'All' ? 'active' : ''}`} onClick={() => setOrderFilter('All')}>All Time</button>

                      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

                      <select className="select-filter-box" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending Approval</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Baking">Baking</option>
                        <option value="Waiting for Rider">Waiting for Rider</option>
                        <option value="Delivering">Delivering</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    <button className="btn-secondary" onClick={() => handleExportCSV(orders, "naannow_orders_report")}>
                      <Icon name="export" size={14} /> Export CSV
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Details</th>
                          <th>Restaurant</th>
                          <th>Amount (Rs.)</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Date & Time</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredOrders().length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No orders match the specified filters.
                            </td>
                          </tr>
                        ) : (
                          getPaginatedList(getFilteredOrders()).map(order => (
                            <tr key={order.id}>
                              <td style={{ fontWeight: '700' }}>{order.id}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '600' }}>{order.name || "Guest Customer"}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.phone || "N/A"}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: '500' }}>{order.restaurantName}</td>
                              <td style={{ fontWeight: '600', color: 'var(--accent-color)' }}>Rs. {order.grandTotal || order.totalPrice || 0}</td>
                              <td style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>{order.paymentMethod || "cod"}</td>
                              <td>
                                <span className={`status-pill ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {new Date(order.date).toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedOrder(order)}>
                                  Details / Control
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination widget */}
                  <div className="pagination-row-wrapper">
                    <span className="pagination-text-summary">
                      Showing page <strong>{currentPage}</strong> of <strong>{Math.ceil(getFilteredOrders().length / itemsPerPage) || 1}</strong> ({getFilteredOrders().length} orders total)
                    </span>
                    <div className="pagination-actions-box">
                      <button className="pagination-nav-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
                      <button className="pagination-nav-btn" disabled={currentPage >= Math.ceil(getFilteredOrders().length / itemsPerPage)} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 3: RESTAURANT PARTNERS MANAGEMENT
                 ==================================================================== */}
              {activeMenuTab === 'restaurants' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Restaurant Partners Control</h1>
                      <p>Supervise restaurant registration requests, verify license credentials, CNICs, and adjust commission rates.</p>
                    </div>
                  </div>

                  {/* Table Filter card */}
                  <div className="table-filter-card">
                    <div className="filter-left">
                      <button className={`filter-chip ${restaurantFilter === 'all' ? 'active' : ''}`} onClick={() => setRestaurantFilter('all')}>All Partners</button>
                      <button className={`filter-chip ${restaurantFilter === 'pending' ? 'active' : ''}`} onClick={() => setRestaurantFilter('pending')}>Pending Approval</button>
                      <button className={`filter-chip ${restaurantFilter === 'approved' ? 'active' : ''}`} onClick={() => setRestaurantFilter('approved')}>Active / Approved</button>
                      <button className={`filter-chip ${restaurantFilter === 'blocked' ? 'active' : ''}`} onClick={() => setRestaurantFilter('blocked')}>Suspended</button>
                    </div>
                  </div>

                  {/* Restaurant Table */}
                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Restaurant Details</th>
                          <th>Owner Profile</th>
                          <th>Location / Contact</th>
                          <th>Rating</th>
                          <th>Commission</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredRestaurants().length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No restaurants found matching this criteria.
                            </td>
                          </tr>
                        ) : (
                          getPaginatedList(getFilteredRestaurants()).map(manager => (
                            <tr key={manager.email}>
                              <td>
                                <div className="avatar-cell">
                                  {manager.logo ? (
                                    <img src={manager.logo} alt="Logo" className="user-profile-img" style={{ borderRadius: '8px' }} />
                                  ) : (
                                    <div className="avatar-initials" style={{ borderRadius: '8px' }}>R</div>
                                  )}
                                  <div>
                                    <span className="user-fullname">{manager.restaurantName || "Unnamed Eatery"}</span>
                                    <span className="user-subinfo" style={{ display: 'block' }}>Platform Partner</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '500' }}>{manager.name}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CNIC: {manager.cnicNumber || "Pending"}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span>{manager.city || "Islamabad"}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{manager.phone || manager.email}</span>
                                </div>
                              </td>
                              <td>⭐ {manager.rating || '4.5'}</td>
                              <td style={{ fontWeight: '600' }}>{manager.commissionRate || platformSettings.commission}%</td>
                              <td>
                                <span className={`status-pill ${(manager.status || 'approved').toLowerCase()}`}>
                                  {manager.status || 'approved'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedRestaurant(manager)}>
                                  Profile & Verification
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 4: RIDER MANAGEMENT
                 ==================================================================== */}
              {activeMenuTab === 'riders' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Riders Verification & Logs</h1>
                      <p>View riders license documents, online statuses, ratings, and track delivery routes.</p>
                    </div>
                  </div>

                  {/* Table Filter card */}
                  <div className="table-filter-card">
                    <div className="filter-left">
                      <button className={`filter-chip ${riderFilter === 'all' ? 'active' : ''}`} onClick={() => setRiderFilter('all')}>All Riders</button>
                      <button className={`filter-chip ${riderFilter === 'pending' ? 'active' : ''}`} onClick={() => setRiderFilter('pending')}>Pending Review</button>
                      <button className={`filter-chip ${riderFilter === 'approved' ? 'active' : ''}`} onClick={() => setRiderFilter('approved')}>Active / Approved</button>
                      <button className={`filter-chip ${riderFilter === 'online' ? 'active' : ''}`} onClick={() => setRiderFilter('online')}>Online GPS</button>
                      <button className={`filter-chip ${riderFilter === 'blocked' ? 'active' : ''}`} onClick={() => setRiderFilter('blocked')}>Blocked / Suspended</button>
                    </div>
                  </div>

                  {/* Rider Table */}
                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Rider Profile</th>
                          <th>Bike Details</th>
                          <th>License Plate</th>
                          <th>Online GPS</th>
                          <th>Deliveries</th>
                          <th>Rating</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredRiders().length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No riders match these filter configurations.
                            </td>
                          </tr>
                        ) : (
                          getPaginatedList(getFilteredRiders()).map(rider => {
                            const isRiderOnline = rider.email === 'hamza@rider.com' || rider.email === 'ali@rider.com';
                            return (
                              <tr key={rider.email}>
                                <td>
                                  <div className="avatar-cell">
                                    <div className="avatar-initials">🛵</div>
                                    <div>
                                      <span className="user-fullname">{rider.name}</span>
                                      <span className="user-subinfo" style={{ display: 'block' }}>{rider.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>{rider.vehicleDetails || "Honda CD70"}</td>
                                <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{rider.licensePlate || "Pending"}</td>
                                <td>
                                  <span style={{ display: 'flex', alignItems: 'center' }}>
                                    {isRiderOnline ? (
                                      <>
                                        <span className="live-pulse-indicator"></span> Online Tracking
                                      </>
                                    ) : (
                                      "● Offline"
                                    )}
                                  </span>
                                </td>
                                <td>{rider.completedDeliveries || Math.floor(Math.random() * 50 + 10)} Deliveries</td>
                                <td>⭐ {rider.rating || '4.8'}</td>
                                <td>
                                  <span className={`status-pill ${(rider.status || 'approved').toLowerCase()}`}>
                                    {rider.status || 'approved'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedRider(rider)}>
                                    Documents & Profile
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 5: CUSTOMER MANAGEMENT
                 ==================================================================== */}
              {activeMenuTab === 'customers' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Customer Accounts Matrix</h1>
                      <p>View customer profiles, orders history, loyalty points balances, and toggle account suspensions.</p>
                    </div>
                  </div>

                  <div className="table-filter-card">
                    <div className="filter-left">
                      <button className={`filter-chip ${customerFilter === 'all' ? 'active' : ''}`} onClick={() => setCustomerFilter('all')}>All Accounts</button>
                      <button className={`filter-chip ${customerFilter === 'approved' ? 'active' : ''}`} onClick={() => setCustomerFilter('approved')}>Active / Normal</button>
                      <button className={`filter-chip ${customerFilter === 'blocked' ? 'active' : ''}`} onClick={() => setCustomerFilter('blocked')}>Suspended / Fraudulent</button>
                    </div>
                  </div>

                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Customer Info</th>
                          <th>Total Orders</th>
                          <th>Spending Ledger</th>
                          <th>Loyalty Points</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCustomers().length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No customer accounts match criteria.
                            </td>
                          </tr>
                        ) : (
                          getPaginatedList(getFilteredCustomers()).map(customer => (
                            <tr key={customer.email}>
                              <td>
                                <div className="avatar-cell">
                                  <div className="avatar-initials" style={{ backgroundColor: 'var(--accent-color)' }}>C</div>
                                  <div>
                                    <span className="user-fullname">{customer.name || "Muhammad Saad"}</span>
                                    <span className="user-subinfo" style={{ display: 'block' }}>{customer.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontWeight: '500' }}>{orders.filter(o => o.phone === customer.phone || o.name === customer.name).length || 2} Orders</td>
                              <td style={{ fontWeight: '600', color: 'var(--accent-color)' }}>
                                Rs. {(orders.filter(o => o.phone === customer.phone || o.name === customer.name).reduce((s, o) => s + (o.grandTotal || 0), 0) || 2610).toLocaleString()}
                              </td>
                              <td>💎 {customer.loyaltyPoints || 350} Points</td>
                              <td>
                                <span className={`status-pill ${(customer.status || 'approved').toLowerCase()}`}>
                                  {customer.status || 'approved'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedCustomer(customer)}>
                                  Logs & Control
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 6: VERIFICATION CENTER
                 ==================================================================== */}
              {activeMenuTab === 'verification' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Verification Center Inbox</h1>
                      <p>Review documents submitted by partner restaurants and riders trying to join the platform.</p>
                    </div>
                  </div>

                  {/* Tabs within center */}
                  <div className="table-filter-card">
                    <div className="filter-left">
                      <button className={`filter-chip ${riderFilter === 'pending' ? 'active' : ''}`} onClick={() => { setRiderFilter('pending'); setActiveMenuTab('riders'); }}>
                        Rider Applications ({users.filter(u => u.status === 'pending' && u.role === 'rider').length})
                      </button>
                      <button className={`filter-chip ${restaurantFilter === 'pending' ? 'active' : ''}`} onClick={() => { setRestaurantFilter('pending'); setActiveMenuTab('restaurants'); }}>
                        Restaurant Applications ({users.filter(u => u.status === 'pending' && u.role === 'manager').length})
                      </button>
                    </div>
                  </div>

                  <div className="activity-grid">
                    {users.filter(u => u.status === 'pending').map(pending => (
                      <div className="chart-card" key={pending.email}>
                        <div className="chart-header">
                          <div>
                            <strong style={{ fontSize: '16px' }}>{pending.name}</strong>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Role: {pending.role.toUpperCase()} | CNIC: {pending.cnicNumber || "Pending"}</p>
                          </div>
                          <span className="status-pill pending">Pending Checks</span>
                        </div>
                        <div style={{ flex: 1, padding: '10px 0' }}>
                          <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
                            {pending.role === 'manager' ? `Eatery: ${pending.restaurantName}` : `Vehicle details: ${pending.vehicleDetails}`}
                          </p>
                          <div className="document-previews-grid">
                            <div className="document-preview-box" onClick={() => setZoomedDoc(pending.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500")}>
                              <img src={pending.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500"} alt="CNIC Front" />
                              <span className="document-label">CNIC Front View</span>
                            </div>
                            <div className="document-preview-box" onClick={() => setZoomedDoc(pending.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500")}>
                              <img src={pending.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500"} alt="CNIC Back" />
                              <span className="document-label">CNIC Back View</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleApproveUser(pending.email, pending.role)}>Approve</button>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => handleOpenReject(pending.email, pending.name, pending.role)}>Reject Checks</button>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => u.status === 'pending').length === 0 && (
                      <div className="chart-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
                        🎉 No pending rider or restaurant verification files currently in inbox queue!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 7: MENU CATEGORIES MANAGEMENT
                 ==================================================================== */}
              {activeMenuTab === 'menu_categories' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Menu Categorization Matrix</h1>
                      <p>Create and structure universal categories allowed on the platform.</p>
                    </div>
                  </div>

                  <div className="activity-grid">
                    <div className="chart-card">
                      <h3>Active Global Categories</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '20px 0' }}>
                        {["Burgers", "Pasta", "Rice", "BBQ", "Breads", "Curries", "Desserts", "Coffee", "Bakery", "Beverages", "Noodles", "Starters"].map(cat => (
                          <span key={cat} className="filter-chip active" style={{ padding: '8px 16px' }}>{cat}</span>
                        ))}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Category Settings & Permissions</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        To map categories dynamically to partner menus, administrators can edit individual menu catalogs within the Restaurant Profile details modules.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 8: PAYMENTS & FINANCIAL LEDGER
                 ==================================================================== */}
              {activeMenuTab === 'payments' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Financial Ledger & Settlements</h1>
                      <p>View splits of gross sales, process payouts for riders/restaurants, and export financial records.</p>
                    </div>
                  </div>

                  <div className="ledger-header-box">
                    <div className="ledger-stat-card">
                      <strong>Gross Platform Sales</strong>
                      <p className="ledger-num">Rs. {totalSales.toLocaleString()}</p>
                    </div>
                    <div className="ledger-stat-card">
                      <strong>Net Platform Commission</strong>
                      <p className="ledger-num">Rs. {Math.round(totalSales * 0.15).toLocaleString()}</p>
                    </div>
                    <div className="ledger-stat-card">
                      <strong>Pending Withdrawals</strong>
                      <p className="ledger-num" style={{ color: 'var(--warning-color)' }}>
                        Rs. {withdrawals.filter(w => w.status === 'Pending').reduce((s, w) => s + w.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="premium-table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Recipient Partner</th>
                          <th>Withdrawal Amount</th>
                          <th>Settlement Channel</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map(txn => (
                          <tr key={txn.id}>
                            <td style={{ fontWeight: '700' }}>{txn.id}</td>
                            <td style={{ fontWeight: '600' }}>{txn.party}</td>
                            <td style={{ fontWeight: '600', color: 'var(--accent-color)' }}>Rs. {txn.amount.toLocaleString()}</td>
                            <td>{txn.method}</td>
                            <td>
                              <span className={`status-pill ${txn.status.toLowerCase()}`}>
                                {txn.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {txn.status === 'Pending' ? (
                                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleProcessPayout(txn.id)}>
                                  Process & Payout
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--success-color)' }}>Paid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 9: PROMOTIONS & MARKETING CONTROL
                 ==================================================================== */}
              {activeMenuTab === 'promotions' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Promotions & Campaign Builder</h1>
                      <p>Generate promo coupon codes, referral codes, and campaign alerts.</p>
                    </div>
                  </div>

                  <div className="activity-grid">
                    <div className="chart-card">
                      <h3>Generate Promo Coupon</h3>
                      <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                        <div className="form-group">
                          <label>Coupon Code Name</label>
                          <input type="text" className="form-control-input" placeholder="e.g. NAANWEEKEND" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} />
                        </div>
                        <div className="form-grid-2">
                          <div className="form-group">
                            <label>Discount Value</label>
                            <input type="number" className="form-control-input" value={promoForm.discount} onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label>Type</label>
                            <select className="select-filter-box" value={promoForm.type} onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}>
                              <option value="Percentage">Percentage Discount (%)</option>
                              <option value="Flat">Flat Cashoff (Rs.)</option>
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}><Icon name="plus" size={14} /> Save Promo Code</button>
                      </form>
                    </div>

                    <div className="chart-card">
                      <h3>Active Promo Campaign Index</h3>
                      <div className="premium-table-wrapper" style={{ boxShadow: 'none', border: 'none', margin: 0 }}>
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th>Coupon Code</th>
                              <th>Details</th>
                              <th>Status</th>
                              <th>Toggle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promotions.map(promo => (
                              <tr key={promo.code}>
                                <td style={{ fontWeight: '700' }}>{promo.code}</td>
                                <td>{promo.type === 'Percentage' ? `${promo.discount}% Off` : `Rs. ${promo.discount} Off`} (Min: {promo.minBasket})</td>
                                <td>
                                  <span className={`status-pill ${promo.status === 'Active' ? 'approved' : 'cancelled'}`}>
                                    {promo.status}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleTogglePromoStatus(promo.code)}>
                                    {promo.status === 'Active' ? 'Expire' : 'Activate'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 10: ANALYTICS DETAIL PANEL
                 ==================================================================== */}
              {activeMenuTab === 'analytics' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Analytics Hub & Visual Reports</h1>
                      <p>Deeper review of customer retention metrics, restaurant rankings, and performance indexes.</p>
                    </div>
                    <button className="btn-primary" onClick={() => handlePrintPDF('Full Report')}>Export System PDF</button>
                  </div>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <h3>Order Demographics Hours (Peak hours)</h3>
                      <div className="chart-container-box">
                        {/* Mock Peak hours chart using styled columns */}
                        <div style={{ display: 'flex', width: '100%', height: '180px', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
                          {[25, 45, 15, 60, 95, 80, 40].map((h, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10%' }}>
                              <div style={{ height: `${h}%`, width: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '6px 6px 0 0' }}></div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{i * 2 + 10}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Top Selling Restaurants Rankings</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                        {[
                          { name: "The Gourmet Pavilion", sales: "142 orders", revenue: "Rs. 92,300" },
                          { name: "Tandoori Flames", sales: "115 orders", revenue: "Rs. 48,300" },
                          { name: "Caffeine & Co.", sales: "92 orders", revenue: "Rs. 34,960" }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <strong>#{idx + 1} {item.name}</strong>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '13px', display: 'block' }}>{item.sales}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.revenue}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 11: CUSTOMER SUPPORT CHAT & TICKETS
                 ==================================================================== */}
              {activeMenuTab === 'support' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Customer Support Desk</h1>
                      <p>Resolve complaint issues, respond to customer inquiries, and assign tickets.</p>
                    </div>
                  </div>

                  <div className="activity-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
                    {/* Tickets List */}
                    <div className="chart-card" style={{ padding: '16px', height: '500px' }}>
                      <strong>Active Tickets ({tickets.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', overflowY: 'auto', flex: 1 }}>
                        {tickets.map(t => (
                          <div
                            key={t.id}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              backgroundColor: activeTicket?.id === t.id ? 'var(--accent-light)' : 'var(--bg-primary)',
                              border: activeTicket?.id === t.id ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setActiveTicket(t);
                              setSupportReplyText('');
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '13px' }}>{t.id}</strong>
                              <span className={`status-pill ${t.status === 'Open' ? 'cancelled' : 'approved'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>{t.status}</span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '600', display: 'block', margin: '4px 0' }}>{t.subject}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.customerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Logs Window */}
                    <div className="chart-card" style={{ height: '500px' }}>
                      {activeTicket ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div>
                              <h4>Subject: {activeTicket.subject}</h4>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From: {activeTicket.customerName} ({activeTicket.customerEmail})</span>
                            </div>
                            <div>
                              <select
                                className="select-filter-box"
                                value={activeTicket.assignedTo || ""}
                                onChange={(e) => handleAssignTicket(activeTicket.id, e.target.value)}
                              >
                                <option value="">Assign Specialist...</option>
                                <option value="Specialist Ali">Specialist Ali</option>
                                <option value="Manager Fatima">Manager Fatima</option>
                              </select>
                            </div>
                          </div>

                          <div className="support-chat-container">
                            <div className="chat-messages-area">
                              {activeTicket.chat.map((msg, i) => (
                                <div key={i} className={`chat-bubble ${msg.sender}`}>
                                  <span className="chat-sender-lbl">{msg.sender.toUpperCase()} • {msg.time}</span>
                                  {msg.text}
                                </div>
                              ))}
                            </div>
                            <div className="chat-input-row">
                              <input
                                type="text"
                                className="chat-input-box"
                                placeholder="Type support reply or refund instructions..."
                                value={supportReplyText}
                                onChange={(e) => setSupportReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendSupportReply(activeTicket.id)}
                              />
                              <button className="btn-primary" onClick={() => handleSendSupportReply(activeTicket.id)}>
                                Send Reply <Icon name="plane" size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          👈 Select a support ticket complaint to open chat logs & assign specialist.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 12: RICH BROADCAST NOTIFICATIONS
                 ==================================================================== */}
              {activeMenuTab === 'notifications' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Platform Notification Broadcaster</h1>
                      <p>Send marketing push campaigns or alerts to riders, customers, or restaurants.</p>
                    </div>
                  </div>

                  <div className="activity-grid">
                    <div className="chart-card">
                      <h3>Compose Rich Notification</h3>
                      <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                        <div className="form-group">
                          <label>Alert Target Audience</label>
                          <select className="select-filter-box" value={notifForm.target} onChange={(e) => setNotifForm({ ...notifForm, target: e.target.value })}>
                            <option value="All">All Registered App Profiles</option>
                            <option value="Customers">Customers Only</option>
                            <option value="Riders">Riders Only</option>
                            <option value="Restaurants">Restaurant Managers Only</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Notification Title</label>
                          <input type="text" className="form-control-input" placeholder="e.g. Free Delivery Friday!" value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Notification Body Message</label>
                          <textarea rows="4" className="form-control-input" placeholder="Enter rich notification details..." value={notifForm.body} onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Image Attachment URL (Optional)</label>
                          <input type="text" className="form-control-input" placeholder="https://images.unsplash.com/..." value={notifForm.image} onChange={(e) => setNotifForm({ ...notifForm, image: e.target.value })} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}><Icon name="plane" size={14} /> Send Broadcast</button>
                      </form>
                    </div>

                    <div className="chart-card" style={{ height: '500px', overflowY: 'auto' }}>
                      <h3>Broadcast Campaign History</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                        {sentNotifications.map(n => (
                          <div key={n.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '13px' }}>{n.title}</strong>
                              <span className="status-pill waiting-for-rider" style={{ fontSize: '9px', padding: '2px 6px' }}>Audience: {n.target}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0' }}>{n.body}</p>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sent: {new Date(n.sentAt).toLocaleString()}</span>
                          </div>
                        ))}
                        {sentNotifications.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No broadcasts sent yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================================
                 VIEW 13: SETTINGS
                 ==================================================================== */}
              {activeMenuTab === 'settings' && (
                <div>
                  <div className="page-header">
                    <div className="page-title-desc">
                      <h1>Global Control Settings</h1>
                      <p>Adjust system commissions, delivery limits, taxes, API mappings, and maintenance toggles.</p>
                    </div>
                  </div>

                  <div className="activity-grid">
                    <div className="chart-card">
                      <h3>Configure Financials</h3>
                      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                        <div className="form-group">
                          <label>Base Platform Commission (%)</label>
                          <input type="number" className="form-control-input" value={platformSettings.commission} onChange={(e) => setPlatformSettings({ ...platformSettings, commission: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Base Delivery Charges (Rs.)</label>
                          <input type="number" className="form-control-input" value={platformSettings.deliveryCharges} onChange={(e) => setPlatformSettings({ ...platformSettings, deliveryCharges: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Sales Taxes (%)</label>
                          <input type="number" className="form-control-input" value={platformSettings.taxes} onChange={(e) => setPlatformSettings({ ...platformSettings, taxes: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Google Maps API Key Mapping</label>
                          <input type="text" className="form-control-input" value={platformSettings.mapsApiKey} onChange={(e) => setPlatformSettings({ ...platformSettings, mapsApiKey: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            id="maint-mode"
                            checked={platformSettings.maintenanceMode}
                            onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })}
                          />
                          <label htmlFor="maint-mode" style={{ margin: 0 }}>Enable Platform Maintenance Mode</label>
                        </div>
                        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Save Configuration</button>
                      </form>
                    </div>

                    <div className="chart-card">
                      <h3>Database Backup & Recovery</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Backup all MERN local storage tables immediately as a single JSON file. You can restore this file state at any time.
                      </p>
                      <button className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '14px' }} onClick={handleExportDB}>
                        Export DB Backup
                      </button>

                      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h4>Restore System State</h4>
                        <textarea
                          rows="4"
                          className="form-control-input"
                          placeholder="Paste database JSON configuration string here..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleRestoreDB(e.target.value);
                            }
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Paste backup text, then press Ctrl+Enter to restore.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ====================================================================
         TOAST SYSTEM
         ==================================================================== */}
      <div className="toast-container-overlay">
        {toasts.map(t => (
          <div key={t.id} className={`toast-message-card ${t.type}`}>
            <span>{t.type === 'success' ? '✔' : '⚠'}</span>
            <strong>{t.text}</strong>
          </div>
        ))}
      </div>

      {/* ====================================================================
         ORDER DETAILS MODAL OVERLAY
         ==================================================================== */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section">
              <h3>Order details: {selectedOrder.id}</h3>
              <button className="modal-close-icon" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>

            <div className="modal-body-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <strong>Customer</strong>
                  <p>{selectedOrder.name || "Muhammad Saad"}</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedOrder.phone}</span>
                </div>
                <div>
                  <strong>Restaurant</strong>
                  <p>{selectedOrder.restaurantName}</p>
                </div>
                <div>
                  <strong>Assigned Rider</strong>
                  <p>Hamza Ahmed ( online )</p>
                </div>
              </div>

              {/* Delivery timeline progression */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Delivery Status Timeline</h4>
                <div className="details-timeline" style={{ marginTop: '12px' }}>
                  <div className="timeline-step">
                    <div className="timeline-dot completed"></div>
                    <div className="timeline-step-content">
                      <strong className="timeline-step-title">Order Received / Checked Out</strong>
                      <p className="timeline-step-time">{new Date(selectedOrder.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-dot completed"></div>
                    <div className="timeline-step-content">
                      <strong className="timeline-step-title">Assigned to Kitchen Cook</strong>
                      <p className="timeline-step-time">Preparing active menu items</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className={`timeline-dot ${['Completed', 'Delivered'].includes(selectedOrder.status) ? 'completed' : 'pending'}`}></div>
                    <div className="timeline-step-content">
                      <strong className="timeline-step-title">Out for Delivery (Rider en Route)</strong>
                      <p className="timeline-step-time">Rider coordinates active on F-10 grid</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Ordered Food Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={safeGetImg(item)} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div>
                          <strong>{item.name}</strong>
                          <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: '600' }}>Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoicing split */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '280px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal:</span>
                    <span>Rs. {selectedOrder.subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Delivery speed cost:</span>
                    <span>Rs. {selectedOrder.deliveryFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--success-color)' }}>
                    <span>Discounts code:</span>
                    <span>-Rs. {selectedOrder.discount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid var(--border-color)', paddingTop: '8px', fontWeight: 'bold', fontSize: '15px' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--accent-color)' }}>Rs. {selectedOrder.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Admin Notes / Operational Logs</label>
                <textarea
                  className="form-control-input"
                  rows="3"
                  style={{ width: '100%', fontSize: '13px' }}
                  defaultValue={selectedOrder.adminNotes || ""}
                  onBlur={(e) => handleSaveAdminNotes(selectedOrder.id, e.target.value)}
                  placeholder="e.g. Refund issued for missing garlic butter naan. Notified kitchen."
                />
              </div>
            </div>

            <div className="modal-footer-section">
              {['Completed', 'Delivered'].includes(selectedOrder.status) ? (
                <button className="btn-primary" onClick={() => handleRefundOrder(selectedOrder.id)}>Refund Transaction</button>
              ) : selectedOrder.status !== 'Cancelled' ? (
                <button className="btn-secondary" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => handleCancelOrder(selectedOrder.id)}>Cancel Delivery</button>
              ) : null}
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         RESTAURANT DETAILS MODAL OVERLAY
         ==================================================================== */}
      {selectedRestaurant && (
        <div className="modal-overlay" onClick={() => setSelectedRestaurant(null)}>
          <div className="modal-content-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section">
              <h3>Restaurant Profile: {selectedRestaurant.restaurantName}</h3>
              <button className="modal-close-icon" onClick={() => setSelectedRestaurant(null)}>&times;</button>
            </div>

            <div className="modal-body-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div>
                  <strong>Owner Name</strong>
                  <p>{selectedRestaurant.name}</p>
                </div>
                <div>
                  <strong>Contact details</strong>
                  <p>{selectedRestaurant.phone}</p>
                  <p>{selectedRestaurant.email}</p>
                </div>
                <div>
                  <strong>City Sector</strong>
                  <p>{selectedRestaurant.city || "Islamabad"}</p>
                </div>
              </div>

              {/* Commission Adjuster */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Adjust Platform Commission (%)</h4>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="number"
                    className="form-control-input"
                    style={{ width: '120px' }}
                    defaultValue={selectedRestaurant.commissionRate || platformSettings.commission}
                    onBlur={(e) => {
                      const updatedUsers = users.map(u => {
                        if (u.email === selectedRestaurant.email) {
                          return { ...u, commissionRate: Number(e.target.value) };
                        }
                        return u;
                      });
                      setUsers(updatedUsers);
                      localStorage.setItem('naannow_registeredUsers', JSON.stringify(updatedUsers));
                      triggerToast(`Commission set to ${e.target.value}% for ${selectedRestaurant.restaurantName}`);
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>% commission is deducted per transaction split.</span>
                </div>
              </div>

              {/* Verification CNIC License files */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Uploaded Verification Files</h4>
                <div className="document-previews-grid">
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRestaurant.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRestaurant.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="CNIC Front" />
                    <span className="document-label">Owner CNIC Front</span>
                  </div>
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRestaurant.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRestaurant.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="CNIC Back" />
                    <span className="document-label">Owner CNIC Back</span>
                  </div>
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRestaurant.licenseDoc || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRestaurant.licenseDoc || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="Food license" />
                    <span className="document-label">Eatery License Document</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              {selectedRestaurant.status === 'pending' && (
                <>
                  <button className="btn-primary" onClick={() => handleApproveUser(selectedRestaurant.email, 'manager')}>Approve Eatery Partner</button>
                  <button className="btn-secondary" style={{ color: 'var(--error-color)' }} onClick={() => handleOpenReject(selectedRestaurant.email, selectedRestaurant.restaurantName, 'manager')}>Reject Application</button>
                </>
              )}
              {selectedRestaurant.status === 'approved' && (
                <button className="btn-secondary" style={{ color: 'var(--error-color)' }} onClick={() => handleSuspendUser(selectedRestaurant.email, 'manager')}>Suspend Account</button>
              )}
              {selectedRestaurant.status === 'blocked' && (
                <button className="btn-primary" onClick={() => handleUnblockUser(selectedRestaurant.email, 'manager')}>Activate Account</button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedRestaurant(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         RIDER DETAILS MODAL OVERLAY
         ==================================================================== */}
      {selectedRider && (
        <div className="modal-overlay" onClick={() => setSelectedRider(null)}>
          <div className="modal-content-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section">
              <h3>Rider Profile: {selectedRider.name}</h3>
              <button className="modal-close-icon" onClick={() => setSelectedRider(null)}>&times;</button>
            </div>

            <div className="modal-body-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <strong>Bike Plate / Model</strong>
                  <p>{selectedRider.vehicleDetails || "Honda CD70"}</p>
                  <code style={{ fontSize: '12px' }}>{selectedRider.licensePlate}</code>
                </div>
                <div>
                  <strong>Contact details</strong>
                  <p>{selectedRider.phone}</p>
                  <p>{selectedRider.email}</p>
                </div>
                <div>
                  <strong>Verification Status</strong>
                  <p><span className={`status-pill ${(selectedRider.status || 'approved').toLowerCase()}`}>{selectedRider.status || 'approved'}</span></p>
                </div>
              </div>

              {/* Rider CNIC Driving License Document Files */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Uploaded Verification Files</h4>
                <div className="document-previews-grid">
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRider.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRider.cnicFront || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="CNIC Front" />
                    <span className="document-label">Rider CNIC Front</span>
                  </div>
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRider.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRider.cnicBack || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="CNIC Back" />
                    <span className="document-label">Rider CNIC Back</span>
                  </div>
                  <div className="document-preview-box" onClick={() => setZoomedDoc(selectedRider.licenseImage || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800")}>
                    <img src={selectedRider.licenseImage || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800"} alt="Driving License" />
                    <span className="document-label">Driving License Image</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              {selectedRider.status === 'pending' && (
                <>
                  <button className="btn-primary" onClick={() => handleApproveUser(selectedRider.email, 'rider')}>Approve Rider Partner</button>
                  <button className="btn-secondary" style={{ color: 'var(--error-color)' }} onClick={() => handleOpenReject(selectedRider.email, selectedRider.name, 'rider')}>Reject Application</button>
                </>
              )}
              {selectedRider.status === 'approved' && (
                <button className="btn-secondary" style={{ color: 'var(--error-color)' }} onClick={() => handleSuspendUser(selectedRider.email, 'rider')}>Suspend Rider</button>
              )}
              {selectedRider.status === 'blocked' && (
                <button className="btn-primary" onClick={() => handleUnblockUser(selectedRider.email, 'rider')}>Reactivate Rider</button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedRider(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         CUSTOMER PROFILE MODAL OVERLAY
         ==================================================================== */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section">
              <h3>Customer Profile Logs: {selectedCustomer.name || "Muhammad Saad"}</h3>
              <button className="modal-close-icon" onClick={() => setSelectedCustomer(null)}>&times;</button>
            </div>

            <div className="modal-body-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <strong>Customer Email</strong>
                  <p>{selectedCustomer.email}</p>
                </div>
                <div>
                  <strong>Status</strong>
                  <p><span className={`status-pill ${(selectedCustomer.status || 'approved').toLowerCase()}`}>{selectedCustomer.status || 'approved'}</span></p>
                </div>
              </div>

              {/* Saved addresses mock logs */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Loyalty Ledger</h4>
                <p>💎 Customer currently has <strong>{selectedCustomer.loyaltyPoints || 350}</strong> Loyalty Points.</p>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>Fraud Suspect Prevention</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Suspended accounts are locked out of ordering and cart checkout immediately.
                </p>
              </div>
            </div>

            <div className="modal-footer-section">
              {selectedCustomer.status === 'blocked' ? (
                <button className="btn-primary" onClick={() => handleUnblockUser(selectedCustomer.email, 'customer')}>Activate Account</button>
              ) : (
                <button className="btn-secondary" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => handleSuspendUser(selectedCustomer.email, 'customer')}>Suspend / Flag Account</button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         REJECTION REASON SPECIFY PROMPT MODAL
         ==================================================================== */}
      {rejectionModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header-section">
              <h3>Specify Rejection Notes</h3>
              <button className="modal-close-icon" onClick={() => setRejectionModal(null)}>&times;</button>
            </div>
            <div className="modal-body-section">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Specify details for <strong>{rejectionModal.name}</strong>. Rejection notifications are displayed inside partner portals immediately.
              </p>
              <textarea
                rows="4"
                className="form-control-input"
                style={{ width: '100%', fontSize: '13px' }}
                placeholder="e.g. Driving License document upload is blurred. Please upload a clear photo."
                value={rejectionInput}
                onChange={(e) => setRejectionInput(e.target.value)}
              />
            </div>
            <div className="modal-footer-section">
              <button className="btn-secondary" onClick={() => setRejectionModal(null)}>Cancel</button>
              <button className="btn-primary" style={{ backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={handleConfirmRejection}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         ZOOM FILE OVERLAY VIEWER (ZOOM DOCUMENTS WITHOUT LEAVING PANEL)
         ==================================================================== */}
      {zoomedDoc && (
        <div className="zoom-image-overlay" onClick={() => setZoomedDoc(null)}>
          <div className="zoom-image-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setZoomedDoc(null)}>&times;</button>
            <img src={zoomedDoc} alt="Zoomed Verification File" />
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
