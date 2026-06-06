document.addEventListener('DOMContentLoaded', () => {
  // --- 1. STATE & ROUTING DETAILS ---
  const orderId = window.location.pathname.split('/').pop();
  let orders = JSON.parse(localStorage.getItem('naannow_orders')) || [];
  let currentOrder = orders.find(o => o.id === orderId);

  // Check if order exists
  if (!currentOrder) {
    document.getElementById('skeleton-loader').style.display = 'none';
    document.getElementById('actual-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    return;
  }

  // Socket setup
  let socket = null;
  let map = null;
  let riderMarker = null;
  let routePolyline = null;
  let simulationInterval = null;
  let simulationTimers = [];
  let isLiveRider = false;
  let countdownVal = 25;
  let unreadCount = 0;
  let isChatScrolledToBottom = true;

  // --- 2. RETRIEVE RENDERING DOM ELEMENTS ---
  const trackContainer = document.getElementById('track-container');
  const skeletonLoader = document.getElementById('skeleton-loader');
  const actualContent = document.getElementById('actual-content');

  // Metadata Fields
  const infoOrderId = document.getElementById('info-order-id');
  const infoOrderDate = document.getElementById('info-order-date');
  const infoOrderPayment = document.getElementById('info-order-payment');
  const infoOrderTotal = document.getElementById('info-order-total');

  // Address Card
  const infoCustName = document.getElementById('info-cust-name');
  const infoCustPhone = document.getElementById('info-cust-phone');
  const infoCustAddress = document.getElementById('info-cust-address');
  const infoInstructionsRow = document.getElementById('info-instructions-row');
  const infoCustInstructions = document.getElementById('info-cust-instructions');
  const infoCountdown = document.getElementById('info-countdown');

  // Timeline Steps
  const stepPlaced = document.getElementById('stage-placed');
  const stepPreparing = document.getElementById('stage-preparing');
  const stepAssigned = document.getElementById('stage-assigned');
  const stepOnTheWay = document.getElementById('stage-ontheway');
  const stepDelivered = document.getElementById('stage-delivered');

  const linePlaced = document.getElementById('line-placed');
  const linePreparing = document.getElementById('line-preparing');
  const lineAssigned = document.getElementById('line-assigned');
  const lineOnTheWay = document.getElementById('line-ontheway');

  const timePlaced = document.getElementById('time-placed');
  const timePreparing = document.getElementById('time-preparing');
  const timeAssigned = document.getElementById('time-assigned');
  const timeOnTheWay = document.getElementById('time-ontheway');
  const timeDelivered = document.getElementById('time-delivered');

  // Rider Card
  const infoRiderImg = document.getElementById('info-rider-img');
  const infoRiderName = document.getElementById('info-rider-name');
  const infoRiderVehicle = document.getElementById('info-rider-vehicle');

  // Chat panel
  const chatMsgContainer = document.getElementById('chat-msg-container');
  const chatSendForm = document.getElementById('chat-send-form');
  const chatTextInput = document.getElementById('chat-text-input');
  const chatUnreadIndicator = document.getElementById('chat-unread-indicator');
  const mobileChatFab = document.getElementById('mobile-chat-fab');
  const mobileUnreadBadge = document.getElementById('mobile-unread-badge');

  // --- 3. MOCK DATA DEFINITIONS ---
  const riderMock = {
    name: "Kamran Shah",
    vehicle: "Honda CD-70 (ICT-9801)",
    phone: "+92 300 1234567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  };

  // Coordinates around Islamabad (Restaurant in F-8 Markaz, Customer in F-11 Markaz)
  const restaurantCoords = [33.7125, 73.0425];
  const customerCoords = [33.6844, 72.9889];
  const routePoints = [
    [33.7125, 73.0425], // F-8 Markaz Kitchen
    [33.7052, 73.0270], // Ibn-e-Sina Road Intersect
    [33.6998, 73.0135], // F-10 Markaz Outer Ring
    [33.6922, 72.9995], // Double Road Sector Edge
    [33.6844, 72.9889]  // F-11 House Address
  ];

  // --- 4. SKELETON SIMULATION TIMEOUT ---
  setTimeout(() => {
    // Hide skeleton and reveal actual content
    skeletonLoader.style.display = 'none';
    actualContent.style.display = 'block';
    trackContainer.classList.remove('state-loading');
    if (mobileChatFab) mobileChatFab.removeAttribute('style');

    // Populate data
    populateOrderDetails();
    initMap();
    initSocket();
    startTrackingTimelineSimulation();
    initMobileChatFab();
  }, 2000);

  // --- 5. DATA POPULATION LOGIC ---
  function populateOrderDetails() {
    infoOrderId.textContent = currentOrder.id;
    infoOrderDate.textContent = currentOrder.date;
    infoOrderPayment.textContent = currentOrder.paymentMethod || "Cash on Delivery";
    infoOrderTotal.textContent = `Rs ${currentOrder.total}`;

    infoCustName.textContent = currentOrder.receiver || "Saad";
    infoCustPhone.textContent = currentOrder.phone || "+92 300 1234567";
    infoCustAddress.textContent = currentOrder.address || "House 45, Islamabad";

    if (currentOrder.instructions) {
      infoInstructionsRow.style.display = 'flex';
      infoCustInstructions.textContent = currentOrder.instructions;
    }

    infoRiderImg.src = riderMock.avatar;
    infoRiderName.textContent = riderMock.name;
    infoRiderVehicle.textContent = riderMock.vehicle;

    infoCountdown.textContent = `${countdownVal} mins`;
  }

  // --- 6. LEAFLET MAP INITIALIZATION ---
  function initMap() {
    // Mid point center
    const centerLat = (restaurantCoords[0] + customerCoords[0]) / 2;
    const centerLng = (restaurantCoords[1] + customerCoords[1]) / 2;

    map = L.map('tracking-map', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([centerLat, centerLng], 13);

    // OpenStreetMap premium tile layer (carto db light is beautiful and matches glassmorphism look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Custom Emoji Div Icons
    const restaurantIcon = L.divIcon({
      className: 'custom-restaurant-icon-pin',
      html: `<div style="background-color: #4F2E1D; border: 2.5px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">🍳</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const customerIcon = L.divIcon({
      className: 'custom-customer-icon-pin',
      html: `<div style="background-color: #5CA136; border: 2.5px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">🏠</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const riderIconDiv = L.divIcon({
      className: 'custom-rider-icon-pin',
      html: `<div style="background-color: #E57919; border: 2.5px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">🛵</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // Add Kitchen and Customer markers
    L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map).bindPopup("<b>NaanNow clay tandoor</b>").openPopup();
    L.marker(customerCoords, { icon: customerIcon }).addTo(map).bindPopup("<b>Your House</b>");

    // Polyline routing
    routePolyline = L.polyline(routePoints, {
      color: '#E57919',
      weight: 4.5,
      opacity: 0.8,
      dashArray: '8, 8',
      lineJoin: 'round'
    }).addTo(map);

    // Initial rider marker at restaurant
    riderMarker = L.marker(restaurantCoords, { icon: riderIconDiv }).addTo(map).bindPopup("<b>Kamran Shah (Rider)</b>");
  }

  // --- 7. SOCKET.IO INTEGRATION ---
  function initSocket() {
    socket = io();

    // Join room
    socket.emit('join_room', orderId);

    // Live rider position updates
    socket.on('location_updated', (coordinates) => {
      // coordinates = [lat, lng]
      if (riderMarker && coordinates) {
        isLiveRider = true;
        cancelOfflineSimulation();
        riderMarker.setLatLng(coordinates);
        // smooth pan map to rider
        map.panTo(coordinates);
      }
    });

    // Live order status updates
    socket.on('status_updated', (data) => {
      if (data.orderId === orderId) {
        isLiveRider = true;
        cancelOfflineSimulation();
        updateTimelineStage(data.stageId, data.timeStr);
        if (data.stageId === 'ontheway') {
          infoCountdown.textContent = `${data.countdown} mins`;
        } else if (data.stageId === 'delivered') {
          infoCountdown.textContent = "Arrived!";
          riderMarker.bindPopup("<b>Rider Arrived!</b>").openPopup();
        }
      }
    });

    // Live message listener
    socket.on('receive_message', (data) => {
      if (data.orderId === orderId && data.senderId !== 'customer') {
        appendMessage(data.senderName, data.text, 'incoming');
        
        // Show unread indicator if the user scrolled up
        if (!isChatScrolledToBottom) {
          unreadCount++;
          if (chatUnreadIndicator) {
            chatUnreadIndicator.textContent = unreadCount;
            chatUnreadIndicator.style.display = 'flex';
          }
          if (mobileUnreadBadge) {
            mobileUnreadBadge.textContent = unreadCount;
            mobileUnreadBadge.style.display = 'flex';
          }
        }
      }
    });
  }

  // Chat message scrolling behavior check
  chatMsgContainer.addEventListener('scroll', () => {
    // Check if scrolled to bottom within 20px threshold
    const distanceToBottom = chatMsgContainer.scrollHeight - chatMsgContainer.clientHeight - chatMsgContainer.scrollTop;
    isChatScrolledToBottom = distanceToBottom < 20;

    if (isChatScrolledToBottom) {
      unreadCount = 0;
      if (chatUnreadIndicator) chatUnreadIndicator.style.display = 'none';
      if (mobileUnreadBadge) mobileUnreadBadge.style.display = 'none';
    }
  });

  // --- 8. CHAT INTERACTION LOGIC ---
  chatSendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = chatTextInput.value.trim();
    if (!messageText) return;

    // Output message visually
    appendMessage("You", messageText, 'outgoing');
    chatTextInput.value = '';

    // Emit via socket
    if (socket) {
      socket.emit('send_message', {
        orderId: orderId,
        senderId: 'customer',
        senderName: currentOrder.receiver || 'Saad',
        text: messageText
      });
    }

    // Auto-scroll
    scrollToLatestMessage();

    // Setup interactive automated response if simulator is active
    handleSimulatedChatReplies(messageText);
  });

  function appendMessage(sender, text, type) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}`;

    const date = new Date();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${date.getHours()}:${minutes}`;

    bubble.innerHTML = `
      <p class="msg-text">${text}</p>
      <span class="msg-time">${timeString}</span>
    `;

    chatMsgContainer.appendChild(bubble);
    
    if (type === 'incoming' && isChatScrolledToBottom) {
      scrollToLatestMessage();
    }
  }

  function scrollToLatestMessage() {
    chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
  }

  function cancelOfflineSimulation() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    simulationTimers.forEach(t => clearTimeout(t));
    simulationTimers = [];
  }

  // --- 9. ORDER TIMELINE & LOCATION UPDATES SIMULATION ---
  function startTrackingTimelineSimulation() {
    // If a live rider is already handling the order, don't start the offline simulation
    if (isLiveRider) return;

    // Current timings
    const now = new Date();
    const getFormattedTime = (offsetSecs) => {
      const futureDate = new Date(now.getTime() + offsetSecs * 1000);
      const minutes = futureDate.getMinutes().toString().padStart(2, '0');
      return `${futureDate.getHours()}:${minutes}`;
    };

    // Stage 1: Order Placed (Immediate)
    updateTimelineStage('placed', getFormattedTime(0));

    // Stage 2: Preparing (after 4 seconds)
    const t2 = setTimeout(() => {
      if (isLiveRider) return;
      updateTimelineStage('preparing', getFormattedTime(0));
      appendMessage(riderMock.name, "Salam! I'm your NaanNow rider. I've arrived at the kitchen and they are wrapping up baking your order. I will update you as soon as I pick it up! 👍", 'incoming');
    }, 4500);
    simulationTimers.push(t2);

    // Stage 3: Rider Assigned (after 12 seconds)
    const t3 = setTimeout(() => {
      if (isLiveRider) return;
      updateTimelineStage('assigned', getFormattedTime(0));
    }, 12000);
    simulationTimers.push(t3);

    // Stage 4: On The Way & Move Rider (after 18 seconds)
    const t4 = setTimeout(() => {
      if (isLiveRider) return;
      updateTimelineStage('ontheway', getFormattedTime(0));
      appendMessage(riderMock.name, "Hot Naans are packed in the thermal box! I'm leaving the restaurant now and heading towards your location. 🛵🔥", 'incoming');
      
      let stepIndex = 0;
      countdownVal = 20;
      infoCountdown.textContent = `${countdownVal} mins`;

      // Movement updates every 6 seconds
      simulationInterval = setInterval(() => {
        if (isLiveRider) {
          clearInterval(simulationInterval);
          return;
        }
        stepIndex++;
        if (stepIndex < routePoints.length) {
          const newCoords = routePoints[stepIndex];
          
          // Emit socket location update
          if (socket) {
            socket.emit('update_location', {
              orderId: orderId,
              coordinates: newCoords
            });
          }

          // Directly update UI as well (failsafe + local feedback)
          riderMarker.setLatLng(newCoords);
          map.panTo(newCoords);

          // Decrement delivery countdown
          countdownVal = Math.max(2, countdownVal - 5);
          infoCountdown.textContent = `${countdownVal} mins`;

          // Half-way message
          if (stepIndex === 2) {
            appendMessage(riderMock.name, "Just crossed the F-10 Markaz signal. The roads are clear, I will reach your gate in a few minutes!", 'incoming');
          }
        } else {
          // Rider has arrived! Stage 5: Delivered
          clearInterval(simulationInterval);
          updateTimelineStage('delivered', getFormattedTime(0));
          appendMessage(riderMock.name, "I have arrived at your building address! I am standing outside your gate. Please collect your delicious food. 😊🍽️", 'incoming');
          
          countdownVal = 0;
          infoCountdown.textContent = "Arrived!";
          riderMarker.bindPopup("<b>Rider Arrived!</b>").openPopup();
        }
      }, 7000);

    }, 18000);
    simulationTimers.push(t4);
  }

  function updateTimelineStage(stageId, timeStr) {
    if (stageId === 'placed') {
      stepPlaced.className = 'progress-step-item completed';
      timePlaced.textContent = timeStr;
      linePlaced.className = 'progress-line-bar completed';
      
      stepPreparing.className = 'progress-step-item active current';
    }
    else if (stageId === 'preparing') {
      stepPreparing.className = 'progress-step-item completed';
      timePreparing.textContent = timeStr;
      linePreparing.className = 'progress-line-bar completed';

      stepAssigned.className = 'progress-step-item active current';
    }
    else if (stageId === 'assigned') {
      stepAssigned.className = 'progress-step-item completed';
      timeAssigned.textContent = timeStr;
      lineAssigned.className = 'progress-line-bar completed';

      stepOnTheWay.className = 'progress-step-item active current';
    }
    else if (stageId === 'ontheway') {
      stepOnTheWay.className = 'progress-step-item completed';
      timeOnTheWay.textContent = timeStr;
      lineOnTheWay.className = 'progress-line-bar completed';

      stepDelivered.className = 'progress-step-item active current';
    }
    else if (stageId === 'delivered') {
      stepDelivered.className = 'progress-step-item completed';
      timeDelivered.textContent = timeStr;
    }
    
    // Save state change locally in currentOrder object
    currentOrder.status = getTimelineStatusText(stageId);
    localStorage.setItem('naannow_orders', JSON.stringify(orders));
  }

  function getTimelineStatusText(stageId) {
    switch(stageId) {
      case 'placed': return "Order Placed";
      case 'preparing': return "Preparing";
      case 'assigned': return "Rider Assigned";
      case 'ontheway': return "On The Way";
      case 'delivered': return "Delivered";
      default: return "Cooking";
    }
  }

  // --- 10. SIMULATED CHAT INTERACTION REPLIES ---
  function handleSimulatedChatReplies(text) {
    const normalizedText = text.toLowerCase();

    // 1-second delay for realistic rider typing look
    setTimeout(() => {
      if (normalizedText.includes('hello') || normalizedText.includes('salam') || normalizedText.includes('hi')) {
        appendMessage(riderMock.name, "Walaikum Assalam! How can I help you?", 'incoming');
      } else if (normalizedText.includes('thank') || normalizedText.includes('shukriya') || normalizedText.includes('thanks')) {
        appendMessage(riderMock.name, "You are welcome! Happy to serve you. Please don't forget to rate me 5 stars on the app after delivery! ⭐", 'incoming');
      } else if (normalizedText.includes('kahan') || normalizedText.includes('where') || normalizedText.includes('time')) {
        if (countdownVal > 0) {
          appendMessage(riderMock.name, `I am on my bike, ETA is around ${countdownVal} minutes. You can check my live location on your map!`, 'incoming');
        } else {
          appendMessage(riderMock.name, "I have already reached your delivery address. I'm waiting at the main gate/reception.", 'incoming');
        }
      } else if (normalizedText.includes('change') || normalizedText.includes('cash') || normalizedText.includes('paise')) {
        appendMessage(riderMock.name, "Yes, I am carrying cash change, don't worry about it! See you soon.", 'incoming');
      } else if (normalizedText.includes('hot') || normalizedText.includes('warm') || normalizedText.includes('crispy')) {
        appendMessage(riderMock.name, "Yes, the Naans are fresh from the clay tandoor, packed tightly in our insulated delivery bag to keep them steaming hot!", 'incoming');
      }
    }, 1500);
  }

  // --- 11. MOBILE CHAT FLOATING BUTTON ---
  function initMobileChatFab() {
    if (mobileChatFab) {
      mobileChatFab.addEventListener('click', () => {
        const chatPanel = document.querySelector('.chat-panel-card');
        if (chatPanel) {
          chatPanel.scrollIntoView({ behavior: 'smooth' });
          
          // Clear unread count on click
          unreadCount = 0;
          if (chatUnreadIndicator) chatUnreadIndicator.style.display = 'none';
          if (mobileUnreadBadge) mobileUnreadBadge.style.display = 'none';

          // Focus chat input after scroll finished
          const chatInput = document.getElementById('chat-text-input');
          if (chatInput) {
            setTimeout(() => chatInput.focus(), 350);
          }
        }
      });
    }
  }
});
