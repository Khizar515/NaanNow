# NaanNow Bug Fixes & Feature Enhancements – Implementation Plan

Comprehensive plan addressing all reported bugs across the Entire Project, Admin Panel, Restaurant Manager, Rider Panel, and Customer sections.

## User Review Required

> [!IMPORTANT]
> This is a very large set of changes spanning **~20 files** across frontend and backend. I recommend executing in batches (each section below is a batch) and verifying after each. Total estimated changes: **~1000+ lines modified/added**.

> [!WARNING]
> Some changes (like preventing back-button navigation after login) use `window.history.replaceState` which replaces browser history entries. This is standard practice but means the user genuinely cannot go back to the login page without typing the URL.

## Open Questions

> [!IMPORTANT]
> **Card Top-up Max**: You mentioned "card can go above 50k total and one topup can be max 20k or 15k." The backend already has a 50k cap. Should the single top-up limit be **15k** or **20k**? I'll default to **20k** unless you say otherwise.

---

## Proposed Changes

### 1. Entire Project – Prevent Back Navigation to Login

After login/register, the user should not be able to navigate back to `/login` via browser back button.

#### [MODIFY] [AuthContext.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/context/AuthContext.jsx)
- After `login()` and `register()`, call `window.history.replaceState(null, '', window.location.pathname)` to replace the login page in browser history.

#### [MODIFY] [AuthPage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AuthPage/AuthPage.jsx)
- Add a `useEffect` that checks if the user is already authenticated; if so, redirect to the appropriate dashboard using `navigate(path, { replace: true })` — this prevents the login page from being accessible via back button when already logged in.

---

### 2. Entire Project – Default Profile Icon

Replace random internet profile pics with a professional circle + icon avatar.

#### [MODIFY] [Navbar.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)
- In the desktop profile button (line ~232-234), check if `currentUser.profilePic` exists. If yes, render `<img>` in a circle. If no, render an SVG person icon inside a styled circle div.
- Same for the mobile profile icon button (line ~203-205).

#### [MODIFY] [ProfilePage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.jsx)
- Change `getAvatarUrl()` (line 256): instead of falling back to a random Unsplash URL, return `null`. When `null`, render a default SVG profile icon in a circle (`<div>` with border-radius 50%, background color, and person SVG icon).
- Update the sidebar avatar rendering (line ~276) to handle this.

---

### 3. Admin Panel – Search Bar Fix & Placeholder Update

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)
- **Line 1146**: Change placeholder from `"Global Search (Press Alt+D to navigate panels)..."` → `"Global Search..."`
- **Search bar not working**: The `globalSearch` state is set correctly (line 1148), and filtering functions (lines 879-977) do use it. The issue is the **dashboard tab doesn't filter by globalSearch** — only orders/restaurants/riders/customers tabs do. Fix: ensure the search filtering is applied consistently. Also, the search input is functional but the dashboard view doesn't show search results since it only shows stats. This is expected behavior — search filters data in sub-tabs. I'll add a visual indicator showing "Searching..." when globalSearch is active on the dashboard, and auto-switch to the relevant tab.

---

### 4. Admin Panel – Dashboard Cards with Real Data

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

Replace hardcoded percentages and trends in the stats cards (lines 1224-1322) with real computed values:

- **"Today's Revenue"** (line 1232): Replace `▲ 12.8%` and `"Compared to Rs. 21,700 yesterday"` → compute today's revenue vs yesterday's revenue from `orders` array, calculate actual % change.
- **"Today's Orders"** (line 1244): Replace `▲ 8.4%` → compute today's order count vs yesterday's.
- **"Active Riders"** (line 1256): Replace `▲ 14 online` → show actual approved rider count.
- **"Total Restaurants"** (line 1268): Replace `▲ +2 new` → count managers registered in the last 7 days.
- **"Active Customers"** (line 1280): Replace `▲ 24% YoY` → compute actual customer count growth.
- **"Cancelled Orders"** (line 1306): Replace `▼ 15% reduction` → compute actual % of cancelled orders.
- **"Monthly Growth"** (line 1317): Replace hardcoded `24.8%` → compute from orders data (this month vs last month).

---

### 5. Admin Panel – Graphs & Charts from Real Data

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

