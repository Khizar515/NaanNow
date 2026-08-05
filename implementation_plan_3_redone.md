# NaanNow Bug Fixes — 8 Bugs Across Backend & Frontend

Comprehensive plan to fix all 8 reported bugs based on the reference [implementation_plan_3.md](file:///home/gikiw/Desktop/NaanNow/implementation_plan_3.md) and current codebase audit.

---

## Proposed Changes

### Phase 1: Backend Fixes

---

#### Bug 1: Rider registration shows "under review" instead of document wizard

**Root Cause**: [auth.js:29](file:///home/gikiw/Desktop/NaanNow/backend/routes/auth.js#L29) sets rider/manager to `'pending'` on register. Then both dashboards treat `pending` as "under review" — the rider never gets a chance to fill in the document wizard.

##### [MODIFY] [User.js](file:///home/gikiw/Desktop/NaanNow/backend/models/User.js)
- Add `'unverified'` to status enum: `['unverified', 'pending', 'approved', 'blocked', 'rejected']`
- Change default status to `'unverified'`

##### [MODIFY] [auth.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/auth.js)
- Line 29: Change `'pending'` → `'unverified'` for rider/manager registrations

##### [MODIFY] [seed.js](file:///home/gikiw/Desktop/NaanNow/backend/seed.js)
- Set `ali@rider.com` (pending → stay pending, simulates already submitted docs)
- Set `sana@manager.com` (pending → `'unverified'` to match new flow for testing)
- Add `address` field to customer demo user for navbar display testing

---

#### Bug 5.2: Rider orders query too restrictive

**Root Cause**: [orders.js:73](file:///home/gikiw/Desktop/NaanNow/backend/routes/orders.js#L73) only shows `ready_for_pickup` with no rider. Should also show `pending` and `preparing` unassigned orders.

##### [MODIFY] [orders.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/orders.js)
- Update rider query to: `status: { $in: ['pending', 'preparing', 'ready_for_pickup'] }, riderId: { $exists: false }` (plus their own assigned orders)
- Also fix `riderId: { $exists: false }` → add `$or` with `riderId: null` (MongoDB stores unset ObjectId refs as `null`, not as missing keys)

#### Bug 5.4: Order message route missing

##### [MODIFY] [orders.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/orders.js)
- Add `POST /api/orders/:id/message` route for the `addOrderMessage` API in [api.js:157-165](file:///home/gikiw/Desktop/NaanNow/frontend/src/api.js#L157-L165)

---

### Phase 2: Frontend — Dashboard Fixes

---

#### Bug 1 (frontend): Rider/Restaurant dashboards — wizard vs pending logic

##### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Lines 495-498: Adjust status branching:
  - `'pending'` → show "Under Review" screen (docs already submitted)
  - `'unverified'` or `'rejected'` → show document wizard
  - `'approved'` → show full dashboard (existing behavior)

##### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Lines 363-365: Same branching as rider — `'unverified'` & `'rejected'` show wizard, `'pending'` shows "Under Review"

---

#### Bug 2: Restaurant manager blank white screen

**Root Cause**: [RestaurantDashboard.jsx:207-208](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx#L207-L208) shows infinite loading if `getMyRestaurant()` fails.

##### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Add `restaurantLoadError` state
- When `getMyRestaurant()` fails, show a "No restaurant found — Contact admin" message instead of infinite loader
- Add proper `.dashboard-loading` CSS

##### [MODIFY] [RestaurantDashboard.css](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.css)
- Add `.dashboard-loading` styles (centered, visible background and text)

---

#### Bug 3: Rider showing dummy data instead of DB data

##### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Lines 784-792: Remove hardcoded fallbacks (`'Raja Kamran'`, `'Honda CD70'`, `'ICT-9821'`) — use `currentUser.name`, `currentUser.vehicleDetails`, `currentUser.licensePlate` directly
- Lines 186, 251-256: Use `currentUser.rating` from DB for the rating stat instead of hardcoded `5.0`

---

#### Bug 4: Form submit buttons are white/invisible

**Root Cause**: `.btn-detail-view` class used in wizard forms but never defined in any CSS file. `.form-group-field` only defined in AuthPage.css, not globally.

##### [MODIFY] [index.css](file:///home/gikiw/Desktop/NaanNow/frontend/src/index.css)
- Add `.btn-detail-view` styling (visible background, border, proper text color)
- Add `.form-group-field` styling globally (so wizard forms render correctly outside AuthPage)
- Add `.dashboard-loading` styling globally

---

#### Bug 5.1 & 5.3: Logout uses old localStorage key + status string mismatches

##### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Lines 519, 765: Replace `localStorage.removeItem('naannow_currentUser')` → `localStorage.removeItem('naannow_token')` in all logout handlers

##### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Lines 387, 737: Same logout fix
- Line 215: Fix `o.status === 'Completed'` → `o.status === 'delivered'`
- Line 216: Fix active order status strings from `['Preparing', 'Baking', ...]` → `['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery']`
- Line 217: Fix `o.grandTotal` → `o.totalAmount`
- Line 870: Fix Active count in sub-tab header to use correct lowercase statuses

---

#### Bug 6: Admin panel uses localStorage instead of API

> [!IMPORTANT]
> The admin dashboard is ~2839 lines. All action handlers (`handleApproveUser`, `handleConfirmRejection`, `handleSuspendUser`, `handleUnblockUser`, `handleCancelOrder`, `handleRefundOrder`, `handleCreatePromo`, `handleTogglePromoStatus`, `handleSendNotification`, `handleSaveSettings`, `handleSendSupportReply`, `handleProcessPayout`) currently save to `localStorage` instead of calling API endpoints.

##### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)
- Add `reloadAdminData()` helper function to refetch all data from API after mutations
- Replace `handleApproveUser` → call `api.updateUserStatus(userId, 'approved')` then `reloadAdminData()`
- Replace `handleConfirmRejection` → call `api.rejectUser(userId, reason)` then `reloadAdminData()`
- Replace `handleSuspendUser` → call `api.updateUserStatus(userId, 'blocked')` then `reloadAdminData()`
- Replace `handleUnblockUser` → call `api.updateUserStatus(userId, 'approved')` then `reloadAdminData()`
- Replace `handleCancelOrder` → call `api.updateOrderStatus(orderId, 'cancelled')` then `reloadAdminData()`
- Replace `handleRefundOrder` → similarly use API
- Replace `handleCreatePromo` → call `api.createPromotion(data)` then `reloadAdminData()`
- Replace `handleTogglePromoStatus` → call `api.togglePromotion(id)` then `reloadAdminData()`
- Replace `handleSendNotification` → call `api.sendNotification(data)` then `reloadAdminData()`
- Replace `handleSaveSettings` → call `api.updateSettings(data)` then `reloadAdminData()`
- Replace `handleSendSupportReply` → call `api.replyToTicket(id, text)` then `reloadAdminData()`
- Replace `handleProcessPayout` → call `api.updateWithdrawalStatus(id, 'completed')` then `reloadAdminData()`
- Fix `handleLogout` → use `localStorage.removeItem('naannow_token')` instead of old key
- Remove `syncRestaurantData` localStorage function entirely
- Fix field references: `o.grandTotal` → `o.totalAmount`, `o.id` → `o._id`, `o.date` → `o.createdAt`
- Fix status string comparisons: `'Preparing'` → `'preparing'`, `'Cancelled'` → `'cancelled'`, etc.
- Remove DB export/restore localStorage functions (they operate on stale keys)

---

### Phase 3: Navbar Fixes

---

#### Bug 7: Navbar address should come from database

##### [MODIFY] [Navbar.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- Line 21-23: Initialize address from `currentUser.address` if available, fallback to `'Add your address'` if empty, or `'Deliver to...'` if not logged in. Remove hardcoded `'Select Address'` fallback.
- Update `useEffect` at line 105-110 to properly handle empty/null addresses: show "Set your address" when `currentUser` exists but `address` is empty

#### Bug 8: Recent addresses from database + detect location + auth guard

##### [MODIFY] [Navbar.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- Remove hardcoded recent addresses array at lines 320-324
- Add `recentAddresses` state, fetch from user's order history via `api.getOrders()` on address modal open, extract unique `deliveryAddress` values
- Replace fake `handleDetectLocation` at lines 35-39: use browser `navigator.geolocation.getCurrentPosition()` + reverse geocode via Nominatim API (`https://nominatim.openstreetmap.org/reverse`)
- Guard address modal: don't open if not logged in (redirect to login instead)
- Save address to DB when user saves via `api.updateProfile({ address })`

---

## Verification Plan

### Manual Verification
1. Register as new rider → verify document wizard appears (not "under review")
2. Submit docs → verify "under review" screen
3. Log in as admin → approve rider → verify rider dashboard loads
4. Log in as manager (`zainab@manager.com`) → verify dashboard loads (not blank)
5. Register new manager → verify document wizard
6. Log in as rider (`hamza@rider.com`, approved) → verify DB data shown, not dummy
7. Check all form buttons are visible with proper styling
8. Admin panel: verify approve/reject/block actions call API
9. Navbar: logged-in user with address shows DB address, empty shows "Set your address"
10. Test recent addresses come from order history
11. Test "Detect My Location" uses real geolocation

### Automated Tests
- No existing test suite — verification will be manual
