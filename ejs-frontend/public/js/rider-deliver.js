document.addEventListener('DOMContentLoaded', () => {
  // --- 1. STATE & ROUTING DETAILS ---
  const orderId = window.RIDER_ORDER_ID;
  let orders = JSON.parse(localStorage.getItem('naannow_orders')) || [];
  let currentOrder = orders.find(o => o.id === orderId);

  // Check if order exists
  if (!currentOrder) {
    alert("Order not found!");
    window.location.href = '/rider';
    return;
  }

  // Socket & Map details
  let socket = null;
  let map = null;
  let riderMarker = null;
  let routePolyline = null;
  let simInterval = null;
  let activeStepIndex = 0;
  let isRiding = false;

  // Route Points (F-8 Markaz to F-11 Markaz)
  const restaurantCoords = [33.7125, 73.0425];
  const customerCoords = [33.6844, 72.9889];
  const routePoints = [
    [33.7125, 73.0425], // F-8 Markaz Kitchen
    [33.7052, 73.0270], // Ibn-e-Sina Road Intersect
    [33.6998, 73.0135], // F-10 Markaz Outer Ring
    [33.6922, 72.9995], // Double Road Sector Edge
    [33.6844, 72.9889]  // F-11 House Address
  ];

  // --- 2. DOM ELEMENTS ---
  const statusBtn = document.getElementById('action-stepper-btn');
  const simulateBtn = document.getElementById('simulate-ride-btn');
  const connectionStatus = document.getElementById('rider-connection-status');
  
  // Details fields
  const custName = document.getElementById('cust-name');
  const custPhone = document.getElementById('cust-phone');
  const custAddress = document.getElementById('cust-address');
  const custInstructionsRow = document.getElementById('cust-instructions-row');
  const custInstructions = document.getElementById('cust-instructions');
  const orderPayment = document.getElementById('order-payment');
  const itemsList = document.getElementById('rider-items-list');
  const orderTotal = document.getElementById('rider-order-total');

  // Steps timestamps
  const tsPlaced = document.getElementById('ts-placed');
  const tsPreparing = document.getElementById('ts-preparing');
  const tsOnTheWay = document.getElementById('ts-ontheway');
  const tsDelivered = document.getElementById('ts-delivered');

  // Chat panel
  const chatMsgLog = document.getElementById('rider-chat-msg-log');
  const chatForm = document.getElementById('rider-chat-form');
  const chatInput = document.getElementById('rider-chat-input');

  // --- 3. INITIALIZATION ---
  initPage();
  initMap();
  initSocket();

  // --- 4. POPULATE UI DETAILS ---
  function initPage() {
    custName.textContent = currentOrder.receiver || 'Saad';
    custPhone.textContent = currentOrder.phone || '+92 300 1234567';
    custAddress.textContent = currentOrder.address || 'F-11, Islamabad';
    
    if (currentOrder.instructions) {
      custInstructionsRow.style.display = 'flex';
      custInstructions.textContent = currentOrder.instructions;
    }
    
    orderPayment.textContent = currentOrder.paymentMethod || 'Cash on Delivery';
    orderTotal.textContent = `Rs ${currentOrder.total}`;

    // Render items list
    itemsList.innerHTML = '';
    if (Array.isArray(currentOrder.items)) {
      currentOrder.items.forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '0.9rem';
        row.style.opacity = '0.8';
        row.innerHTML = `
          <span>${item.quantity}x ${item.name}</span>
          <span>Rs ${item.price * item.quantity}</span>
        `;
        itemsList.appendChild(row);
      });
    } else {
      itemsList.innerHTML = `<span style="font-size:0.9rem; opacity:0.8;">${currentOrder.items}</span>`;
    }

    // Set timestamps and active states based on current order status
    updateStatusStepperUI();
  }

  // --- 5. INITIALIZE MAPS ---
  function initMap() {
    const centerLat = (restaurantCoords[0] + customerCoords[0]) / 2;
    const centerLng = (restaurantCoords[1] + customerCoords[1]) / 2;

    map = L.map('rider-map', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([centerLat, centerLng], 13);

    // Cohesive light Voyager map tile matching main theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const restaurantIcon = L.divIcon({
      className: 'custom-restaurant-icon-pin',
      html: `<div style="background-color: #4F2E1D; border: 2px solid white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🍳</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const customerIcon = L.divIcon({
      className: 'custom-customer-icon-pin',
      html: `<div style="background-color: #5CA136; border: 2px solid white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🏠</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const riderIcon = L.divIcon({
      className: 'custom-rider-icon-pin',
      html: `<div style="background-color: #E57919; border: 2.5px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(229, 121, 25, 0.4);">🛵</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map).bindPopup("<b>Restaurant Pickup</b>");
    L.marker(customerCoords, { icon: customerIcon }).addTo(map).bindPopup("<b>Saad's House</b>");

    routePolyline = L.polyline(routePoints, {
      color: '#E57919',
      weight: 4,
      opacity: 0.8,
      dashArray: '6, 6'
    }).addTo(map);

    // Initial rider position
    riderMarker = L.marker(restaurantCoords, { icon: riderIcon }).addTo(map).bindPopup("<b>You (Rider)</b>");
  }

  // --- 6. SOCKETS SETUP ---
  function initSocket() {
    socket = io();

    socket.on('connect', () => {
      connectionStatus.textContent = "Duty: Active 🟢";
      connectionStatus.style.backgroundColor = "rgba(92, 161, 54, 0.15)";
      connectionStatus.style.border = "1px solid #5CA136";
      connectionStatus.style.color = "#5CA136";

      // Join delivery channel
      socket.emit('join_room', orderId);
    });

    socket.on('disconnect', () => {
      connectionStatus.textContent = "Duty: Disconnected 🔴";
      connectionStatus.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
      connectionStatus.style.border = "1px solid #EF4444";
      connectionStatus.style.color = "#EF4444";
    });

    // Chat messages receiver
    socket.on('receive_message', (data) => {
      if (data.orderId === orderId && data.senderId === 'customer') {
        appendMessage(data.senderName, data.text, 'incoming');
      }
    });
  }

  // --- 7. CHAT LOGIC ---
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage("You", text, 'outgoing');
    chatInput.value = '';

    if (socket) {
      socket.emit('send_message', {
        orderId: orderId,
        senderId: 'rider',
        senderName: 'Kamran Shah (Rider)',
        text: text
      });
    }
  });

  function appendMessage(sender, text, direction) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble rider-${direction}`;
    
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    bubble.innerHTML = `
      <p class="msg-text">${text}</p>
      <span class="msg-time">${timeStr}</span>
    `;

    chatMsgLog.appendChild(bubble);
    chatMsgLog.scrollTop = chatMsgLog.scrollHeight;
  }

  // --- 8. STEPPER STATE ACTIONS ---
  statusBtn.addEventListener('click', () => {
    const status = currentOrder.status;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (status === 'Order Placed') {
      transitionOrder('Preparing', 'preparing', timeStr);
      appendMessage("System", "Kitchen preheating Clay Tandoor. Baking started!", 'outgoing');
    } 
    else if (status === 'Preparing') {
      transitionOrder('On The Way', 'ontheway', timeStr);
      appendMessage("You", "Hot Naans are packed in the thermal box! I'm leaving the restaurant now and heading towards your location. 🛵🔥", 'outgoing');
    }
    else if (status === 'On The Way' && !isRiding && activeStepIndex >= routePoints.length - 1) {
      transitionOrder('Delivered', 'delivered', timeStr);
      appendMessage("You", "Delicious food delivered. Thank you for choosing NaanNow! 😊🍽️", 'outgoing');
    }
  });

  function transitionOrder(newStatusName, stageId, timeStr) {
    // Save state
    currentOrder.status = newStatusName;
    orders = orders.map(o => o.id === orderId ? currentOrder : o);
    localStorage.setItem('naannow_orders', JSON.stringify(orders));

    // Emit Socket transition event
    if (socket) {
      socket.emit('update_status', {
        orderId: orderId,
        stageId: stageId,
        timeStr: timeStr,
        countdown: getEstimatedCountdown(stageId)
      });
    }

    // Refresh UI
    updateStatusStepperUI();
  }

  function getEstimatedCountdown(stageId) {
    if (stageId === 'preparing') return 25;
    if (stageId === 'ontheway') return 20;
    return 0;
  }

  function updateStatusStepperUI() {
    const status = currentOrder.status;
    const defaultTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Reset steps classes
    document.querySelectorAll('.rider-status-step').forEach(el => el.className = 'rider-status-step');

    // Placed is always complete
    document.getElementById('step-placed').classList.add('completed');
    tsPlaced.textContent = defaultTime;

    if (status === 'Order Placed') {
      document.getElementById('step-preparing').classList.add('active');
      statusBtn.textContent = "Accept & Start Preparing 👨‍🍳";
      statusBtn.disabled = false;
      simulateBtn.disabled = true;
    }
    else if (status === 'Preparing') {
      document.getElementById('step-preparing').classList.add('completed');
      tsPreparing.textContent = defaultTime;
      document.getElementById('step-ontheway').classList.add('active');
      
      statusBtn.textContent = "Mark Packed & Start Ride 🛵";
      statusBtn.disabled = false;
      simulateBtn.disabled = true;
    }
    else if (status === 'On The Way') {
      document.getElementById('step-preparing').classList.add('completed');
      document.getElementById('step-ontheway').classList.add('completed');
      tsPreparing.textContent = defaultTime;
      tsOnTheWay.textContent = defaultTime;

      if (activeStepIndex < routePoints.length - 1) {
        document.getElementById('step-delivered').classList.add('active');
        statusBtn.textContent = "Riding... (Reach Destination First)";
        statusBtn.disabled = true;
        simulateBtn.disabled = false;
      } else {
        // Reached destination!
        document.getElementById('step-delivered').classList.add('active');
        statusBtn.textContent = "Mark as Delivered ✅";
        statusBtn.className = "status-action-btn";
        statusBtn.disabled = false;
        simulateBtn.disabled = true;
        simulateBtn.textContent = "Arrived at Customer";
      }
    }
    else if (status === 'Delivered') {
      document.getElementById('step-preparing').classList.add('completed');
      document.getElementById('step-ontheway').classList.add('completed');
      document.getElementById('step-delivered').classList.add('completed');
      
      tsPreparing.textContent = defaultTime;
      tsOnTheWay.textContent = defaultTime;
      tsDelivered.textContent = defaultTime;

      statusBtn.textContent = "Delivery Complete 🎉";
      statusBtn.disabled = true;
      simulateBtn.disabled = true;
      simulateBtn.textContent = "Finished";
    }
  }

  // --- 9. MAP RIDING SIMULATOR ---
  simulateBtn.addEventListener('click', () => {
    if (isRiding || currentOrder.status !== 'On The Way') return;

    isRiding = true;
    simulateBtn.disabled = true;
    simulateBtn.innerHTML = `<span>🛵</span> <span class="sim-running-dots">Riding</span>`;
    
    activeStepIndex = 0;

    simInterval = setInterval(() => {
      activeStepIndex++;
      if (activeStepIndex < routePoints.length) {
        const nextCoords = routePoints[activeStepIndex];

        // Move local marker & map view
        riderMarker.setLatLng(nextCoords);
        map.panTo(nextCoords);

        // Emit live location over sockets to Customer UI
        if (socket) {
          socket.emit('update_location', {
            orderId: orderId,
            coordinates: nextCoords
          });
        }

        // Halfway message helper
        if (activeStepIndex === 2) {
          appendMessage("You", "Just crossed the F-10 Markaz signal. The roads are clear, I will reach your gate in a few minutes!", 'outgoing');
        }
      } else {
        // Reached the end!
        clearInterval(simInterval);
        isRiding = false;
        
        appendMessage("You", "I have arrived at your building address! I am standing outside your gate. Please collect your delicious food. 😊🍽️", 'outgoing');
        
        // Broadcast Arrival
        if (socket) {
          socket.emit('update_status', {
            orderId: orderId,
            stageId: 'ontheway',
            timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            countdown: 0
          });
        }

        // Trigger stepper update
        updateStatusStepperUI();
      }
    }, 3000);
  });
});
