document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let orders = JSON.parse(localStorage.getItem('naannow_orders')) || [];

  const mockOrders = [
    {
      id: "NN-492192",
      date: "02 Jun 2026",
      status: "Preparing", // first order in progress
      items: [
        { id: 1, name: "Garlic Naan", price: 150, quantity: 2, image: "/assets/naan-removebg.png" },
        { id: 2, name: "Chicken Karahi", price: 1050, quantity: 1, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=150&auto=format&fit=crop&q=60" }
      ],
      total: 1350,
      paymentMethod: "Credit/Debit Card",
      receiver: "Muhammad Saad",
      phone: "03001234567",
      address: "House 45, Street 11, F-11/1, Islamabad"
    },
    {
      id: "NN-381948",
      date: "28 May 2026",
      status: "Delivered",
      items: [
        { id: 3, name: "Roghni Naan", price: 120, quantity: 3, image: "/assets/naan-removebg.png" },
        { id: 4, name: "Beef Seekh Kebab", price: 620, quantity: 1, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=60" }
      ],
      total: 980,
      paymentMethod: "Credit/Debit Card",
      receiver: "Muhammad Saad",
      phone: "03001234567",
      address: "House 45, Street 11, F-11/1, Islamabad"
    }
  ];

  // --- INITIAL SEEDING & FAILSAFE SYNC ---
  if (orders.length === 0) {
    orders = mockOrders;
    localStorage.setItem('naannow_orders', JSON.stringify(orders));
  } else {
    // Failsafe: Ensure mock order NN-492192 is always in-progress (Preparing) for tracking tests.
    const targetOrder = orders.find(o => o.id === "NN-492192");
    if (targetOrder && targetOrder.status !== "Preparing") {
      targetOrder.status = "Preparing";
      localStorage.setItem('naannow_orders', JSON.stringify(orders));
    }
  }

  // --- DOM ELEMENTS ---
  const emptyStateEl = document.getElementById('orders-empty-state');
  const listContainerEl = document.getElementById('orders-history-list');

  // --- INITIALIZATION ---
  renderOrders();

  // --- RENDERING LOGIC ---
  function renderOrders() {
    if (orders.length === 0) {
      emptyStateEl.style.display = 'block';
      listContainerEl.style.display = 'none';
      return;
    }

    emptyStateEl.style.display = 'none';
    listContainerEl.style.display = 'flex';
    listContainerEl.innerHTML = '';

    // Render from newest to oldest order by date
    const sortedOrders = [...orders].sort((a, b) => {
      const dateB = new Date(b.date);
      const dateA = new Date(a.date);
      if (isNaN(dateB) || isNaN(dateA)) {
        // Fallback to sorting by array position (newest placed order pushed to the end)
        return orders.indexOf(b) - orders.indexOf(a);
      }
      return dateB - dateA;
    });
    sortedOrders.forEach((order, index) => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';

      // Status class mapper
      const statusClass = order.status.toLowerCase();

      // Card Column 1: Order Metadata Info
      const headerHTML = `
        <div class="order-col-meta">
          <div class="meta-row">
            <span class="meta-lbl">Order Reference</span>
            <span class="meta-val order-ref">${order.id}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Placed on</span>
            <span class="meta-val">${order.date}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Total Paid</span>
            <span class="meta-val highlight">Rs ${order.total}</span>
          </div>
          <div class="meta-row status-badge-row">
            <span class="order-status-badge ${statusClass}">${order.status}</span>
          </div>
        </div>
      `;

      // Card Column 2: Items Details List (Horizontal layout inside card)
      let itemsHTML = '<div class="order-col-items">';
      order.items.forEach(item => {
        itemsHTML += `
          <div class="order-item-inline">
            <img src="${item.image}" alt="${item.name}" class="order-item-img" />
            <div class="order-item-info">
              <h4 class="order-item-name">${item.name}</h4>
              <p class="order-item-qty">Qty: ${item.quantity} | Rs ${item.price}</p>
            </div>
          </div>
        `;
      });
      itemsHTML += '</div>';

      // Track button configuration: redirects active orders to tracking page
      const isCompletedOrCancelled = order.status === "Delivered" || order.status === "Cancelled";
      const trackButtonHTML = !isCompletedOrCancelled
        ? `<button class="btn-track-active" onclick="window.location.href='/track-order/${order.id}'">Track Order 🛵</button>`
        : `<button class="btn-track" onclick="alert('Payment Mode: ${order.paymentMethod}\\nDelivery Address: ${order.address}')">View Info</button>`;

      // Card Column 3: Actions Layout
      const footerHTML = `
        <div class="order-col-actions">
          ${trackButtonHTML}
          <button class="btn-reorder" id="reorder-btn-${order.id}">Buy It Again</button>
        </div>
      `;

      orderCard.innerHTML = headerHTML + itemsHTML + footerHTML;
      listContainerEl.appendChild(orderCard);

      // Add click listener to Reorder button
      const reorderBtn = orderCard.querySelector(`#reorder-btn-${order.id}`);
      if (reorderBtn) {
        reorderBtn.addEventListener('click', () => {
          reorderItems(order.items);
        });
      }
    });
  }

  // --- REORDER ITEMS LOGIC ---
  function reorderItems(items) {
    let cart = JSON.parse(localStorage.getItem('naannow_cart')) || [];

    items.forEach(item => {
      const existing = cart.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.push({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity
        });
      }
    });

    localStorage.setItem('naannow_cart', JSON.stringify(cart));

    // Update navbar badge and sidebar items instantly
    updateNavbarCart(cart);

    // Open the Cart Sidebar drawer
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    if (sidebar && overlay) {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
  }

  // Helper to sync cart changes directly to the EJS template elements
  function updateNavbarCart(cart) {
    const navBadge = document.querySelector('.cart-badge');
    const sidebarCount = document.querySelector('.cart-count');
    const sidebarItems = document.querySelector('.cart-items');
    const subtotalEl = document.querySelector('.price-row:nth-child(1) span:last-child');
    const deliveryEl = document.querySelector('.price-row:nth-child(2) span:last-child');
    const totalEl = document.querySelector('.price-row.total span:last-child');

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (navBadge) navBadge.textContent = totalQty;
    if (sidebarCount) sidebarCount.textContent = `${totalQty} Items`;

    if (!sidebarItems) return;

    if (cart.length === 0) {
      sidebarItems.innerHTML = '<div class="empty-cart">Your Tokri is empty</div>';
      if (subtotalEl) subtotalEl.textContent = 'Rs 0';
      if (deliveryEl) deliveryEl.textContent = 'Rs 0';
      if (totalEl) totalEl.textContent = 'Rs 0';
      return;
    }

    sidebarItems.innerHTML = '';
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>Rs ${item.price}</p>
          <div class="qty-controls">
            <button class="qty-minus" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
      `;

      // Quantity adjustments in the sidebar list itself
      itemEl.querySelector('.qty-minus').addEventListener('click', () => {
        adjustQty(item.id, -1);
      });
      itemEl.querySelector('.qty-plus').addEventListener('click', () => {
        adjustQty(item.id, 1);
      });

      sidebarItems.appendChild(itemEl);
    });

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = 150;
    const total = subtotal + deliveryFee;

    if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal}`;
    if (deliveryEl) deliveryEl.textContent = `Rs ${deliveryFee}`;
    if (totalEl) totalEl.textContent = `Rs ${total}`;
  }

  function adjustQty(id, change) {
    let cart = JSON.parse(localStorage.getItem('naannow_cart')) || [];
    const item = cart.find(i => i.id === id);

    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
      }
      localStorage.setItem('naannow_cart', JSON.stringify(cart));
      updateNavbarCart(cart);
    }
  }
});
