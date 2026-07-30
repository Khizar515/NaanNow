# Make NaanNow 100% Dynamic — Full Backend Integration

## Problem Summary

The entire frontend uses **localStorage** for data storage. The goal is to make **everything** connected to the backend MongoDB database — zero localStorage for any data persistence. File uploads (profile photos, CNIC images, license docs, restaurant photos, menu item images) will use **multer** and be served from a static `uploads/` directory.

### Status Terminology Fix

Frontend will be updated to use **backend's exact status values** everywhere:

| Backend (Source of Truth) | Old Frontend (Remove) |
|---|---|
| `pending` | `Preparing` |
| `preparing` | `Baking` |
| `ready_for_pickup` | `Waiting for Rider` |
| `out_for_delivery` | `Delivering` / `Sent` |
| `delivered` | `Completed` |
| `cancelled` | `Cancelled` |

All frontend pages (OrdersPage, TrackOrderPage, CheckoutPage, RestaurantDashboard, RiderDashboard, AdminDashboard) will use these exact strings.

---

## Proposed Changes

### Phase 1: Backend — New Models

#### [NEW] [Ticket.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Ticket.js)
Support ticket model with embedded chat messages:
```js
{
  ticketNumber: String,        // "TK-102"
  customerId: ObjectId → User,
  subject: String,
  status: ['open', 'in_progress', 'resolved', 'closed'],
  priority: ['low', 'medium', 'high'],
  assignedTo: String,          // staff name
  chat: [{
    sender: ['customer', 'support'],
    text: String,
    time: Date
  }]
}
```

#### [NEW] [Promotion.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Promotion.js)
```js
{
  code: String (unique),
  discount: Number,
  type: ['percentage', 'flat'],
  minBasket: Number,
  maxDiscount: Number,
  status: ['active', 'expired']
}
```

#### [NEW] [Notification.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Notification.js)
```js
{
  title: String,
  body: String,
  image: String,
  target: ['all', 'customers', 'riders', 'managers'],
  sentAt: Date
}
```

#### [NEW] [Withdrawal.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Withdrawal.js)
```js
{
  userId: ObjectId → User,
  amount: Number,
  method: String,            // "Easypaisa", "Bank Transfer", "JazzCash"
  status: ['pending', 'completed', 'rejected'],
  transactionNumber: String  // "TXN-9023"
}
```

#### [NEW] [PlatformSettings.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/PlatformSettings.js)
Singleton document for global config:
```js
{
  commission: Number,        // percentage
  deliveryCharges: Number,
  taxes: Number,
  maintenanceMode: Boolean,
  backupInterval: String
}
```

---

### Phase 2: Backend — Expand Existing Models

#### [MODIFY] [User.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/User.js)
Add fields for rider/restaurant verification documents and profile:
```js
// Profile
phone: String,
profilePic: String,          // file path from multer upload
address: String,

// Rider verification documents
dob: Date,
cnicNumber: String,
cnicFront: String,           // uploaded image path
cnicBack: String,
licenseNumber: String,
licenseImage: String,
bikeRegistration: String,
bikeModel: String,
bikeColor: String,
avatar: String,
bankName: String,
accountNumber: String,
walletNumber: String,

// Manager verification documents
restaurantAddress: String,
city: String,
mapsLocation: String,
restaurantPhone: String,
restaurantEmail: String,
logo: String,                // uploaded image path
cover: String,
photoFront: String,
photoKitchen: String,
photoDining: String,
certDoc: String,
licenseDoc: String,
ntnDoc: String,
holderName: String,

// Status management
rejectionReason: String
```

#### [MODIFY] [Restaurant.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Restaurant.js)
Add fields:
```js
logo: String,
address: String,
city: String,
phone: String,
email: String,
status: ['pending', 'approved', 'suspended'], default: 'approved'
```

#### [MODIFY] [Order.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/Order.js)
Add fields:
```js
deliverySpeed: String,        // 'standard' | 'priority'
instructions: String,
phone: String,
name: String,                 // receiver name
dispatchedAt: Date,
completedAt: Date,
messages: [{                  // rider-customer chat
  sender: ['rider', 'customer'],
  text: String,
  time: Date
}],
adminNotes: String
```

---

### Phase 3: Backend — File Upload Middleware

#### [NEW] [upload.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/middleware/upload.js)
- Multer configuration with disk storage
- Save to `backend/uploads/` directory organized by type: `uploads/profiles/`, `uploads/documents/`, `uploads/menu/`, `uploads/restaurants/`
- File naming: `{userId}_{timestamp}_{originalname}`
- File type validation (images only: jpg, jpeg, png, webp)
- Size limit: 5MB per file