- **Daily Revenue Trend** (lines 808-870): Already computes from orders data, but falls back to mock data when no transactions exist (lines 839-848). Remove the mock fallback — if no data, show zero values.
- **Pie Chart** (lines 1483-1501): Currently hardcoded to 65%/15%/10%/10%. Compute actual percentages from `orders` array based on status distribution.
- **Live Activity Stream** (lines 331-336, 391-410): Remove the simulated event generation interval and the hardcoded initial activities. Instead, generate activities from actual recent orders, user registrations, and status changes in the database.

---

### 6. Admin Panel – Analytics Hub from Real Data

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

- **Peak Hours chart** (lines 2164-2171): Replace hardcoded `[25, 45, 15, 60, 95, 80, 40]` → compute from orders' `createdAt` timestamps, grouping by hour.
- **Top Selling Restaurants** (lines 2178-2191): Replace hardcoded restaurant rankings → compute from `orders` array, aggregating by restaurant and sorting by count/revenue.

---

### 7. Admin Panel – Full Details Visibility for Pending Restaurants

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

Expand the Restaurant Details Modal (lines 2575-2662) to show ALL manager-submitted details:

- Add: Restaurant Name, Address, Phone, Email, Maps Location
- Add: Logo preview, Cover Banner preview
- Add: Front Photo, Kitchen Photo, Dining Photo
- Add: Registration Cert, Food License, NTN Certificate
- Add: CNIC Number (text), CNIC Front/Back (images)
- Add: Bank Name, Holder Name (visible), Account Number (**hidden/excluded** per requirement)
- All document images should be clickable to zoom (using existing `setZoomedDoc`)
- This view should be available at **all times** (not just during pending approval) — i.e., the "Profile & Verification" button in the restaurants table always shows full details.

---

### 8. Admin Panel – Full Details for Rider Applications

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

Expand the Rider Details Modal (lines 2667-2730) to show ALL rider-submitted details:

- Add: Full Name, Date of Birth, Address, Phone, Email
- Add: CNIC Number (text)
- Add: License Number, Bike Registration, Bike Model, Bike Color
- Add: Rider Profile Picture (avatar)
- Add: Bank Name (visible), Account Number (**hidden/excluded**)
- Add: Wallet Number (EasyPaisa/JazzCash)
- Fix: Deliveries count in rider table (line 1809) — replace `Math.floor(Math.random() * 50 + 10)` with actual count from orders where `riderId` matches.
- Fix: Rating (line 1810) — use actual `rider.rating` from DB, fallback to `0` not `'4.8'`.

---

### 9. Restaurant Manager – Remove Auto-Fill Demo Button

#### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)

- Remove the `handleAutoFillWizard` function (lines 57-81).
- Remove the "⚡ Auto-fill Demo Data" button (line 416-418).

---

### 10. Restaurant Manager – CNIC & Phone Auto-Formatting

#### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)

Create a shared formatting utility and apply it:

- **CNIC format**: `XXXXX-XXXXXXX-X` (5 digits, dash, 7 digits, dash, 1 digit). Auto-add dashes after 5th and 13th characters. On backspace, if cursor is right after a dash with no digit following, remove dash and preceding digit.
- **Phone format**: `XXXX-XXXXXXX` (4 digits, dash, 7 digits). Auto-add dash after 4th digit.
- Apply to CNIC input (line 460) and restaurant phone input (line 547).

---

### 11. Restaurant Manager – Form Layout Fixes (Padding/Overflow)

#### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)

- **Step 1 CNIC images** (line 464): Add padding to the grid container `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>` — wrap with proper padding or add `padding-right` to prevent right overflow.
- **Step 2 Cover Banner** (line 562): Same fix — the `1fr 1fr` grid for logo and cover is touching the right edge. Add proper padding.
- **Step 3 Business Docs** (lines 597, 640, 683): The `1fr 1fr 1fr` grids overflow on the right. Fix by adding `box-sizing: border-box` and proper padding/width constraints.

#### [MODIFY] [RestaurantDashboard.css](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.css)
- Add `overflow: hidden; box-sizing: border-box;` to the status-card container and ensure all child grids respect parent boundaries.

---

