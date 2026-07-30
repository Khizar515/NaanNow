# NaanNow Bug Fixes & Quality Improvements

Comprehensive plan to fix 8 reported bugs plus additional issues found during audit.

---

## Bug Analysis & Proposed Changes

### Bug 1: Rider registration → should ask for documents, not show "under review"

**Root Cause**: In [auth.js:29](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/auth.js#L29), when a rider registers, their status is set to `'pending'`. Then in [RiderDashboard.jsx:495-498](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx#L495-L498), the check `currentUser.status !== 'approved'` catches `pending` and shows the "Application Under Review" screen (line 501-524) because `isPending = true`. The rider never gets a chance to fill in document wizard.

**Fix**:
- Add a new status `'unverified'` to the User model's enum
- Set new rider/manager registrations to `status: 'unverified'` instead of `'pending'` in the auth register route
- In RiderDashboard and RestaurantDashboard, treat `'unverified'` as "needs to submit docs" (show wizard), `'pending'` as "documents submitted, under review", and `'rejected'` as "resubmit"

#### [MODIFY] [User.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/models/User.js)
- Add `'unverified'` to status enum: `enum: ['unverified', 'pending', 'approved', 'blocked', 'rejected']`
- Change default status to `'unverified'`

#### [MODIFY] [auth.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/auth.js)
- Line 29: Change `'pending'` → `'unverified'` for rider/manager registrations

#### [MODIFY] [RiderDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Line 495-498: Add `'unverified'` check. `unverified` & `rejected` show wizard; `pending` shows "Under Review"
- The wizard already exists in lines 526-770 but only shows for non-pending, non-approved states. We just need to adjust the conditional branching.

#### [MODIFY] [RestaurantDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Same changes as Rider: `unverified` & `rejected` show wizard, `pending` shows "Under Review"

---

### Bug 2: Restaurant manager sees blank white screen on login

**Root Cause**: In [RestaurantDashboard.jsx:207-208](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx#L207-L208), when `status === 'approved'` but `selectedRestaurant` is null (API call to `getMyRestaurant` fails because no restaurant exists for this manager), it shows an infinite loading state. This happens for newly approved managers or managers from seed data who don't have a restaurant entry in the DB (e.g. `sana@manager.com` is `pending` with no restaurant).

For `zainab@manager.com` (approved), the restaurant "Tandoori Flames" should be linked via `managerId`. But the check at line 207 causes a white screen if the API call at line 166 fails (e.g., error not caught properly leading to null state).

**Fix**:
- In RestaurantDashboard, handle the case where `getMyRestaurant()` fails more gracefully — show a setup prompt instead of infinite loading
- Ensure the `dashboard-loading` has proper visible styles (background color, text)

#### [MODIFY] [RestaurantDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Add `restaurantLoadError` state. When `getMyRestaurant()` fails, set error state and show a "No restaurant found. Contact admin." message instead of infinite loader.
- Add CSS class `dashboard-loading` proper styling

#### [MODIFY] [RestaurantDashboard.css](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.css)
- Add visible styling for `.dashboard-loading`

---

### Bug 3: Rider with approved status showing dummy data instead of database data

**Root Cause**: In [RiderDashboard.jsx:784-792](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx#L784-L792), the fallback values like `'Raja Kamran'`, `'Honda CD70'`, and `'ICT-9821'` are hardcoded as fallbacks. The actual data comes from `currentUser` which IS from the database (`api.getMe()`). The ternary `currentUser ? currentUser.name : 'Raja Kamran'` should always use `currentUser` since the dashboard only renders if `currentUser` is set. However, the `stats.rating` at line 256 is always hardcoded to `5.0`.

**Fix**:
- Remove hardcoded fallback names/data — use `currentUser.name` directly (since the component won't render without it)
- Use `currentUser.rating` from database for rating display

#### [MODIFY] [RiderDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Lines 784-792: Remove dummy fallbacks, use `currentUser` directly
- Line 186, 255-256: Use `currentUser.rating` from DB instead of hardcoded `5.0`

---

### Bug 4: Form submit buttons are white/invisible

**Root Cause**: Multiple buttons in the dashboard wizards and ProfilePage use CSS classes like `btn-primary`, `btn-logout`, and `btn-detail-view`. In the profile page specifically, the `btn-primary` buttons have proper styling in [ProfilePage.css](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.css#L207-L229). The issue is likely that some buttons lack explicit styling or inherit white background in certain contexts. Looking at the rider/restaurant wizards, the `btn-logout` class IS styled in [index.css:135-151](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/index.css#L135-L151) with orange background. But the `btn-detail-view` class used in wizards may not be defined.

**Fix**:
- Add missing `btn-detail-view` CSS class to index.css
- Ensure all form submit buttons across the app have visible, consistent styling
- Audit all button classes used in wizards and profile forms

#### [MODIFY] [index.css](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/index.css)
- Add `.btn-detail-view` styling with visible background and text colors

#### [MODIFY] [ProfilePage.css](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.css)
- Verify all button styles have proper colors (not white-on-white)

---

### Bug 5: General bugs audit

**Found issues**:

1. **Logout in rider/restaurant dashboards uses `localStorage.removeItem('naannow_currentUser')`** — This is the old localStorage key. The auth system now uses `naannow_token` and AuthContext. Fix all logout handlers.

2. **Rider orders query** in [orders.js:71-79](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/orders.js#L71-L79): The query uses `riderId: { $exists: false }` but the rider should also see `pending` and `preparing` orders (not just `ready_for_pickup`). Need to include unassigned orders across more statuses.

3. **Restaurant completed orders filter** in [RestaurantDashboard.jsx:215](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx#L215): Checking `o.status === 'Completed'` with capital C, but the backend uses lowercase `'delivered'`. This means metrics always show 0.

4. **Order message route missing** in server routes — `addOrderMessage` API exists in `api.js` but needs a route in `orders.js`.

#### [MODIFY] [RiderDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)
- Fix all `localStorage.removeItem('naannow_currentUser')` → use proper auth logout

#### [MODIFY] [RestaurantDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)
- Fix status comparisons to match backend enum values (lowercase `'delivered'` not `'Completed'`)
- Fix logout to use proper auth context

#### [MODIFY] [orders.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/routes/orders.js)
- Add message route for `POST /api/orders/:id/message`
- Fix rider query to also show `pending` and `preparing` orders that need a rider

---

### Bug 6: Admin panel — all actions use localStorage instead of API

**Root Cause**: The admin dashboard was partially migrated. Data is loaded from API (lines 276-306), but ALL action handlers (`handleApproveUser`, `handleConfirmRejection`, `handleSuspendUser`, `handleUnblockUser`, `handleCancelOrder`, `handleRefundOrder`, `handleCreatePromo`, `handleTogglePromoStatus`, `handleSendNotification`, `handleSaveSettings`, `handleSendSupportReply`, `handleProcessPayout`) still save to `localStorage` instead of calling API endpoints.

Also:
- `totalSales` uses `o.grandTotal` (old localStorage field) — should be `o.totalAmount`
- `activeOrdersCount` checks old status strings like `'Preparing'`, `'Baking'` — should match backend enums
- `getDailyRevenueData()` uses `o.date` (old) — should use `o.createdAt`
- Order filtering uses `o.id` — should be `o._id`
- `syncRestaurantData` function uses localStorage

**Fix**: Replace ALL admin action handlers with API calls. Fix all field name mismatches.

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)
- Replace `handleApproveUser` → call `api.updateUserStatus(id, 'approved')` then refresh
- Replace `handleConfirmRejection` → call `api.rejectUser(id, reason)` then refresh
- Replace `handleSuspendUser` → call `api.updateUserStatus(id, 'blocked')` then refresh
- Replace `handleUnblockUser` → call `api.updateUserStatus(id, 'approved')` then refresh
- Replace `handleCancelOrder` → call `api.updateOrderStatus(id, 'cancelled')` then refresh
- Replace `handleCreatePromo` → call `api.createPromotion(data)` then refresh
- Replace `handleTogglePromoStatus` → call `api.togglePromotion(id)` then refresh
- Replace `handleSendNotification` → call `api.sendNotification(data)` then refresh
- Replace `handleSaveSettings` → call `api.updateSettings(data)` then refresh
- Replace `handleSendSupportReply` → call `api.replyToTicket(id, text)` then refresh
- Replace `handleProcessPayout` → call `api.updateWithdrawalStatus(id, 'completed')` then refresh
- Fix all field name references: `grandTotal` → `totalAmount`, `o.id` → `o._id`, `o.date` → `o.createdAt`
- Fix status string comparisons to match backend enums
- Remove `syncRestaurantData` localStorage function
- Remove `handleRefundOrder` localStorage operations
- Add a `reloadAdminData()` helper to refresh state after mutations

---

### Bug 7: Navbar address should come from database

**Root Cause**: In [Navbar.jsx:21-23](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx#L21-L23), address is initialized from localStorage with fallback `'Street 11 Islamabad'`. Line 106-109 does sync from `currentUser.address` but doesn't handle empty/null addresses.

**Fix**:
- When `currentUser` exists but has empty/no address → show "Set your address"
- When no user is logged in → show "Deliver to..." or "Log in for delivery"
- Remove hardcoded `'Street 11 Islamabad'` fallback

#### [MODIFY] [Navbar.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- Update address initialization logic
- Show context-appropriate messages based on auth state

---

### Bug 8: Navbar recent addresses from database + detect location + auth guard

**Root Cause**: In [Navbar.jsx:320-333](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx#L320-L333), recent addresses are hardcoded. Detect location at line 36-39 is also hardcoded.

**Fix**:
- Fetch user's orders from API when opening address modal, extract unique `deliveryAddress` values
- Use browser Geolocation API for real location detection (reverse geocode with OpenStreetMap Nominatim)
- Don't show address modal at all if no user is logged in

#### [MODIFY] [Navbar.jsx](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- Add `recentAddresses` state loaded from user's order history via API
- Implement real geolocation with Nominatim reverse geocoding
- Guard address modal opening behind auth check

---

### Additional Seed Data Fixes

#### [MODIFY] [seed.js](file:///c:/Users/gikiw/OneDrive/Desktop/NaanNow/backend/seed.js)
- Add `address` field to customer demo user (for address display testing)
- Add more orders with varied `deliveryAddress` values for recent addresses feature
- Add `status: 'unverified'` for `sana@manager.com` and `ali@rider.com` (since they haven't submitted docs)
- Add a `Review` for seeded orders
- Add `Notification` seed data for admin notifications tab
- Add `Withdrawal` seed data for admin payments tab

---

## Verification Plan

### Manual Verification
1. Register as a new rider → verify document wizard appears (not "under review")
2. Submit documents → verify "under review" screen appears
3. Log in as admin → approve rider → verify rider can access dashboard
4. Log in as manager (`zainab@manager.com`) → verify dashboard loads (not blank)
5. Register new manager → verify document wizard
6. Log in as rider (`hamza@rider.com`, approved) → verify DB data shown (not dummy)
7. Check all form buttons are visible with proper colors
8. Test admin panel: verify all stats come from DB, all actions call API
9. Test navbar address: logged in shows DB address, empty shows placeholder, not logged in shows appropriate text
10. Test recent addresses in modal come from order history
11. Test "Detect My Location" button uses real geolocation

### Automated Tests
- No existing test suite found — verification will be manual

> [!IMPORTANT]
> This is a large change touching ~12 files across frontend and backend. The admin dashboard alone is ~2800 lines and needs significant refactoring of action handlers. I recommend executing in phases: Backend fixes first (model, routes, seed), then frontend fixes (dashboards, navbar, profile).