#### [MODIFY] [server.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/server.js)
- Serve static uploads: `app.use('/uploads', express.static('uploads'))`
- Register all new routes (tickets, promotions, notifications, withdrawals, settings)

---

### Phase 4: Backend — New Routes

#### [NEW] [tickets.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/tickets.js)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets` | Admin | Get all tickets |
| GET | `/api/tickets/my` | Customer | Get my tickets |
| POST | `/api/tickets` | Customer | Create a ticket |
| PUT | `/api/tickets/:id/reply` | Admin | Add support reply |
| PUT | `/api/tickets/:id/status` | Admin | Update ticket status |
| PUT | `/api/tickets/:id/assign` | Admin | Assign ticket to staff |

#### [NEW] [promotions.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/promotions.js)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/promotions` | Admin | Get all promos |
| POST | `/api/promotions` | Admin | Create a promo |
| PUT | `/api/promotions/:id/toggle` | Admin | Toggle active/expired |
| DELETE | `/api/promotions/:id` | Admin | Delete promo |
| POST | `/api/promotions/validate` | Customer | Validate a promo code at checkout |

#### [NEW] [notifications.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/notifications.js)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Admin | Get all sent notifications |
| POST | `/api/notifications` | Admin | Send/create a notification |

#### [NEW] [withdrawals.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/withdrawals.js)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/withdrawals` | Admin | Get all withdrawals |
| GET | `/api/withdrawals/my` | Manager/Rider | Get my withdrawals |
| POST | `/api/withdrawals` | Manager/Rider | Request withdrawal |
| PUT | `/api/withdrawals/:id/status` | Admin | Approve/reject withdrawal |

#### [NEW] [settings.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/settings.js)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/settings` | Admin | Get platform settings |
| PUT | `/api/settings` | Admin | Update platform settings |

---

### Phase 5: Backend — Modify Existing Routes

#### [MODIFY] [auth.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/auth.js)
- `PUT /api/auth/profile` — update name, phone, address (auth required)
- `PUT /api/auth/password` — change password (verify current, set new)
- `POST /api/auth/upload-avatar` — upload profile picture via multer

#### [MODIFY] [restaurants.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/restaurants.js)
- `GET /api/restaurants/manager/me` — get restaurant for logged-in manager
- `POST /api/restaurants/:id/menu` — add a menu item (with image upload)
- `PUT /api/restaurants/:id/menu/:itemId` — edit a menu item
- `DELETE /api/restaurants/:id/menu/:itemId` — delete a menu item

#### [MODIFY] [orders.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/orders.js)
- `GET /api/orders/:id` — get single order by ID (for tracking page)
- `POST /api/orders/:id/message` — add a chat message to order (rider↔customer)

#### [MODIFY] [cards.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/cards.js)
- `GET /api/cards` — list all active cards for logged-in user

#### [MODIFY] [reviews.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/reviews.js)
- `GET /api/reviews/order/:orderId` — get reviews for an order

#### [MODIFY] [users.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/users.js)
- `PUT /api/users/:id/reject` — reject with reason (admin)
- `POST /api/users/upload-docs` — upload verification documents (rider/manager) via multer
- `GET /api/users/:id` — get single user details (admin)

---

### Phase 6: Backend — Seed Script

#### [MODIFY] [seed.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/seed.js)
- Seed all 6 restaurants from static data (not just 2)
- Seed demo tickets, promotions, withdrawals
- Seed admin user + demo customers, riders, managers
- Seed platform settings singleton
- Seed sample orders with proper ObjectId references

---

### Phase 7: Frontend — API Layer (Complete Rewrite)

#### [MODIFY] [api.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/api.js)
Complete expansion — every backend route gets a corresponding function:

**Auth:** `login`, `register`, `getMe`, `updateProfile`, `changePassword`, `uploadAvatar`
**Restaurants:** `getRestaurants`, `getRestaurantById`, `getMyRestaurant`, `createOrUpdateRestaurant`, `addMenuItem`, `updateMenuItem`, `deleteMenuItem`
**Orders:** `createOrder`, `getOrders`, `getOrderById`, `updateOrderStatus`, `addOrderMessage`
**Users:** `getAllUsers`, `getUserById`, `updateUserStatus`, `rejectUser`, `uploadDocs`, `withdraw`
**Cards:** `getCards`, `addCard`, `deleteCard`, `topUpCard`
**Reviews:** `addReview`, `getReviewsByOrder`
**Tickets:** `getTickets`, `getMyTickets`, `createTicket`, `replyToTicket`, `updateTicketStatus`, `assignTicket`
**Promotions:** `getPromotions`, `createPromotion`, `togglePromotion`, `deletePromotion`, `validatePromo`
**Notifications:** `getNotifications`, `sendNotification`
**Withdrawals:** `getWithdrawals`, `getMyWithdrawals`, `requestWithdrawal`, `updateWithdrawalStatus`
**Settings:** `getSettings`, `updateSettings`
**Upload:** `uploadFile` — generic file upload helper