### 12. Restaurant Manager – Proper File Upload & DB Storage

#### [MODIFY] [RestaurantDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RestaurantDashboard/RestaurantDashboard.jsx)

The current `handleWizardSubmit` (lines 88-118) sends base64 data URLs in FormData text fields. Fix:

- Store actual `File` objects from `handleFileChange` instead of reading as base64 data URLs.
- Append actual `File` objects to FormData so multer on the backend can process them as real file uploads.

#### [MODIFY] [upload.js](file:///home/gikiw/Desktop/NaanNow/backend/middleware/upload.js)

- Update the `destination` function to create **per-user subdirectories** inside `uploads/documents/`: e.g., `uploads/documents/{userId}/` so files from different restaurants/riders don't mix.

#### [MODIFY] [users.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/users.js)

- The upload-docs route (line 102) already handles files correctly with multer. After saving user docs to `pending`, also create/update a Restaurant entry in the database with all provided details and image paths (similar to what the approve action does, but in `pending` status).

---

### 13. Rider Panel – Remove Auto-Fill Demo Button

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)

- Remove the `handleAutoFillWizard` function (lines 97-115).
- Remove the "⚡ Auto-fill Demo Data" button (line 542-544).

---

### 14. Rider Panel – DOB Validation (Age ≥ 18)

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)

- Keep the DOB `<input type="date">` with `max` set to **today's date** (not 18 years ago) — the user can select any date.
- Add an `onChange` handler that:
  1. Calculates the user's age from the selected date.
  2. If age < 18, display a **warning message** below the DOB field (styled in red/orange) saying "You must be at least 18 years old to register as a rider."
  3. Set a state flag `isDobInvalid = true`.
- In the wizard step validation (line 749), block moving to step 2 if `isDobInvalid` is true, with the error message "You must be at least 18 years old."
- On the final submission (handleWizardSubmit), also validate the DOB age ≥ 18 before submitting.

---

### 15. Rider Panel – CNIC & Phone Auto-Formatting

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)

- Apply the same CNIC formatter to the rider's CNIC input (line 596).
- Apply phone formatter to the wallet number input (line 733).
- Use the same utility function created for the restaurant manager (shared or duplicated).

---

### 16. Rider Panel – CNIC Back Image Overflow Fix

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)

- The CNIC grid (line 600): `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>` — add `overflow: hidden; box-sizing: border-box;` and ensure parent has padding.

#### [MODIFY] [RiderDashboard.css](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.css)
- Add `overflow: hidden; box-sizing: border-box;` to the `.status-card` container.

---

### 17. Rider Panel – Real Data in Admin View

#### [MODIFY] [AdminDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/AdminDashboard/AdminDashboard.jsx)

- In the rider table (line 1809): Replace `Math.floor(Math.random() * 50 + 10)` with actual delivery count computed from orders where `riderId === rider._id` and status is `delivered`.
- In the rider table (line 1810): Replace `rider.rating || '4.8'` with `rider.rating || 0`.

---

### 18. Rider Panel – Proper File Upload & DB Storage

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx)

Same approach as Restaurant Manager:
- Store actual `File` objects from `handleFileChange` instead of base64.
- Append actual `File` objects to FormData.
- The backend `upload-docs` route already handles the multer fields correctly; the per-user directory fix in upload.js will ensure organized storage.

---

### 19. Customer – Profile Pic in Navbar & Profile

#### [MODIFY] [Navbar.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/components/Navbar/Navbar.jsx)

- Desktop profile button (line ~232-234): If `currentUser.profilePic` exists, show `<img src={currentUser.profilePic} style={{ width: 24, height: 24, borderRadius: '50%' }}>` instead of the SVG person icon.
- Mobile profile button (line ~203-205): Same treatment.

#### [MODIFY] [ProfilePage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.jsx)

- Already handles `profilePic` via `getAvatarUrl()`. Update fallback to use `profilePic` field (line 256-259): check `user.profilePic` first, then `user.avatar`, then render default SVG icon.

---

### 20. Customer – Card Form Placeholder Fix

#### [MODIFY] [ProfilePage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.jsx)

