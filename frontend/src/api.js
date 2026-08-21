const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('naannow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const getUploadHeaders = () => {
  const token = localStorage.getItem('naannow_token');
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  register: async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok){
      //throw new Error((await res.json()).message || await res.text());
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;
      throw new Error(data?.message || await res.text() || 'Registration failed');
    }
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  uploadAvatar: async (formData) => {
    const res = await fetch(`${API_URL}/auth/upload-avatar`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Restaurants
  getRestaurants: async () => {
    const res = await fetch(`${API_URL}/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },
  getRestaurantById: async (id) => {
    const res = await fetch(`${API_URL}/restaurants/${id}`);
    if (!res.ok) throw new Error('Failed to fetch restaurant');
    return res.json();
  },
  getMyRestaurant: async () => {
    const res = await fetch(`${API_URL}/restaurants/manager/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  createOrUpdateRestaurant: async (data) => {
    const res = await fetch(`${API_URL}/restaurants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  addMenuItem: async (restaurantId, formData) => {
    const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateMenuItem: async (restaurantId, itemId, formData) => {
    const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'PUT',
      headers: getUploadHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  deleteMenuItem: async (restaurantId, itemId) => {
    const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Orders
  createOrder: async (orderData) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getOrders: async () => {
    const res = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getOrderById: async (id) => {
    const res = await fetch(`${API_URL}/orders/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateOrderStatus: async (orderId, status, adminNotes) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, adminNotes })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  addOrderMessage: async (orderId, text) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  assignOrder: async (orderId) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  rateOrder: async (orderId, ratingData) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/rate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ratingData)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  confirmReceipt: async (orderId) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/confirm-receipt`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Users
  getAllUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getUserById: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateUserStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  rejectUser: async (id, reason) => {
    const res = await fetch(`${API_URL}/users/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  uploadDocs: async (formData) => {
    const res = await fetch(`${API_URL}/users/upload-docs`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Withdrawals
  getWithdrawals: async () => {
    const res = await fetch(`${API_URL}/withdrawals`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getMyWithdrawals: async () => {
    const res = await fetch(`${API_URL}/withdrawals/my`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  requestWithdrawal: async (amount, method) => {
    const res = await fetch(`${API_URL}/withdrawals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, method })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateWithdrawalStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/withdrawals/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Cards
  getCards: async () => {
    const res = await fetch(`${API_URL}/cards`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  addCard: async (data) => {
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  deleteCard: async (id) => {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  topUpCard: async (id, amount) => {
    const res = await fetch(`${API_URL}/cards/${id}/topup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Reviews
  addReview: async (data) => {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getReviewsByOrder: async (orderId) => {
    const res = await fetch(`${API_URL}/reviews/order/${orderId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Tickets
  getTickets: async () => {
    const res = await fetch(`${API_URL}/tickets`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getMyTickets: async () => {
    const res = await fetch(`${API_URL}/tickets/my`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  createTicket: async (subject, initialMessage, ticketType = 'general') => {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subject, initialMessage, ticketType })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  replyToTicket: async (id, text, adminAction = '') => {
    const res = await fetch(`${API_URL}/tickets/${id}/reply`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, adminAction })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  closeTicket: async (id, adminAction = '') => {
    const res = await fetch(`${API_URL}/tickets/${id}/close`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminAction })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateTicketStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/tickets/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Promotions
  getPromotions: async () => {
    const res = await fetch(`${API_URL}/promotions`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  createPromotion: async (data) => {
    const res = await fetch(`${API_URL}/promotions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  togglePromotion: async (id) => {
    const res = await fetch(`${API_URL}/promotions/${id}/toggle`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  validatePromo: async (code, basketTotal) => {
    const res = await fetch(`${API_URL}/promotions/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, basketTotal })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${API_URL}/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  getMyNotifications: async () => {
    const res = await fetch(`${API_URL}/notifications/my`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  sendNotification: async (data) => {
    const res = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_URL}/settings`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateSettings: async (data) => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Toggle Restaurant Open/Closed
  toggleRestaurantOpen: async (restaurantId, isOpen) => {
    const res = await fetch(`${API_URL}/restaurants/${restaurantId}/toggle-open`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isOpen })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Toggle Rider Online/Offline
  toggleRiderOnline: async (isOnline) => {
    const res = await fetch(`${API_URL}/users/toggle-online`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isOnline })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Revoke Approval
  revokeUser: async (id, reason) => {
    const res = await fetch(`${API_URL}/users/${id}/revoke`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Update User Status with blockReason
  updateUserStatusWithReason: async (id, status, blockReason) => {
    const res = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, blockReason })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  createCategory: async (name) => {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  updateCategory: async (id, data) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  },
  deleteCategory: async (id) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || await res.text());
    return res.json();
  }
};