---

### Phase 8: Frontend — Auth Context

#### [NEW] [AuthContext.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Context/AuthContext.jsx)
- JWT token stored in localStorage (only thing in localStorage — the auth token)
- User object fetched from backend and stored in React state
- `login(email, password)` → stores token, fetches user
- `register(userData)` → stores token, fetches user
- `logout()` → clears token and user
- `refreshUser()` → re-fetches user data
- Auto-login on mount if token exists
- `isAuthenticated`, `user`, `loading` state
- Role helpers: `isAdmin`, `isRider`, `isManager`, `isCustomer`

#### [MODIFY] [main.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/main.jsx)
- Wrap with `AuthProvider`

#### [MODIFY] [CartContext.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Context/CartContext.jsx)
- Use `_id` (string) instead of numeric `id` for item matching
- Store `restaurantId` as MongoDB ObjectId string

---

### Phase 9: Frontend — Connect All Pages (Zero localStorage)

#### [MODIFY] [AuthPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/AuthPage/AuthPage.jsx)
- Call `api.login()` / `api.register()` via AuthContext
- Remove all localStorage user management code (~170 lines of localStorage logic)
- On register as rider/manager, redirect to respective dashboard for verification

#### [MODIFY] [Navbar.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- Use AuthContext for `currentUser` instead of localStorage
- Logout calls `auth.logout()` which clears JWT token
- Dynamic greeting with real user name
- Remove hardcoded "Muhammad Saad" default user creation

#### [MODIFY] [HomePage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/HomePage/HomePage.jsx)
- Pass AuthContext user name to HeroBanner dynamically

#### [MODIFY] [RestaurantGrid.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/RestaurantGrid/RestaurantGrid.jsx)
- Fix to use `restaurant._id` instead of `restaurant.id`
- Remove `getIsRestaurantActive` localStorage check — backend handles restaurant status
- Navigate using `_id`

#### [MODIFY] [RestaurantPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantPage/RestaurantPage.jsx)
- Fetch from `api.getRestaurantById(id)` instead of localStorage/static data
- Use `item._id` for cart operations
- Remove `TOP_RESTAURANTS` import

#### [MODIFY] [CheckoutPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/CheckoutPage/CheckoutPage.jsx)
- Pre-fill user info from AuthContext
- Call `api.createOrder()` to save order to MongoDB
- Use backend status values (`pending`, not `Preparing`)
- Promo validation via `api.validatePromo(code)` against backend

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/OrdersPage/OrdersPage.jsx)
- Fetch from `api.getOrders()` instead of localStorage + MOCK_ORDERS
- Remove all mock data (~50 lines)
- Use backend status strings for display and filtering
- Use `order._id` for navigation and selection
- Populate restaurant name from backend (already populated in orders route)

#### [MODIFY] [TrackOrderPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/TrackOrderPage/TrackOrderPage.jsx)
- Fetch from `api.getOrderById(orderId)`
- Poll for status updates periodically
- Use backend statuses for step display
- Display rider info from order's populated `riderId`

#### [MODIFY] [ProfilePage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.jsx)
- Profile data from AuthContext + `api.getMe()`
- Profile edit via `api.updateProfile()`
- Profile photo upload via `api.uploadAvatar(file)` using multer
- Password change via `api.changePassword(current, new)`
- Cards: `api.getCards()`, `api.addCard()`, `api.deleteCard()`
- Orders history: `api.getOrders()` filtered for completed
- Remove all localStorage reads/writes

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)
- **Users**: `api.getAllUsers()`, `api.updateUserStatus()`, `api.rejectUser()`
- **Orders**: `api.getOrders()` (admin sees all), `api.updateOrderStatus()`
- **Restaurants**: `api.getRestaurants()` 
- **Tickets**: `api.getTickets()`, `api.replyToTicket()`, `api.updateTicketStatus()`, `api.assignTicket()`
- **Promotions**: `api.getPromotions()`, `api.createPromotion()`, `api.togglePromotion()`
- **Notifications**: `api.getNotifications()`, `api.sendNotification()`
- **Withdrawals**: `api.getWithdrawals()`, `api.updateWithdrawalStatus()`
- **Settings**: `api.getSettings()`, `api.updateSettings()`
- **Analytics/Map**: Keep simulated live map & analytics (these are UI simulations, not persistent data)
- Remove all `localStorage.getItem/setItem` data operations
- View rider/manager uploaded documents (CNIC, license, photos) from stored file paths