- **Line 458**: Change `{cardHolder.toUpperCase() || 'MUHAMMAD SAAD'}` → `{cardHolder.toUpperCase() || 'YOUR NAME'}`
- **Line 479**: Change `placeholder="Muhammad Saad"` → `placeholder="Name on Card"`

---

### 21. Customer – Card Top-Up Feature

#### [MODIFY] [ProfilePage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/ProfilePage/ProfilePage.jsx)

Add a top-up button and modal to each saved card:
- Add a "Top Up" button next to each card in the saved cards list (line ~530-550).
- Create a top-up modal with amount input, validation (max single top-up: 20k, total balance cannot exceed 50k).
- Call `api.topUpCard(cardId, amount)`.

#### [MODIFY] [api.js](file:///home/gikiw/Desktop/NaanNow/frontend/src/api.js)

- Add `topUpCard` API method calling `POST /api/cards/:id/topup`.

#### [MODIFY] [cards.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/cards.js)

- The top-up route already exists (line 54-84) with 50k max validation. Add validation for single top-up max (20k): `if (amount > 20000) return res.status(400).json({ message: 'Single top up cannot exceed Rs. 20,000' });`

---

### 22. Order Completion Flow – Rider Marks Delivered → Customer Confirms → Rating

This is a new feature requiring changes across backend and frontend.

**Current flow**: Rider clicks "Mark Delivered & Complete" → order goes to `delivered` → money transfers immediately → done.

**New flow**:
1. **Rider** clicks "Mark Delivered" → order status changes to `delivered` (rider says "I've handed over the food")
2. **Customer** sees a "Confirm Receipt" prompt on their Orders page → clicks it → order status changes to `completed`
3. **On completion**: Money is transferred to rider wallet (delivery fee) and manager wallet (order amount minus commission)
4. **Customer** is shown a **Rating & Review Modal** where they can:
   - Rate the **rider** (1–5 stars)
   - Rate the **restaurant** (1–5 stars)  
   - Write an **optional review** (text comment)
5. Rating data is stored on the Order, and average ratings are updated on both the Rider (User model) and Restaurant model.

---

#### [MODIFY] [Order.js](file:///home/gikiw/Desktop/NaanNow/backend/models/Order.js) (Backend Model)

- Add `'completed'` to the status enum: `enum: ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled']`
- Add `restaurantRating` and `restaurantReview` fields to the `ratingSchema`:
  ```js
  const ratingSchema = new mongoose.Schema({
    riderRating: { type: Number, min: 1, max: 5 },
    riderReview: { type: String },
    restaurantRating: { type: Number, min: 1, max: 5 },
    restaurantReview: { type: String },
    itemRatings: { type: Map, of: Number }
  });
  ```
- Add `customerConfirmedAt: { type: Date }` to track when customer confirmed receipt.

---

#### [MODIFY] [orders.js](file:///home/gikiw/Desktop/NaanNow/backend/routes/orders.js) (Backend Routes)

**Change the status update logic (line 116-158):**
- When rider sets status to `delivered`:
  - Do NOT transfer money yet. Just save the status and set `completedAt = new Date()`.
  - This marks the rider's part as done.
  
**Add a new route for customer to confirm receipt:**
```
PUT /api/orders/:id/confirm-receipt
```
- Restricted to `customer` role.
- Validates the order belongs to this customer and status is `delivered`.
- Sets status to `completed`, sets `customerConfirmedAt = new Date()`.
- **Transfers money**: rider gets delivery fee, manager gets order amount × (1 - commission%).
- Returns the updated order.

**Update the rate order route (line 178-212):**
- Allow rating only when status is `completed` (not just `delivered`).
- Accept `restaurantRating` and `restaurantReview` in addition to `riderRating` and `riderReview`.
- Update the **Restaurant model's average rating** in addition to the rider's rating:
  - Fetch all orders for this restaurant that have a `restaurantRating`, compute average, save to `Restaurant.rating`.

---

#### [MODIFY] [api.js](file:///home/gikiw/Desktop/NaanNow/frontend/src/api.js) (Frontend API)

Add new method:
```js
confirmReceipt: async (orderId) => {
  const res = await fetch(`${API_URL}/orders/${orderId}/confirm-receipt`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).message || await res.text());
  return res.json();
}
```

---

