document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let cartItems = JSON.parse(localStorage.getItem('naannow_cart')) || [];
  let favorites = JSON.parse(localStorage.getItem('naannow_favorites')) || [];
  let selectedCuisine = 'All';

  // --- DOM ELEMENTS ---
  const navbar = document.querySelector('.navbar');
  const profileBtn = document.querySelector('.profile-menu-container .action-btn');
  const profileDropdown = document.querySelector('.profile-dropdown');
  
  const cartOpenBtn = document.querySelector('.cart-container');
  const cartCloseBtn = document.querySelector('.cart-sidebar .close-btn');
  const cartSidebar = document.querySelector('.cart-sidebar');
  const cartOverlay = document.querySelector('.cart-overlay');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartBadge = document.querySelector('.cart-badge');
  const cartCountText = document.querySelector('.cart-count');
  
  // Footer pricing
  const subtotalValEl = document.querySelector('.price-row:nth-child(1) span:last-child');
  const deliveryValEl = document.querySelector('.price-row:nth-child(2) span:last-child');
  const totalValEl = document.querySelector('.price-row.total span:last-child');
  const addTestItemBtn = document.querySelector('.nav-user-actions button:last-child'); // Add test item button

  // Cuisines & Filtering
  const cuisineButtons = document.querySelectorAll('.cuisine-circle-btn');
  const restaurantCards = document.querySelectorAll('.restaurant-card');
  const resultsCountEl = document.querySelector('.results-count');
  const noRestaurantsFoundEl = document.querySelector('.no-restaurants-found');
  const gridContainer = document.querySelector('.restaurant-grid');

  // Favorites Page elements
  const isFavoritesPage = window.location.pathname.includes('/favorites');
  const favoritesBadge = document.querySelector('.favorites-badge');

  // Hero Greeting
  const greetingEl = document.querySelector('.hero-greeting');

  // Craving Pills
  const cravingPillsList = document.querySelector('.pills-list');
  const refreshPillsBtn = document.querySelector('.craving-pills .icon-btn');

  // Search input
  const searchInput = document.querySelector('.nav-search input');
  const navbarBottom = document.querySelector('.navbar-bottom');

  // --- INITIALIZATION ---
  initGreeting();
  initPills();
  initSearch();
  initScrollNav();
  initProfileDropdown();
  initCuisineFilters();
  initFavorites();
  initCart();
  filterRestaurants();
  
  // --- NAVBAR SCROLL BEHAVIOR ---
  function initScrollNav() {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      if (window.innerWidth > 768) {
        navbar.classList.remove('hide-top');
        return;
      }
      
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      const isScrollingUp = currentScrollY < lastScrollY;
      
      if (isScrollingDown && currentScrollY > 140) {
        navbar.classList.add('hide-top');
      } else if (isScrollingUp) {
        navbar.classList.remove('hide-top');
      }
      
      lastScrollY = Math.max(currentScrollY, 0);
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navbar.classList.remove('hide-top');
      }
    });
  }

  // --- PROFILE DROPDOWN ---
  function initProfileDropdown() {
    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
      });

      profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.addEventListener('click', () => {
        profileDropdown.classList.remove('open');
      });
    }
  }

  // --- GREETING LOGIC ---
  function initGreeting() {
    if (greetingEl) {
      const hour = new Date().getHours();
      let greeting = 'Welcome';
      if (hour < 12) greeting = 'Good Morning';
      else if (hour < 18) greeting = 'Good Afternoon';
      else greeting = 'Good Evening';
      
      const parts = greetingEl.textContent.split(',');
      const userName = parts.length > 1 ? parts[1].trim() : 'Muhammad Saad';
      greetingEl.textContent = `${greeting}, ${userName}`;
    }
  }

  // --- CRAVING PILLS REFRESH LOGIC ---
  function initPills() {
    if (refreshPillsBtn && cravingPillsList) {
      const allCategories = [
        'Desi', 'Naan', 'Karahi', 'Fast Food',
        'BBQ', 'Pizza', 'Burgers', 'Chinese',
        'Desserts', 'Healthy', 'Biryani', 'Rolls',
        'Salads', 'Seafood', 'Pasta'
      ];
      let currentIndex = 0;

      refreshPillsBtn.addEventListener('click', () => {
        const spinIcon = refreshPillsBtn.querySelector('svg');
        if (spinIcon) spinIcon.classList.add('spin-icon');
        cravingPillsList.classList.add('fading-out');

        setTimeout(() => {
          currentIndex = (currentIndex + 5) % allCategories.length;
          
          // Clear current pills
          cravingPillsList.innerHTML = '';
          
          // Add next 5 pills
          for (let i = 0; i < 5; i++) {
            const category = allCategories[(currentIndex + i) % allCategories.length];
            const pillBtn = document.createElement('button');
            pillBtn.className = 'pill';
            pillBtn.innerHTML = `
              <svg width="18" height="18" fill="#e87b1e" viewBox="0 0 24 24" style="color: rgb(232, 123, 30); font-size: 18px;">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              ${category}
            `;
            // Add click filtering to hero category pills as well!
            pillBtn.addEventListener('click', () => {
              triggerCuisineFilter(category);
            });
            cravingPillsList.appendChild(pillBtn);
          }

          if (spinIcon) spinIcon.classList.remove('spin-icon');
          cravingPillsList.classList.remove('fading-out');
          cravingPillsList.classList.add('fading-in');
        }, 400);
      });
    }
  }

  // --- SEARCH FOCUS EXPAND/COLLAPSE ---
  function initSearch() {
    if (searchInput && navbarBottom) {
      searchInput.addEventListener('focus', () => {
        navbarBottom.classList.add('search-focused');
      });
      searchInput.addEventListener('blur', () => {
        navbarBottom.classList.remove('search-focused');
      });
      searchInput.addEventListener('input', () => {
        filterRestaurants();
      });
    }
  }

  // --- FAVORITES MANAGEMENT ---
  function initFavorites() {
    // Add event listeners to all wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const card = btn.closest('.restaurant-card');
      const id = parseInt(card.dataset.id);
      
      // Initial active state
      if (favorites.includes(id)) {
        btn.classList.add('active');
        const path = btn.querySelector('path');
        if (path) {
          btn.querySelector('svg').setAttribute('fill', 'var(--color-tandoori)');
          btn.querySelector('svg').setAttribute('stroke', 'var(--color-tandoori)');
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(id, btn);
      });
    });

    updateFavoritesBadge();
  }

  function toggleFavorite(id, btn) {
    const index = favorites.indexOf(id);
    const isFav = index !== -1;
    
    if (isFav) {
      favorites.splice(index, 1);
      btn.classList.remove('active');
      btn.querySelector('svg').setAttribute('fill', 'none');
      btn.querySelector('svg').setAttribute('stroke', 'currentColor');
      
      // If we are on favorites page, remove the card immediately
      if (isFavoritesPage) {
        const card = btn.closest('.restaurant-card');
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.8)';
          setTimeout(() => {
            card.remove();
            filterRestaurants(); // Refresh counts / empty states
          }, 300);
        }
      }
    } else {
      favorites.push(id);
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', 'var(--color-tandoori)');
      btn.querySelector('svg').setAttribute('stroke', 'var(--color-tandoori)');
    }

    localStorage.setItem('naannow_favorites', JSON.stringify(favorites));
    updateFavoritesBadge();
  }

  function updateFavoritesBadge() {
    if (favoritesBadge) {
      if (favorites.length > 0) {
        favoritesBadge.style.display = 'flex';
        favoritesBadge.textContent = favorites.length;
      } else {
        favoritesBadge.style.display = 'none';
      }
    }
  }

  // --- CUISINE FILTERS ---
  function initCuisineFilters() {
    cuisineButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cuisineButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCuisine = btn.dataset.cuisine;
        filterRestaurants();
      });
    });
  }

  function triggerCuisineFilter(cuisineName) {
    selectedCuisine = cuisineName;
    cuisineButtons.forEach(btn => {
      if (btn.dataset.cuisine.toLowerCase() === cuisineName.toLowerCase()) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      } else {
        btn.classList.remove('active');
      }
    });
    filterRestaurants();
  }

  function filterRestaurants() {
    let count = 0;
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    restaurantCards.forEach(card => {
      const id = parseInt(card.dataset.id);
      const name = card.querySelector('h3').textContent.toLowerCase();
      const cuisine = card.dataset.cuisine.toLowerCase();

      let matchesCuisine = false;
      if (selectedCuisine === 'All') {
        matchesCuisine = true;
      } else {
        matchesCuisine = cuisine.includes(selectedCuisine.toLowerCase());
      }

      let matchesFavorites = true;
      if (isFavoritesPage) {
        matchesFavorites = favorites.includes(id);
      }

      let matchesSearch = true;
      if (query !== '') {
        matchesSearch = name.includes(query) || cuisine.includes(query);
      }

      const show = matchesCuisine && matchesFavorites && matchesSearch;

      if (show) {
        card.style.display = 'block';
        count++;
      } else {
        card.style.display = 'none';
      }
    });

    if (resultsCountEl) {
      resultsCountEl.textContent = `${count} ${count === 1 ? 'restaurant' : 'restaurants'} found`;
    }

    if (count === 0) {
      if (noRestaurantsFoundEl) {
        noRestaurantsFoundEl.style.display = 'flex';
        const h3 = noRestaurantsFoundEl.querySelector('h3');
        const p = noRestaurantsFoundEl.querySelector('p');
        if (isFavoritesPage) {
          h3.textContent = 'No favorites saved yet';
          p.textContent = 'Click the heart icon on any restaurant card to save it here!';
        } else {
          h3.textContent = `No restaurants found`;
          p.textContent = 'Try selecting a different cuisine or check back later!';
        }
      }
    } else {
      if (noRestaurantsFoundEl) {
        noRestaurantsFoundEl.style.display = 'none';
      }
    }
  }

  // --- CART SYSTEM ---
  function initCart() {
    // Open/Close
    if (cartOpenBtn) {
      cartOpenBtn.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('show');
      });
    }

    const closeCart = () => {
      cartSidebar.classList.remove('open');
      cartOverlay.classList.remove('show');
    };

    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Add to Cart from cards
    // The current cards do not have direct "Add to Cart" buttons except the Navbar "Add Test Item" button
    // Let's attach an event listener to the "Add Test Item" button
    if (addTestItemBtn) {
      addTestItemBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addToCart({
          id: 1,
          name: "Garlic Naan",
          price: 150,
          image: "/assets/naan-removebg.png"
        });
      });
    }

    // Global Event Delegation for dynamic Add to Cart buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (btn) {
        e.preventDefault();
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        const price = parseInt(btn.dataset.price);
        const image = btn.dataset.image;
        addToCart({ id, name, price, image });
      }
    });

    // Initialize/Render
    renderCart();
  }

  function addToCart(item) {
    const existing = cartItems.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems.push({
        ...item,
        quantity: 1
      });
    }
    saveCart();
    renderCart();
    
    // Automatically open the cart sidebar when an item is added
    if (cartSidebar && cartOverlay) {
      cartSidebar.classList.add('open');
      cartOverlay.classList.add('show');
    }
  }

  function decreaseQuantity(id) {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        cartItems = cartItems.filter(i => i.id !== id);
      }
      saveCart();
      renderCart();
    }
  }

  function increaseQuantity(id) {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      item.quantity += 1;
      saveCart();
      renderCart();
    }
  }

  function saveCart() {
    localStorage.setItem('naannow_cart', JSON.stringify(cartItems));
  }

  function renderCart() {
    // Update navbar badge count
    const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalQty;
    if (cartCountText) cartCountText.textContent = `${totalQty} Items`;

    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = `<div class="empty-cart">Your Tokri is empty</div>`;
      subtotalValEl.textContent = 'Rs 0';
      deliveryValEl.textContent = 'Rs 0';
      totalValEl.textContent = 'Rs 0';
      return;
    }

    cartItemsContainer.innerHTML = '';
    
    cartItems.forEach(item => {
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

      // Event listeners
      itemEl.querySelector('.qty-minus').addEventListener('click', () => decreaseQuantity(item.id));
      itemEl.querySelector('.qty-plus').addEventListener('click', () => increaseQuantity(item.id));

      cartItemsContainer.appendChild(itemEl);
    });

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = 150;
    const total = subtotal + deliveryFee;

    subtotalValEl.textContent = `Rs ${subtotal}`;
    deliveryValEl.textContent = `Rs ${deliveryFee}`;
    totalValEl.textContent = `Rs ${total}`;
  }
});