#### [MODIFY] [RestaurantDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Load restaurant via `api.getMyRestaurant()`
- Orders via `api.getOrders()` (manager sees own restaurant orders)
- Order status updates via `api.updateOrderStatus()`
- Menu CRUD via `api.addMenuItem()`, `api.updateMenuItem()`, `api.deleteMenuItem()` — with image upload
- **Verification wizard**: Upload documents via `api.uploadDocs(formData)` — saves CNIC, restaurant photos, certificates, bank info to User model. Status changes to `pending` after submission.
- Remove all localStorage operations

#### [MODIFY] [RiderDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Available orders via `api.getOrders()` (rider sees `ready_for_pickup` + own orders)
- Accept order via `api.updateOrderStatus(orderId, 'out_for_delivery')` which assigns `riderId`
- Complete delivery via `api.updateOrderStatus(orderId, 'delivered')`
- Chat messages via `api.addOrderMessage(orderId, text)`
- **Verification wizard**: Upload documents via `api.uploadDocs(formData)` — saves CNIC, license, bike photos, avatar, bank info to User model
- Wallet/earnings from `user.walletBalance` in AuthContext
- Remove all localStorage operations

#### [MODIFY] [FavoritesPage.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/FavoritesPage/FavoritesPage.jsx)
- Works via RestaurantGrid — uses `_id` for favorites matching

#### [MODIFY] [App.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/App.jsx)
- Remove `TOP_RESTAURANTS` import
- Use AuthContext for route guarding

#### Files that need minor updates for `_id`:
- [CartSideBar.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Cart%20Side%20Bar/CartSideBar.jsx) — use `_id`
- [Hero-Banner.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Hero-Banner/Hero-Banner.jsx) — dynamic user name
- [CuisineCircles.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/CuisineCircles/CuisineCircles.jsx) — no data changes needed

---

### Phase 10: Backend Package Dependencies

#### [MODIFY] [package.json](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/package.json)
- Add `multer` for file uploads

---

## File Upload Strategy

| Upload Type | Route | Storage Path | Max Size |
|---|---|---|---|
| Profile avatar | `POST /api/auth/upload-avatar` | `uploads/profiles/` | 5MB |
| Menu item image | `POST /api/restaurants/:id/menu` | `uploads/menu/` | 5MB |
| Rider docs (CNIC, license, avatar) | `POST /api/users/upload-docs` | `uploads/documents/` | 5MB each |
| Manager docs (CNIC, logo, cover, photos, certs) | `POST /api/users/upload-docs` | `uploads/documents/` | 5MB each |

All uploaded files served via `http://localhost:5000/uploads/...`

---

## Rating System

- Customer submits review via `POST /api/reviews` after delivery
- Review includes `rating` (1-5) per product
- Backend can aggregate restaurant ratings from reviews
- Rider ratings stored on User model, updated on delivery completion

---

## Verification / Approval Flow

### Rider Verification:
1. Rider registers → status = `pending`
2. Rider fills verification wizard → uploads CNIC, license, bike photos, avatar → `POST /api/users/upload-docs` → status stays `pending`
3. Admin views uploaded documents in AdminDashboard → fetched from user record
4. Admin approves (`PUT /api/users/:id/status` → `approved`) or rejects (`PUT /api/users/:id/reject` with reason)
5. Rider dashboard checks status on load — shows pending/rejected/approved UI

### Restaurant Manager Verification:
1. Manager registers → status = `pending`
2. Manager fills verification wizard → uploads CNIC, restaurant photos, certificates, bank info → `POST /api/users/upload-docs` → status stays `pending`
3. On approval, backend auto-creates Restaurant document linked to manager
4. Admin approves/rejects via same user status routes

---

## Verification Plan

### Automated Tests
```bash
# Seed the database
cd backend && node seed.js

# Start backend
npm start

# Test key endpoints
curl http://localhost:5000/api/restaurants
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"saad@naannow.com","password":"password123"}'
```

### Manual End-to-End Test Flows
1. **Customer flow**: Register → browse restaurants → add to cart → checkout → view orders → track order → leave review
2. **Rider flow**: Register → fill verification → admin approves → see available orders → accept → pick up → deliver → complete
3. **Manager flow**: Register → fill verification → admin approves → see orders → update status → manage menu (add/edit/delete items with images)
4. **Admin flow**: Login → view dashboard stats → approve/reject riders & managers (view uploaded documents) → manage orders → manage tickets → create promos → send notifications → manage withdrawals → update settings
5. **Profile flow**: Update name/phone → upload avatar → change password → add/remove cards
6. **Wallet flow**: Manager/rider earns from deliveries → wallet balance updates → withdraw to card