#### [MODIFY] [RiderDashboard.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/RiderDashboard/RiderDashboard.jsx) (Rider Side)

- **Line 483-493** (`handleCompleteOrder`): Change the button label from "Mark Delivered & Complete" to **"Mark as Delivered"**.
- Change the alert message from "🎉 Trip completed..." to **"📦 Order marked as delivered! The customer will confirm receipt shortly."**
- The rider's order now moves to the "History" tab with status `delivered` (not `completed` yet — it stays there until customer confirms).
- In the history tab, show status: `delivered` → "Awaiting Customer Confirmation", `completed` → "✅ Completed".

---

#### [MODIFY] [OrdersPage.jsx](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/OrdersPage/OrdersPage.jsx) (Customer Side)

- **Update `getOrderProgress`** (lines 8-25): Add handling for `delivered` status separately from `completed`:
  - `'delivered'` → Step 4 with label "Delivered – Confirm Receipt"
  - `'completed'` → Step 5 "Completed"

- **Add "Confirm Receipt" button**: When an order has status `delivered`, show a prominent "✅ Confirm Receipt" button in the order detail panel. On click:
  1. Call `api.confirmReceipt(orderId)`.
  2. On success, update local state.
  3. **Immediately show the Rating & Review Modal**.

- **Rating & Review Modal** (new component inline in OrdersPage):
  - Two sections:
    1. **Rate the Rider** — 5 clickable star icons + optional text review field
    2. **Rate the Restaurant** — 5 clickable star icons + optional text review field
  - "Submit Review" button → calls `api.rateOrder(orderId, { riderRating, riderReview, restaurantRating, restaurantReview })`.
  - "Skip" button → closes modal without rating.
  - Modal styled with glassmorphic backdrop, smooth animation, premium feel.

- **Show rating status on completed orders**: In the history section, if the order has been rated, show the stars. If not, show a "Rate this order" button that opens the rating modal.

---

#### [MODIFY] [OrdersPage.css](file:///home/gikiw/Desktop/NaanNow/frontend/src/pages/OrdersPage/OrdersPage.css)

- Add styles for the rating modal: backdrop, card, star icons (hover/active states with gold color), review textarea, submit/skip buttons.
- Add styles for the "Confirm Receipt" button (prominent green CTA).

---

## Verification Plan

### Automated Tests
- `cd backend && node -e "require('./server.js')"` — verify server starts without errors after model/route changes.

### Manual Verification
1. **Back button**: Register a new account → verify pressing browser Back doesn't return to login.
2. **Profile pics**: Create account → verify circle icon with person SVG shows in navbar and profile.
3. **Admin search**: Type in admin search bar → verify it filters data in Orders/Restaurants/Riders/Customers tabs.
4. **Admin dashboard stats**: Verify all percentages and metrics reflect actual database data.
5. **Admin charts**: Verify revenue chart, pie chart, peak hours, and top restaurants all reflect real order data.
6. **Admin restaurant details**: Click "Profile & Verification" on any restaurant → verify all documents and details visible (except bank account number).
7. **Admin rider details**: Click "Documents & Profile" on any rider → verify all documents and personal details visible (except bank details).
8. **Restaurant wizard**: Verify no "Auto-fill Demo Data" button, CNIC auto-dashes, phone auto-dashes, no overflow on any step.
9. **Rider wizard**: Verify no "Auto-fill Demo Data" button, DOB allows any date but warns if age < 18 and blocks form submission, CNIC auto-dashes, no overflow.
10. **File uploads**: Submit restaurant/rider verification → verify files saved in organized per-user subdirectories under `uploads/documents/{userId}/`.
11. **Card top-up**: Add card → click Top Up → verify amount constraints work and balance updates.
12. **Card placeholders**: Verify "Name on Card" placeholder instead of "Muhammad Saad".
13. **Order completion flow**: 
    - Place an order as customer → accept as rider → deliver as rider → verify status is "delivered" (not "completed")
    - Switch to customer → verify "Confirm Receipt" button appears → click it → verify status becomes "completed" and money transfers
    - Verify rating modal appears → rate rider and restaurant → verify ratings saved in DB
    - Verify rider's average rating and restaurant's average rating are updated
