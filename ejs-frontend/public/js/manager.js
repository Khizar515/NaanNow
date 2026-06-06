class CustomModal {
  constructor(el) {
    this.el = el;
  }
  show() {
    this.el.classList.add('show');
    this.el.style.display = 'flex';
    document.body.classList.add('modal-open');
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', () => this.hide());
    }
  }
  hide() {
    this.el.classList.remove('show');
    this.el.style.display = 'none';
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
  }
}
window.bootstrap = {
  Modal: class {
    constructor(el) {
      if (el._modalInstance) return el._modalInstance;
      this.instance = new CustomModal(el);
      el._modalInstance = this.instance;
      return this.instance;
    }
    static getInstance(el) {
      if (el._modalInstance) return el._modalInstance;
      const inst = new CustomModal(el);
      el._modalInstance = inst;
      return inst;
    }
  }
};

// Global click event handlers for custom modals, dropdowns, and collapse components
document.addEventListener('click', (e) => {
  // Modal triggers
  const toggleBtn = e.target.closest('[data-bs-toggle="modal"]');
  if (toggleBtn) {
    const targetSelector = toggleBtn.getAttribute('data-bs-target');
    const modalEl = document.querySelector(targetSelector);
    if (modalEl) {
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Modal dismiss buttons
  const dismissBtn = e.target.closest('[data-bs-dismiss="modal"]');
  if (dismissBtn) {
    const modalEl = dismissBtn.closest('.portal-modal');
    if (modalEl) {
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }
  }

  // Dropdown toggles
  const dropdownToggle = e.target.closest('.portal-dropdown-toggle');
  if (dropdownToggle) {
    e.preventDefault();
    const dropdownMenu = dropdownToggle.nextElementSibling;
    if (dropdownMenu) {
      dropdownMenu.classList.toggle('show');
    }
  } else {
    // Close other open dropdowns
    document.querySelectorAll('.portal-dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }

  // Navbar toggler (hamburger menu)
  const navbarToggler = e.target.closest('.portal-navbar-toggler');
  if (navbarToggler) {
    const targetEl = document.querySelector('.portal-navbar-collapse');
    if (targetEl) {
      targetEl.classList.toggle('show');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Define key paths and elements
  const path = window.location.pathname;

  // Local storage keys
  const RESTAURANT_KEY = 'naanNow_restaurant';
  const MENU_KEY = 'naanNow_menuItems';

  // Default menu items list
  const DEFAULT_MENU_ITEMS = [
    {
      id: 1,
      name: "Garlic Naan",
      description: "Soft, leavened clay oven bread brushed with garlic butter and fresh coriander.",
      price: 150,
      category: "Naan",
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      name: "Roghni Naan",
      description: "Traditional soft naan bread sprinkled with sesame seeds and brushed with ghee.",
      price: 120,
      category: "Naan",
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      name: "Chicken Biryani",
      description: "Fragrant basmati rice layered with spiced marinated chicken, cooked in authentic dum style.",
      price: 450,
      category: "Biryani",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 4,
      name: "Beef Seekh Kebab",
      description: "Minced beef blended with fresh herbs and spices, grilled to perfection on skewers.",
      price: 620,
      category: "BBQ",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 5,
      name: "Tandoori Chicken Tikka",
      description: "Succulent chicken leg quarter marinated in yogurt, tandoori spices and grilled over red-hot charcoal.",
      price: 390,
      category: "BBQ",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 6,
      name: "Mint Margarita",
      description: "Refreshing summer cooler made with fresh mint leaves, lemon juice, soda, and crushed ice.",
      price: 220,
      category: "Drinks",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60"
    }
  ];

  // Initialize data stores
  let restaurant = JSON.parse(localStorage.getItem(RESTAURANT_KEY));
  let menuItems = JSON.parse(localStorage.getItem(MENU_KEY));

  if (!menuItems) {
    localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
    menuItems = DEFAULT_MENU_ITEMS;
  }

  // --- REDIRECTION GUARD ---
  // If the manager has NOT set up a restaurant, they must be forced to the setup screen.
  if (!restaurant && path !== '/manager/setup') {
    window.location.href = '/manager/setup';
    return;
  }

  // Helper function to convert file input to Base64 data url
  const readImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // --- 1. SETUP PAGE CONTROLLER ---
  if (path === '/manager/setup') {
    const setupForm = document.getElementById('setupForm');
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const previewWrapper = document.getElementById('previewWrapper');
    const defaultPlaceholder = document.getElementById('defaultPlaceholder');

    let base64Logo = '';

    // If restaurant is already set up, pre-populate
    if (restaurant) {
      document.getElementById('restaurantName').value = restaurant.name || '';
      document.getElementById('restaurantAddress').value = restaurant.address || '';
      document.getElementById('restaurantLocation').value = restaurant.location || '';
      document.getElementById('restaurantPhone').value = restaurant.phone || '';
      document.getElementById('openingTime').value = restaurant.openingTime || '';
      document.getElementById('closingTime').value = restaurant.closingTime || '';

      if (restaurant.logo) {
        base64Logo = restaurant.logo;
        logoPreview.src = base64Logo;
        previewWrapper.classList.remove('d-none');
        defaultPlaceholder.classList.add('d-none');
      }
    }

    // Logo image file select preview
    logoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          base64Logo = await readImageFile(file);
          logoPreview.src = base64Logo;
          previewWrapper.classList.remove('d-none');
          defaultPlaceholder.classList.add('d-none');
        } catch (err) {
          console.error("Failed to read logo image file:", err);
        }
      }
    });

    // Handle setup form submit
    setupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const updatedRestaurant = {
        name: document.getElementById('restaurantName').value.trim(),
        address: document.getElementById('restaurantAddress').value.trim(),
        location: document.getElementById('restaurantLocation').value.trim(),
        phone: document.getElementById('restaurantPhone').value.trim(),
        openingTime: document.getElementById('openingTime').value,
        closingTime: document.getElementById('closingTime').value,
        logo: base64Logo || (restaurant ? restaurant.logo : '')
      };

      if (!updatedRestaurant.name || !updatedRestaurant.address || !updatedRestaurant.phone || !updatedRestaurant.openingTime || !updatedRestaurant.closingTime) {
        alert("Please fill in all required fields!");
        return;
      }

      localStorage.setItem(RESTAURANT_KEY, JSON.stringify(updatedRestaurant));

      // Flash a beautiful alert, then redirect
      const saveBtn = setupForm.querySelector('button[type="submit"]');
      const originalText = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="portal-spinner spinner-small"></span> Saving...';

      setTimeout(() => {
        window.location.href = '/manager/dashboard';
      }, 1000);
    });
  }

  // --- 2. DASHBOARD CONTROLLER ---
  if (path === '/manager/dashboard') {
    if (restaurant) {
      // Set restaurant details in DOM
      document.getElementById('dashboardRestName').textContent = restaurant.name;
      document.getElementById('dashboardRestAddress').textContent = restaurant.address;
      document.getElementById('dashboardRestPhone').textContent = restaurant.phone;

      if (restaurant.logo) {
        document.getElementById('dashboardRestLogo').src = restaurant.logo;
      } else {
        // Fallback placeholder with initial
        document.getElementById('dashboardRestLogo').src = 'https://placehold.co/200x200/5CA136/FFFFFF?text=' + encodeURIComponent(restaurant.name.charAt(0));
      }

      // Open/Closed badge checking
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const totalMinutesNow = currentHours * 60 + currentMinutes;

      const [openH, openM] = restaurant.openingTime.split(':').map(Number);
      const [closeH, closeM] = restaurant.closingTime.split(':').map(Number);
      const totalMinutesOpen = openH * 60 + openM;
      const totalMinutesClose = closeH * 60 + closeM;

      const isOpen = totalMinutesNow >= totalMinutesOpen && totalMinutesNow < totalMinutesClose;
      const statusBadge = document.getElementById('restaurantStatusBadge');
      if (isOpen) {
        statusBadge.innerHTML = '<span class="portal-badge badge-success"><i class="bi bi-circle-fill small"></i> Open Now</span>';
      } else {
        statusBadge.innerHTML = '<span class="portal-badge badge-danger"><i class="bi bi-slash-circle small"></i> Closed</span>';
      }

      // Count menu items
      document.getElementById('totalItemsCount').textContent = menuItems.length;
    }
  }

  // --- 3. MENU MANAGEMENT CONTROLLER ---
  if (path === '/manager/menu') {
    const menuGrid = document.getElementById('menuGrid');
    const categoryFilters = document.getElementById('categoryFilters');
    const searchInput = document.getElementById('menuSearch');

    // Add Item Modal elements
    const addItemForm = document.getElementById('addItemForm');
    const addItemImgInput = document.getElementById('addItemImgInput');
    const addItemImgPreview = document.getElementById('addItemImgPreview');
    const addItemPreviewWrapper = document.getElementById('addItemPreviewWrapper');
    const addItemPlaceholder = document.getElementById('addItemPlaceholder');
    let addBase64Image = '';

    // Edit Item Modal elements
    const editItemForm = document.getElementById('editItemForm');
    const editItemImgInput = document.getElementById('editItemImgInput');
    const editItemImgPreview = document.getElementById('editItemImgPreview');
    const editItemPreviewWrapper = document.getElementById('editItemPreviewWrapper');
    const editItemPlaceholder = document.getElementById('editItemPlaceholder');
    let editBase64Image = '';
    let editingItemId = null;

    // Delete Modal elements
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let deletingItemId = null;

    let selectedCategory = 'All';
    let searchQuery = '';

    // Categories available
    const categories = ['All', 'Naan', 'Biryani', 'BBQ', 'Drinks', 'Desserts', 'Fast Food', 'Others'];

    // Render Filter Badges
    const renderCategoryFilters = () => {
      categoryFilters.innerHTML = '';
      categories.forEach(cat => {
        const badge = document.createElement('span');
        badge.className = `filter-badge me-2 mb-2 d-inline-block ${selectedCategory === cat ? 'active' : ''}`;
        badge.textContent = cat;
        badge.addEventListener('click', () => {
          selectedCategory = cat;
          renderCategoryFilters();
          renderMenuItems();
        });
        categoryFilters.appendChild(badge);
      });
    };

    // Render cards list
    const renderMenuItems = () => {
      menuGrid.innerHTML = '';

      const filtered = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      if (filtered.length === 0) {
        menuGrid.innerHTML = `
          <div class="menu-items-empty">
            <div class="empty-menu-placeholder">
              <i class="bi bi-egg-fried empty-icon"></i>
              <h5 class="empty-title">No items found</h5>
              <p class="empty-subtitle">Try altering your search or filters, or add a brand new item.</p>
            </div>
          </div>
        `;
        return;
      }

      filtered.forEach(item => {
        const col = document.createElement('div');
        col.className = 'menu-item-card-wrapper';
        col.innerHTML = `
          <div class="menu-item-card">
            <div class="menu-card-img-wrapper">
              <img src="${item.image || 'https://placehold.co/600x400/5CA136/FFFFFF?text=' + encodeURIComponent(item.name)}" class="menu-card-img" alt="${item.name}">
              <span class="menu-card-badge">${item.category}</span>
            </div>
            <div class="menu-item-card-body">
              <h5 class="menu-item-card-title">${item.name}</h5>
              <p class="menu-item-card-desc">${item.description}</p>
              <div class="menu-item-card-footer">
                <span class="menu-card-price">Rs. ${item.price}</span>
                <div class="menu-item-card-actions">
                  <button class="btn-portal btn-portal-small btn-portal-secondary edit-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editItemModal">
                    <i class="bi bi-pencil"></i> Edit
                  </button>
                  <button class="btn-portal btn-portal-small btn-portal-danger delete-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#deleteItemModal">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Bind events to buttons inside card
        col.querySelector('.edit-btn').addEventListener('click', () => {
          populateEditModal(item);
        });

        col.querySelector('.delete-btn').addEventListener('click', () => {
          deletingItemId = item.id;
        });

        menuGrid.appendChild(col);
      });
    };

    // Live search typing listener
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMenuItems();
    });

    // Image upload preview in Add Modal
    addItemImgInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          addBase64Image = await readImageFile(file);
          addItemImgPreview.src = addBase64Image;
          addItemPreviewWrapper.classList.remove('d-none');
          addItemPlaceholder.classList.add('d-none');
        } catch (err) {
          console.error("Failed to read menu item image:", err);
        }
      }
    });

    // Submit Add Item form
    addItemForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('addItemName').value.trim();
      const desc = document.getElementById('addItemDesc').value.trim();
      const price = parseFloat(document.getElementById('addItemPrice').value);
      const cat = document.getElementById('addItemCategory').value;

      if (!name || !desc || isNaN(price) || !cat) {
        alert("Please fill in all fields correctly!");
        return;
      }

      const newItem = {
        id: Date.now(), // Unique numeric timestamp ID
        name,
        description: desc,
        price,
        category: cat,
        image: addBase64Image || 'https://placehold.co/600x400/5CA136/FFFFFF?text=' + encodeURIComponent(name)
      };

      menuItems.push(newItem);
      localStorage.setItem(MENU_KEY, JSON.stringify(menuItems));

      // Close Modal cleanly
      const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
      bootstrapModal.hide();

      // Reset forms and list rendering
      addItemForm.reset();
      addItemPreviewWrapper.classList.add('d-none');
      addItemPlaceholder.classList.remove('d-none');
      addBase64Image = '';

      renderMenuItems();
    });

    // Populate Edit fields on selecting Edit
    const populateEditModal = (item) => {
      editingItemId = item.id;
      document.getElementById('editItemName').value = item.name;
      document.getElementById('editItemDesc').value = item.description;
      document.getElementById('editItemPrice').value = item.price;
      document.getElementById('editItemCategory').value = item.category;

      editBase64Image = item.image;
      if (editBase64Image) {
        editItemImgPreview.src = editBase64Image;
        editItemPreviewWrapper.classList.remove('d-none');
        editItemPlaceholder.classList.add('d-none');
      } else {
        editItemPreviewWrapper.classList.add('d-none');
        editItemPlaceholder.classList.remove('d-none');
      }
    };

    // Image upload preview in Edit Modal
    editItemImgInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          editBase64Image = await readImageFile(file);
          editItemImgPreview.src = editBase64Image;
          editItemPreviewWrapper.classList.remove('d-none');
          editItemPlaceholder.classList.add('d-none');
        } catch (err) {
          console.error("Failed to read menu item edit image:", err);
        }
      }
    });

    // Submit Edit Item form
    editItemForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('editItemName').value.trim();
      const desc = document.getElementById('editItemDesc').value.trim();
      const price = parseFloat(document.getElementById('editItemPrice').value);
      const cat = document.getElementById('editItemCategory').value;

      if (!name || !desc || isNaN(price) || !cat || editingItemId === null) {
        alert("Please fill in all fields correctly!");
        return;
      }

      // Update in array
      menuItems = menuItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name,
            description: desc,
            price,
            category: cat,
            image: editBase64Image || 'https://placehold.co/600x400/5CA136/FFFFFF?text=' + encodeURIComponent(name)
          };
        }
        return item;
      });

      localStorage.setItem(MENU_KEY, JSON.stringify(menuItems));

      // Close modal
      const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
      bootstrapModal.hide();

      renderMenuItems();
    });

    // Confirm item delete button trigger
    confirmDeleteBtn.addEventListener('click', () => {
      if (deletingItemId !== null) {
        menuItems = menuItems.filter(item => item.id !== deletingItemId);
        localStorage.setItem(MENU_KEY, JSON.stringify(menuItems));

        const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('deleteItemModal'));
        bootstrapModal.hide();

        deletingItemId = null;
        renderMenuItems();
      }
    });

    // Navigation trigger via navbar "?add=true" query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true') {
      const modalEl = document.getElementById('addItemModal');
      const addModal = new bootstrap.Modal(modalEl);
      addModal.show();

      // Clean query parameter from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initialize list states
    renderCategoryFilters();
    renderMenuItems();
  }
});
