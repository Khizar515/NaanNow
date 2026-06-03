// === NaanNow Profile Management Logic ===

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE INITIALIZATION ---
  let profile = JSON.parse(localStorage.getItem('naannow_profile')) || {
    name: document.getElementById('username')?.textContent || 'Muhammad Saad',
    email: document.getElementById('userEmailVal')?.textContent || 'saad@example.com',
    phone: document.getElementById('phone')?.textContent || '+92 300 1234567',
    avatar: document.getElementById('sidebarAvatar')?.getAttribute('src') || ''
  };

  let address = localStorage.getItem('naannow_address') || 
                document.getElementById('address')?.textContent || 
                'House 45, Street 11, F-11/1, Islamabad';

  let paymentMethods = JSON.parse(localStorage.getItem('naannow_payments')) || [
    { id: 1, holder: 'Muhammad Saad', number: '•••• •••• •••• 4321', expiry: '12/28', type: 'visa' },
    { id: 2, holder: 'Muhammad Saad', number: '•••• •••• •••• 8910', expiry: '06/29', type: 'mastercard' }
  ];

  // --- DOM CACHING ---
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarEmail = document.getElementById('sidebarEmail');
  const profilePicInput = document.getElementById('profilePicInput');

  // Account Info DOM
  const viewProfileSec = document.getElementById('viewProfile');
  const editProfileSec = document.getElementById('editProfile');
  const usernameVal = document.getElementById('username');
  const emailVal = document.getElementById('userEmailVal');
  const phoneVal = document.getElementById('phone');

  // Edit Profile Form Inputs
  const editNameInput = document.getElementById('editNameInput');
  const editEmailInput = document.getElementById('editEmailInput');
  const editPhoneInput = document.getElementById('editPhoneInput');

  // Address DOM
  const viewAddressSec = document.getElementById('viewAddress');
  const editAddressSec = document.getElementById('editAddress');
  const addressVal = document.getElementById('address');
  const editAddressInput = document.getElementById('editAddressInput');

  // Payments DOM
  const viewPaymentsSec = document.getElementById('viewPayments');
  const addPaymentSec = document.getElementById('addPaymentForm');
  const paymentListEl = document.getElementById('paymentMethodsList');

  // New Card Form Inputs
  const cardHolderInput = document.getElementById('cardHolderInput');
  const cardNumberInput = document.getElementById('cardNumberInput');
  const expiryInput = document.getElementById('expiryInput');
  const cvvInput = document.getElementById('cvvInput');

  // Security & Password DOM
  const securitySec = document.getElementById('securitySection');
  const changePasswordSec = document.getElementById('changePassword');
  
  // Toast Dom
  const toastAlert = document.getElementById('toastAlert');
  const toastMsg = toastAlert?.querySelector('.toast-message');

  // --- INITIAL RENDERING ---
  function applyInitialData() {
    // Apply profile data
    if (sidebarAvatar && profile.avatar) sidebarAvatar.src = profile.avatar;
    if (sidebarName) sidebarName.textContent = profile.name;
    if (sidebarEmail) sidebarEmail.textContent = profile.email;
    if (usernameVal) usernameVal.textContent = profile.name;
    if (emailVal) emailVal.textContent = profile.email;
    if (phoneVal) phoneVal.textContent = profile.phone;

    // Apply address
    if (addressVal) addressVal.textContent = address;

    // Render payment cards
    renderPaymentCards();
  }

  // --- VIEW TOGGLES ---
  window.openProfileEdit = function() {
    if (viewProfileSec && editProfileSec) {
      viewProfileSec.style.display = 'none';
      editProfileSec.style.display = 'block';

      // Load current state into inputs
      if (editNameInput) editNameInput.value = profile.name;
      if (editEmailInput) editEmailInput.value = profile.email;
      if (editPhoneInput) editPhoneInput.value = profile.phone;
    }
  };

  window.cancelProfile = function() {
    if (viewProfileSec && editProfileSec) {
      editProfileSec.style.display = 'none';
      viewProfileSec.style.display = 'block';
    }
  };

  window.openAddressEdit = function() {
    if (viewAddressSec && editAddressSec) {
      viewAddressSec.style.display = 'none';
      editAddressSec.style.display = 'block';

      // Load current address
      if (editAddressInput) editAddressInput.value = address;
    }
  };

  window.cancelAddress = function() {
    if (viewAddressSec && editAddressSec) {
      editAddressSec.style.display = 'none';
      viewAddressSec.style.display = 'block';
    }
  };

  window.openAddPayment = function() {
    if (viewPaymentsSec && addPaymentSec) {
      viewPaymentsSec.style.display = 'none';
      addPaymentSec.style.display = 'block';
      
      // Reset inputs
      if (cardHolderInput) cardHolderInput.value = '';
      if (cardNumberInput) cardNumberInput.value = '';
      if (expiryInput) expiryInput.value = '';
      if (cvvInput) cvvInput.value = '';
    }
  };

  window.cancelAddPayment = function() {
    if (viewPaymentsSec && addPaymentSec) {
      addPaymentSec.style.display = 'none';
      viewPaymentsSec.style.display = 'block';
    }
  };

  window.openPasswordEdit = function() {
    if (securitySec && changePasswordSec) {
      securitySec.style.display = 'none';
      changePasswordSec.style.display = 'block';

      // Clear input fields
      document.getElementById('currentPasswordInput').value = '';
      document.getElementById('newPasswordInput').value = '';
      document.getElementById('confirmPasswordInput').value = '';
    }
  };

  window.cancelPasswordEdit = function() {
    if (securitySec && changePasswordSec) {
      changePasswordSec.style.display = 'none';
      securitySec.style.display = 'block';
    }
  };

  // --- TOAST ALERTS ---
  let toastTimeout;
  window.showToast = function(message) {
    if (toastAlert && toastMsg) {
      clearTimeout(toastTimeout);
      toastMsg.textContent = message;
      toastAlert.style.display = 'flex';

      // Auto fadeout after 4 seconds
      toastTimeout = setTimeout(() => {
        closeToast();
      }, 4000);
    }
  };

  window.closeToast = function() {
    if (toastAlert) {
      toastAlert.style.display = 'none';
    }
  };

  // --- PROFILE ACTIONS ---
  window.saveProfile = function(event) {
    event.preventDefault();

    profile.name = editNameInput.value.trim();
    profile.email = editEmailInput.value.trim();
    profile.phone = editPhoneInput.value.trim();

    localStorage.setItem('naannow_profile', JSON.stringify(profile));
    
    // Update active DOM content
    if (sidebarName) sidebarName.textContent = profile.name;
    if (sidebarEmail) sidebarEmail.textContent = profile.email;
    if (usernameVal) usernameVal.textContent = profile.name;
    if (emailVal) emailVal.textContent = profile.email;
    if (phoneVal) phoneVal.textContent = profile.phone;

    // Check if navbar profile name element exists, update it too
    const navProfileText = document.querySelector('.profile-menu-container .action-btn');
    if (navProfileText) {
      // Retain the svg structure and chevron icon
      const svgIcon = navProfileText.querySelector('svg:first-child');
      const chevronIcon = navProfileText.querySelector('.chevron-icon-profile');
      
      navProfileText.innerHTML = '';
      if (svgIcon) navProfileText.appendChild(svgIcon);
      navProfileText.appendChild(document.createTextNode(' ' + profile.name + ' '));
      if (chevronIcon) navProfileText.appendChild(chevronIcon);
    }

    showToast('Account information updated successfully!');
    cancelProfile();
  };

  // Profile Picture Upload Handler
  if (profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const imageBase64 = event.target.result;
          profile.avatar = imageBase64;
          localStorage.setItem('naannow_profile', JSON.stringify(profile));

          if (sidebarAvatar) sidebarAvatar.src = imageBase64;
          showToast('Profile picture updated successfully!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- ADDRESS ACTIONS ---
  window.saveAddress = function(event) {
    event.preventDefault();

    address = editAddressInput.value.trim();
    localStorage.setItem('naannow_address', address);

    if (addressVal) addressVal.textContent = address;
    
    showToast('Shipping address updated successfully!');
    cancelAddress();
  };

  // --- PAYMENT METHOD ACTIONS ---
  function renderPaymentCards() {
    if (!paymentListEl) return;

    if (paymentMethods.length === 0) {
      paymentListEl.innerHTML = '<p class="empty-cards-text" style="color: #7f6e66; font-size: 0.9rem; margin: 0;">No payment methods saved.</p>';
      return;
    }

    paymentListEl.innerHTML = '';
    paymentMethods.forEach(card => {
      const cardItem = document.createElement('div');
      cardItem.className = 'payment-card-item';
      
      // Determine card icon
      let cardIconClass = 'bi-credit-card-2-front-fill';
      if (card.type === 'visa') cardIconClass = 'bi-credit-card-2-back-fill';
      if (card.type === 'mastercard') cardIconClass = 'bi-credit-card-2-front';

      cardItem.innerHTML = `
        <div class="payment-card-info">
          <div class="card-icon">
            <i class="bi ${cardIconClass}"></i>
          </div>
          <div class="card-details">
            <span class="card-number">${card.number}</span>
            <span class="card-expiry">Expires ${card.expiry} | ${card.holder}</span>
          </div>
        </div>
        <button class="delete-card-btn" onclick="deleteCard(${card.id})" title="Delete Card">
          <i class="bi bi-trash"></i>
        </button>
      `;
      paymentListEl.appendChild(cardItem);
    });
  }

  window.savePayment = function(event) {
    event.preventDefault();

    const holder = cardHolderInput.value.trim();
    const rawNumber = cardNumberInput.value.replace(/\s+/g, '');
    const expiry = expiryInput.value.trim();
    const cvv = cvvInput.value.trim();

    // Validations
    if (rawNumber.length < 16) {
      alert('Card number must be 16 digits.');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      alert('Expiry date must be in MM/YY format.');
      return;
    }

    if (cvv.length < 3) {
      alert('CVV must be 3 digits.');
      return;
    }

    // Mask card number for display
    const lastFour = rawNumber.slice(-4);
    const maskedNumber = `•••• •••• •••• ${lastFour}`;

    // Determine type
    const firstDigit = rawNumber.charAt(0);
    let cardType = 'generic';
    if (firstDigit === '4') cardType = 'visa';
    else if (firstDigit === '5') cardType = 'mastercard';

    const newCard = {
      id: Date.now(),
      holder: holder,
      number: maskedNumber,
      expiry: expiry,
      type: cardType
    };

    paymentMethods.push(newCard);
    localStorage.setItem('naannow_payments', JSON.stringify(paymentMethods));

    renderPaymentCards();
    showToast('Payment method added successfully!');
    cancelAddPayment();
  };

  window.deleteCard = function(id) {
    if (confirm('Are you sure you want to remove this payment card?')) {
      paymentMethods = paymentMethods.filter(card => card.id !== id);
      localStorage.setItem('naannow_payments', JSON.stringify(paymentMethods));
      
      renderPaymentCards();
      showToast('Payment method deleted successfully!');
    }
  };

  // Format Card Number (space every 4 digits)
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      let formatted = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
      }
      e.target.value = formatted;
    });
  }

  // Format Expiry Date (slash after 2 digits)
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      let formatted = '';
      if (value.length > 2) {
        formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
      } else {
        formatted = value;
      }
      e.target.value = formatted;
    });
  }

  // Format CVV input (digits only)
  if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  // --- PASSWORD ACTIONS ---
  window.savePassword = function(event) {
    event.preventDefault();

    const current = document.getElementById('currentPasswordInput').value.trim();
    const newPass = document.getElementById('newPasswordInput').value.trim();
    const confirmPass = document.getElementById('confirmPasswordInput').value.trim();

    if (newPass.length < 8) {
      alert('New password must be at least 8 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      alert('Passwords do not match. Please verify your new password.');
      return;
    }

    showToast('Password updated successfully!');
    cancelPasswordEdit();
  };

  // --- LOGOUT ACTION ---
  window.handleLogout = function() {
    if (confirm('Are you sure you want to log out?')) {
      // Clear local states
      localStorage.removeItem('naannow_profile');
      localStorage.removeItem('naannow_address');
      localStorage.removeItem('naannow_payments');
      
      showToast('Logging out...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  // Run on startup
  applyInitialData();
});
