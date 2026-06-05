document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let cartItems = JSON.parse(localStorage.getItem('naannow_cart')) || [];
  let deliverySpeed = 'standard'; // standard | priority

  // Order success state
  let orderStep = 1;
  let countdown = 30;
  let countdownInterval = null;
  let tandoorTimer = null;
  let deliveryTimer = null;

  // --- DOM ELEMENTS ---
  // State Containers
  const emptyStateEl = document.getElementById('empty-state');
  const loadingStateEl = document.getElementById('loading-state');
  const successStateEl = document.getElementById('success-state');
  const formStateEl = document.getElementById('checkout-form-state');

  // Form Fields
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const addressInput = document.getElementById('address');
  const instructionsInput = document.getElementById('instructions');

  const paymentMethodSelect = document.getElementById('paymentMethod');
  const cardDetailsContainer = document.getElementById('cardDetails');

  const cardNameInput = document.getElementById('cardName');
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCVVInput = document.getElementById('cardCVV');

  // Error Messages
  const nameError = document.getElementById('error-name');
  const phoneError = document.getElementById('error-phone');
  const addressError = document.getElementById('error-address');
  const paymentMethodError = document.getElementById('paymentMethodError');
  const cardNameError = document.getElementById('cardNameError');
  const cardNumberError = document.getElementById('cardNumberError');
  const cardExpiryError = document.getElementById('cardExpiryError');
  const cardCVVError = document.getElementById('cardCVVError');

  // Speed selector labels
  const speedStandardLabel = document.getElementById('speed-standard-label');
  const speedPriorityLabel = document.getElementById('speed-priority-label');

  // Summary list and calculations
  const itemsListEl = document.getElementById('checkout-items-list');
  const subtotalEl = document.getElementById('subtotal-amount');
  const deliveryEl = document.getElementById('delivery-amount');
  const platformEl = document.getElementById('platform-amount');
  const grandTotalEl = document.getElementById('grand-total-amount');

  // Form Submit
  const checkoutForm = document.getElementById('checkout-form');

  // Success Placeholders
  const successOrderId = document.getElementById('success-order-id');
  const successCountdown = document.getElementById('success-countdown');
  const successAddress = document.getElementById('success-address');
  const successName = document.getElementById('success-name');
  const successPhone = document.getElementById('success-phone');
  const successInstructionsRow = document.getElementById('success-instructions-row');
  const successInstructions = document.getElementById('success-instructions');
  const successPayment = document.getElementById('success-payment');

  // Timeline Step Elements
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');
  const step1Text = document.getElementById('step-1-text');
  const step2Text = document.getElementById('step-2-text');
  const step3Text = document.getElementById('step-3-text');

  // --- INITIALIZATION ---
  initPage();

  function initPage() {
    if (cartItems.length === 0) {
      emptyStateEl.style.display = 'flex';
      formStateEl.style.display = 'none';
      return;
    }

    formStateEl.style.display = 'block';
    emptyStateEl.style.display = 'none';

    renderSummaryItems();
    recalculate();

    // Event Listeners for Speed Selector
    if (speedStandardLabel && speedPriorityLabel) {
      speedStandardLabel.addEventListener('click', () => {
        setSpeed('standard');
      });
      speedPriorityLabel.addEventListener('click', () => {
        setSpeed('priority');
      });
    }

    // Toggle Card Details container depending on paymentMethod value
    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener('change', function() {
        if (this.value === 'Card') {
          cardDetailsContainer.style.display = 'block';
        } else {
          cardDetailsContainer.style.display = 'none';
          // Reset error borders/messages on card inputs
          if (cardNameInput) cardNameInput.classList.remove('error-input');
          if (cardNumberInput) cardNumberInput.classList.remove('error-input');
          if (cardExpiryInput) cardExpiryInput.classList.remove('error-input');
          if (cardCVVInput) cardCVVInput.classList.remove('error-input');

          if (cardNameError) cardNameError.style.display = 'none';
          if (cardNumberError) cardNumberError.style.display = 'none';
          if (cardExpiryError) cardExpiryError.style.display = 'none';
          if (cardCVVError) cardCVVError.style.display = 'none';
        }
      });
    }

    // Form input formatters
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', formatCardNumber);
    }
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', formatCardExpiry);
    }
    if (cardCVVInput) {
      cardCVVInput.addEventListener('input', formatCardCvv);
    }

    // Submit handler
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleFormSubmit);
    }
  }

  // --- RENDERING ITEMS ---
  function renderSummaryItems() {
    if (!itemsListEl) return;
    itemsListEl.innerHTML = '';

    cartItems.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'review-item-row';
      itemRow.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="review-item-img" />
        <div class="review-item-info">
          <h4>${item.name}</h4>
          <p>Qty: ${item.quantity}</p>
        </div>
        <div class="review-item-price">
          Rs ${item.price * item.quantity}
        </div>
      `;
      itemsListEl.appendChild(itemRow);
    });
  }

  // --- CALCULATION LOGIC ---
  function recalculate() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliverySpeed === 'priority' ? 250 : 150;
    const platformFee = cartItems.length > 0 ? 30 : 0;

    const grandTotal = subtotal + deliveryFee + platformFee;

    // Update DOM
    if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal}`;
    if (deliveryEl) deliveryEl.textContent = `Rs ${deliveryFee}`;
    if (platformEl) platformEl.textContent = `Rs ${platformFee}`;
    if (grandTotalEl) grandTotalEl.textContent = `Rs ${grandTotal}`;
  }

  // --- SPEED SELECTOR ---
  function setSpeed(speed) {
    deliverySpeed = speed;

    if (speed === 'standard') {
      speedStandardLabel.classList.add('selected');
      speedPriorityLabel.classList.remove('selected');
      document.querySelector('input[name="deliverySpeed"][value="standard"]').checked = true;
    } else {
      speedStandardLabel.classList.remove('selected');
      speedPriorityLabel.classList.add('selected');
      document.querySelector('input[name="deliverySpeed"][value="priority"]').checked = true;
    }

    recalculate();
  }

  // --- FORMATTING HELPERS ---
  function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Format as xxxx xxxx xxxx xxxx
    let formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formatted;
  }

  // MM/YY format helper
  function formatCardExpiry(e) {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    e.target.value = value;
  }

  function formatCardCvv(e) {
    let value = e.target.value.replace(/\D/g, '').substring(0, 3);
    e.target.value = value;
  }

  // --- VALIDATION AND SUBMIT ---
  function validateForm() {
    let isValid = true;

    // Reset error fields
    const errorEls = [nameError, phoneError, addressError, paymentMethodError, cardNameError, cardNumberError, cardExpiryError, cardCVVError];
    errorEls.forEach(el => {
      if (el) {
        el.style.display = 'none';
        el.textContent = '';
      }
    });

    const inputEls = [nameInput, phoneInput, addressInput, paymentMethodSelect, cardNameInput, cardNumberInput, cardExpiryInput, cardCVVInput];
    inputEls.forEach(el => {
      if (el) el.classList.remove('error-input');
    });

    // Receiver Name
    if (!nameInput.value.trim()) {
      nameError.textContent = 'Full Name is required';
      nameError.style.display = 'block';
      nameInput.classList.add('error-input');
      isValid = false;
    }

    // Phone Number
    const rawPhone = phoneInput.value.replace(/\D/g, '');
    if (!phoneInput.value.trim()) {
      phoneError.textContent = 'Phone number is required';
      phoneError.style.display = 'block';
      phoneInput.classList.add('error-input');
      isValid = false;
    } else if (rawPhone.length < 10 || rawPhone.length > 15) { // Support 10-15 digits to match reference validation
      phoneError.textContent = 'Enter a valid phone number';
      phoneError.style.display = 'block';
      phoneInput.classList.add('error-input');
      isValid = false;
    }

    // Address
    if (!addressInput.value.trim()) {
      addressError.textContent = 'Address is required';
      addressError.style.display = 'block';
      addressInput.classList.add('error-input');
      isValid = false;
    }

    // Payment Method selection
    if (paymentMethodSelect.value === '') {
      paymentMethodError.textContent = 'Select a payment method';
      paymentMethodError.style.display = 'block';
      paymentMethodSelect.classList.add('error-input');
      isValid = false;
    }

    // Card Details validation (if card is selected)
    if (paymentMethodSelect.value === 'Card') {
      if (!cardNameInput.value.trim()) {
        cardNameError.textContent = 'Card Name is required';
        cardNameError.style.display = 'block';
        cardNameInput.classList.add('error-input');
        isValid = false;
      }

      const cleanNum = cardNumberInput.value.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanNum)) {
        cardNumberError.textContent = 'Enter a valid card number';
        cardNumberError.style.display = 'block';
        cardNumberInput.classList.add('error-input');
        isValid = false;
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiryInput.value.trim())) {
        cardExpiryError.textContent = 'Expiry must be MM/YY';
        cardExpiryError.style.display = 'block';
        cardExpiryInput.classList.add('error-input');
        isValid = false;
      }

      if (!/^\d{3,4}$/.test(cardCVVInput.value.trim())) {
        cardCVVError.textContent = 'Enter valid CVV';
        cardCVVError.style.display = 'block';
        cardCVVInput.classList.add('error-input');
        isValid = false;
      }
    }

    return isValid;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 1: Show Baking Loader Screen
    formStateEl.style.display = 'none';
    loadingStateEl.style.display = 'flex';

    // Step 2: Timeout for Baking (Simulated)
    setTimeout(() => {
      // Set random order ID
      const orderId = 'NN-' + Math.floor(100000 + Math.random() * 900000);

      // Save Order to History in localStorage before clearing cart
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = deliverySpeed === 'priority' ? 250 : 150;
      const platformFee = cartItems.length > 0 ? 30 : 0;
      const grandTotal = subtotal + deliveryFee + platformFee;

      const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

      const newOrder = {
        id: orderId,
        date: formattedDate,
        status: "Order Placed",
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: grandTotal,
        paymentMethod: paymentMethodSelect.value === 'Card' ? 'Credit/Debit Card' : 'Cash on Delivery (COD)',
        receiver: nameInput.value,
        phone: phoneInput.value,
        address: addressInput.value,
        instructions: instructionsInput.value.trim()
      };

      let currentOrders = JSON.parse(localStorage.getItem('naannow_orders')) || [];
      const defaultMockOrders = [
        {
          id: "NN-492192",
          date: "02 Jun 2026",
          status: "Delivered",
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
      if (currentOrders.length === 0) {
        currentOrders = defaultMockOrders;
      }
      currentOrders.push(newOrder);
      localStorage.setItem('naannow_orders', JSON.stringify(currentOrders));

      // Clear the Cart Items locally & updates navbar instantly
      localStorage.setItem('naannow_cart', JSON.stringify([]));
      cartItems = [];

      const navBadge = document.querySelector('.cart-badge');
      if (navBadge) navBadge.textContent = '0';
      const sidebarCount = document.querySelector('.cart-count');
      if (sidebarCount) sidebarCount.textContent = '0 Items';
      const sidebarItems = document.querySelector('.cart-items');
      if (sidebarItems) sidebarItems.innerHTML = '<div class="empty-cart">Your Tokri is empty</div>';
      
      const sidebarSubtotalEl = document.querySelector('.cart-footer .price-row:nth-child(1) span:last-child');
      if (sidebarSubtotalEl) sidebarSubtotalEl.textContent = 'Rs 0';
      const sidebarDeliveryEl = document.querySelector('.cart-footer .price-row:nth-child(2) span:last-child');
      if (sidebarDeliveryEl) sidebarDeliveryEl.textContent = 'Rs 0';
      const sidebarTotalEl = document.querySelector('.cart-footer .price-row.total span:last-child');
      if (sidebarTotalEl) sidebarTotalEl.textContent = 'Rs 0';

      // Redirect to tracking page
      window.location.href = `/track-order/${orderId}`;
    }, 2500);
  }

  // --- TIMELINE TRACKER ---
  function startOrderTracking() {
    orderStep = 1;
    countdown = 30;
    if (successCountdown) successCountdown.textContent = `${countdown} mins`;

    // Step transitions
    // Received & Preheating -> Baking (4 seconds)
    tandoorTimer = setTimeout(() => {
      orderStep = 2;
      step1.classList.remove('current');
      step1Text.textContent = 'Completed';

      step2.classList.add('active', 'current');
      step2Text.textContent = 'Naan is in the clay oven, cooking to crispy perfection...';
    }, 4000);

    // Baking -> Rider Delivering (9 seconds)
    deliveryTimer = setTimeout(() => {
      orderStep = 3;
      step2.classList.remove('current');
      step2Text.textContent = 'Completed';

      step3.classList.add('active', 'current');
      step3Text.textContent = 'Rider is carrying your warm food box directly to your location!';
    }, 9000);

    // Live estimated countdown decrement
    countdownInterval = setInterval(() => {
      if (countdown > 5) {
        countdown -= 1;
        if (successCountdown) successCountdown.textContent = `${countdown} mins`;
      }
    }, 6000);
  }
});
