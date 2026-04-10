# REQUIREMENT ANALYSIS DOCUMENT
## E-Commerce Web Application

| Field | Detail |
|---|---|
| Project Name | E-Commerce Web Application |
| Version | 1.0 |
| Date | 2026-03-27 |
| Author | QA Engineering Team |
| Status | Draft |

---

# 1. System Overview

## 1.1 Brief Description

The system is a full-stack e-commerce web application that allows customers to browse products, manage their cart, place orders, and make online payments via VNPay. Administrators can manage products, inventory, users, and orders through a dedicated dashboard.

**Technology Stack:**

| Layer | Technology |
|---|---|
| Frontend | React (TypeScript) |
| Backend | Node.js (Express) / ASP.NET Core |
| Database | MongoDB / SQL Server |
| Payment Gateway | VNPay |
| Authentication | JWT (JSON Web Token) |
| Cloud/Storage | Cloudinary / AWS S3 (for product images) |

## 1.2 Main User Roles

| Role | Description | Access Level |
|---|---|---|
| **Guest** | Unauthenticated visitor | Browse products, view product details, search/filter |
| **Customer** | Registered and logged-in user | All guest features + cart, checkout, orders, profile management |
| **Admin** | System administrator | Full access to admin dashboard: manage products, users, orders, inventory, reports |

---

# 2. Functional Requirements

## 2.1 Authentication

### 2.1.1 User Registration

**Description:** Allow new users to create an account on the system.

**Sub-functions:**

- `REG-01` — Fill in registration form: full name, email, password, confirm password, phone number
- `REG-02` — Validate all input fields (format, uniqueness)
- `REG-03` — Hash password before storing (bcrypt)
- `REG-04` — Send verification email upon successful registration (optional/recommended)
- `REG-05` — Redirect user to login page after successful registration
- `REG-06` — Display appropriate error messages for invalid or duplicate inputs

### 2.1.2 User Login

**Description:** Authenticate registered users and grant access to the system.

**Sub-functions:**

- `LOG-01` — Accept login via email + password
- `LOG-02` — Support Google OAuth2 login
- `LOG-03` — Validate credentials against database
- `LOG-04` — Issue JWT access token and refresh token upon successful login
- `LOG-05` — Store token in HTTP-only cookie or localStorage
- `LOG-06` — Redirect customer to homepage; redirect admin to dashboard
- `LOG-07` — Display error message on incorrect credentials
- `LOG-08` — Lock account after N consecutive failed login attempts (e.g., 5 attempts)

### 2.1.3 User Logout

**Description:** Terminate the user's authenticated session.

**Sub-functions:**

- `OUT-01` — Invalidate/expire the JWT token on the server side
- `OUT-02` — Clear token from client storage (cookie/localStorage)
- `OUT-03` — Redirect user to the login page or homepage

### 2.1.4 Password Management

**Description:** Allow users to reset or change their password.

**Sub-functions:**

- `PWD-01` — Request password reset via registered email
- `PWD-02` — Send password reset link with expiry token (15–60 minutes)
- `PWD-03` — Validate reset token before allowing new password entry
- `PWD-04` — Accept and validate new password
- `PWD-05` — Update password in database, invalidate old tokens
- `PWD-06` — Allow logged-in user to change password (requires old password confirmation)

---

## 2.2 Product Management

### 2.2.1 Product Browsing (Customer/Guest)

**Description:** Allow users to view products available in the system.

**Sub-functions:**

- `PRD-01` — Display product listing page with pagination
- `PRD-02` — Display product card: image, name, price, rating, stock status
- `PRD-03` — View product detail page: full description, images gallery, specifications, reviews
- `PRD-04` — Display related products section on product detail page
- `PRD-05` — Show real-time stock availability (In Stock / Out of Stock)

### 2.2.2 Product Management (Admin)

**Description:** Allow admin to create, update, and delete products.

**Sub-functions:**

- `ADM-PRD-01` — Create new product: name, description, category, price, discount price, images (multiple uploads), stock quantity, SKU
- `ADM-PRD-02` — Edit existing product information
- `ADM-PRD-03` — Soft-delete / hard-delete product
- `ADM-PRD-04` — Upload and manage product images (Cloudinary/S3)
- `ADM-PRD-05` — Set product status: Active / Inactive / Out of Stock
- `ADM-PRD-06` — Manage product categories (create, edit, delete category)
- `ADM-PRD-07` — Manage product variants (size, color, etc.)
- `ADM-PRD-08` — Bulk import products via CSV/Excel
- `ADM-PRD-09` — View product inventory and update stock quantity

### 2.2.3 Product Reviews & Ratings

**Description:** Allow customers to leave reviews and ratings on purchased products.

**Sub-functions:**

- `REV-01` — Customer can submit a review (1–5 stars + comment text) only after purchase
- `REV-02` — Display average rating and total review count on product cards and detail pages
- `REV-03` — Admin can delete inappropriate reviews
- `REV-04` — Prevent duplicate reviews: one review per product per user

---

## 2.3 Search & Filter

**Description:** Allow users to search and filter products.

**Sub-functions:**

- `SRC-01` — Full-text keyword search by product name, description, category
- `SRC-02` — Auto-suggest/autocomplete in search bar
- `SRC-03` — Filter by category
- `SRC-04` — Filter by price range (min – max)
- `SRC-05` — Filter by rating (e.g., 4 stars and above)
- `SRC-06` — Filter by availability (In Stock only)
- `SRC-07` — Sort results: Price Low–High, Price High–Low, Newest, Best Selling, Top Rated
- `SRC-08` — Combine multiple filters simultaneously
- `SRC-09` — Display result count and pagination
- `SRC-10` — Return "No products found" message when no results match

---

## 2.4 Cart Management

**Description:** Allow customers to manage their shopping cart before checkout.

**Sub-functions:**

- `CRT-01` — Add product to cart (specify quantity)
- `CRT-02` — View cart: list items with image, name, unit price, quantity, subtotal
- `CRT-03` — Update item quantity in cart (increase/decrease)
- `CRT-04` — Remove individual item from cart
- `CRT-05` — Clear entire cart
- `CRT-06` — Display cart total (subtotal, discount, shipping fee, grand total)
- `CRT-07` — Apply discount/coupon code
- `CRT-08` — Persist cart data for logged-in users (sync across sessions)
- `CRT-09` — Warn user if item stock becomes insufficient after adding to cart
- `CRT-10` — Prompt guest users to login/register before proceeding to checkout

---

## 2.5 Order Management

### 2.5.1 Checkout Process (Customer)

**Description:** Guide the customer through the order placement flow.

**Sub-functions:**

- `ORD-01` — Select or add shipping address
- `ORD-02` — Choose shipping method (Standard, Express)
- `ORD-03` — Select payment method (VNPay, Cash on Delivery)
- `ORD-04` — Review order summary before confirming
- `ORD-05` — Place order and receive order confirmation with order ID
- `ORD-06` — Receive order confirmation email/notification
- `ORD-07` — Validate stock availability at checkout time (re-check before placing)

### 2.5.2 Order Tracking (Customer)

**Description:** Allow customers to track the status of their orders.

**Sub-functions:**

- `TRK-01` — View order history list (all past orders)
- `TRK-02` — View order detail: items, quantities, shipping address, payment status, order status
- `TRK-03` — Track order status changes: `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` → `Cancelled`
- `TRK-04` — Cancel order if status is still `Pending`
- `TRK-05` — Request return/refund for delivered orders

### 2.5.3 Order Management (Admin)

**Description:** Allow admin to manage all customer orders.

**Sub-functions:**

- `ADM-ORD-01` — View all orders with filter/search by status, date, customer
- `ADM-ORD-02` — Update order status
- `ADM-ORD-03` — View order detail
- `ADM-ORD-04` — Process refund/cancellation requests
- `ADM-ORD-05` — Export orders to CSV/Excel
- `ADM-ORD-06` — View revenue reports and charts

---

## 2.6 Payment Integration (VNPay)

**Description:** Integrate VNPay payment gateway for online transactions.

**Sub-functions:**

- `PAY-01` — Generate VNPay payment URL with order details (amount, order ID, return URL)
- `PAY-02` — Redirect customer to VNPay payment portal
- `PAY-03` — Handle VNPay IPN (Instant Payment Notification) callback
- `PAY-04` — Verify payment response signature (HMAC-SHA512)
- `PAY-05` — Update order payment status upon successful payment: `Unpaid` → `Paid`
- `PAY-06` — Handle failed payments: redirect user to failure page, keep order in `Pending`
- `PAY-07` — Handle payment timeout/cancellation
- `PAY-08` — Display payment success/failure page with order summary
- `PAY-09` — Support Cash on Delivery (COD) as alternative payment method
- `PAY-10` — Store transaction ID from VNPay for reconciliation

---

## 2.7 User Profile Management

**Description:** Allow authenticated customers to manage their profile information.

**Sub-functions:**

- `PRF-01` — View and edit personal information (name, phone, avatar)
- `PRF-02` — Manage saved addresses (add, edit, delete, set default)
- `PRF-03` — Change password
- `PRF-04` — View order history
- `PRF-05` — View wishlist

---

## 2.8 Admin Dashboard Features

**Description:** Provide administrative features for system management.

**Sub-functions:**

- `ADM-01` — Dashboard overview: total revenue, orders today, new customers, top products
- `ADM-02` — Manage users: view list, deactivate, delete, change role
- `ADM-03` — Manage discount/coupon codes: create, edit, set expiry, usage limit
- `ADM-04` — Manage inventory: view and update stock levels
- `ADM-05` — View and respond to customer reviews
- `ADM-06` — Manage categories
- `ADM-07` — View order reports and charts
- `ADM-08` — Export data reports (orders, users, revenue)
- `ADM-09` — AI Agent integration for product assistance or customer support (if applicable)

---

# 3. Business Rules

## 3.1 Validation Rules

| Field | Rule |
|---|---|
| Email | Must be a valid email format (RFC 5322). Must be unique in the system. Max 255 characters. |
| Password | Minimum 8 characters. Must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character. |
| Confirm Password | Must exactly match the Password field. |
| Phone Number | Must be a valid Vietnamese phone number format: 10 digits, starting with `03`, `05`, `07`, `08`, `09`. |
| Full Name | Required. Max 100 characters. No special characters allowed except space and hyphens. |
| Product Name | Required. Max 255 characters. Must be unique within the same category. |
| Product Price | Must be a positive number (> 0). Max value: 999,999,999 VND. |
| Discount Price | Must be less than the original price. Cannot be negative. |
| Stock Quantity | Must be a non-negative integer (≥ 0). |
| Coupon Code | Must be alphanumeric. Max 20 characters. Must not be expired. |
| Review Rating | Must be an integer between 1 and 5. |
| Review Comment | Max 1000 characters. Cannot be empty. |

## 3.2 Cart & Checkout Rules

- A customer must be logged in to proceed to checkout.
- Maximum quantity per single product line item in cart: **99 units**.
- Cart must have at least **1 item** to proceed to checkout.
- If a product becomes out of stock between adding to cart and checkout, an error must be shown and checkout must be blocked.
- Stock is **reserved** (decremented) only after a successful payment confirmation, not at cart-add time.
- For COD orders, stock is reserved upon order confirmation.
- A coupon code can only be applied **once per order**.
- A coupon code cannot be applied after checkout has been initiated.

## 3.3 Payment Constraints

- Payment amount must match the order total at the time of payment generation.
- VNPay payment links expire after **15 minutes**.
- If payment fails, the order remains in `Pending` status; the customer may retry payment.
- Only one active VNPay transaction is allowed per order at a time.
- Refunds are processed manually by the admin (no automatic refund API in VNPay sandbox).
- Orders paid via VNPay cannot be cancelled after payment is confirmed.
- All VNPay responses must be verified using HMAC-SHA512 signature before any order update.

## 3.4 Product Constraints

- A product cannot be deleted if it has associated active orders; it must be deactivated instead.
- Stock quantity cannot go below **0**.
- Maximum allowed images per product: **8 images**.
- Maximum image file size: **5 MB** per image. Supported formats: JPG, JPEG, PNG, WEBP.
- A product must belong to at least one category.
- Inactive products are not visible to customers but remain accessible to admin.

## 3.5 Order Constraints

- An order can only be cancelled if its status is `Pending`.
- Order status must follow the sequence: `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`.
- Skipping statuses (e.g., `Pending` → `Shipped`) is not allowed.
- Refund/return requests can only be made within **7 days** of `Delivered` status.
- Order IDs must be unique system-wide and human-readable (e.g., `ORD-20260327-0001`).

## 3.6 Authorization Rules

| Feature | Guest | Customer | Admin |
|---|---|---|---|
| Browse Products | ✅ | ✅ | ✅ |
| Search & Filter | ✅ | ✅ | ✅ |
| View Product Detail | ✅ | ✅ | ✅ |
| Add to Cart | ❌ (redirect to login) | ✅ | ❌ |
| Place Order | ❌ | ✅ | ❌ |
| View Own Orders | ❌ | ✅ | ❌ |
| Write Review | ❌ | ✅ (purchased only) | ❌ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| Manage Products | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Manage Orders | ❌ | ❌ | ✅ |

---

# 4. Non-Functional Requirements

## 4.1 Performance

| Metric | Requirement |
|---|---|
| Page Load Time | Homepage and product listing must load within **2 seconds** under normal load |
| API Response Time | All API endpoints must respond within **500ms** for 95th percentile of requests |
| Search Response | Search queries must return results within **1 second** |
| Payment Redirect | VNPay redirect must occur within **3 seconds** of order confirmation |
| Concurrent Users | System must handle at least **500 concurrent users** without performance degradation |
| Database Query | No single query should exceed **200ms** under normal data volume |

## 4.2 Security

- **Authentication:** All protected routes must require a valid JWT access token.
- **JWT Tokens:**
  - Access token expiry: **15 minutes**
  - Refresh token expiry: **7 days**
  - Tokens must be signed with a strong secret key (minimum 256-bit entropy)
- **Password Storage:** Passwords must be hashed using **bcrypt** with a minimum salt rounds of **10**.
- **HTTPS:** All communications must occur over HTTPS in production.
- **CORS:** API must enforce strict CORS policy; only the frontend domain is whitelisted.
- **SQL Injection / NoSQL Injection:** All user inputs must be sanitized and parameterized queries used.
- **XSS:** All dynamic content must be escaped. Content Security Policy (CSP) headers must be set.
- **Rate Limiting:** Login and registration endpoints must be rate-limited (e.g., max 10 requests/minute per IP).
- **VNPay Security:** Payment responses must be verified using HMAC-SHA512 with the secret hash key.
- **Role-Based Access Control (RBAC):** Each API endpoint must enforce the minimum required role.
- **Sensitive Data:** No sensitive data (password, token, card info) should appear in logs.

## 4.3 Usability

- The UI must be **responsive** and function correctly on desktop, tablet, and mobile devices.
- Error messages must be clear, descriptive, and user-friendly (avoid raw technical errors).
- Form validation feedback must be inline and immediate (client-side + server-side).
- Loading indicators (spinners/skeletons) must be shown during API calls.
- The system must be accessible with keyboard navigation and support basic WCAG 2.1 Level AA compliance.
- All flow steps (registration, checkout, payment) must complete within **≤ 5 user actions**.

## 4.4 Scalability

- The backend must support horizontal scaling (stateless API design).
- JWT-based authentication ensures no server-side session state.
- Product images must be served through a CDN (Cloudinary/S3 + CloudFront) to reduce server load.
- Database must support indexing on frequently queried fields: `productId`, `userId`, `orderId`, `status`, `createdAt`.
- The system architecture should support microservices migration in the future.

## 4.5 Reliability & Availability

- System uptime target: **99.5%** (excluding planned maintenance).
- All critical operations (place order, payment) must use database transactions to ensure atomicity.
- Failed VNPay callbacks must trigger a retry mechanism (up to 3 retries).
- Automated database backups must occur daily.
- The system must handle third-party service outages (VNPay) gracefully with user-facing error messages.

---

# 5. API-Level Considerations

## 5.1 Authentication APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/logout` | Logout user | Yes (Customer) |
| POST | `/api/auth/refresh-token` | Issue new access token via refresh token | No (token in cookie) |
| POST | `/api/auth/forgot-password` | Send reset password email | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| PUT | `/api/auth/change-password` | Change password (logged-in) | Yes (Customer) |
| GET | `/api/auth/google` | Initiate Google OAuth2 login | No |
| GET | `/api/auth/google/callback` | Google OAuth2 callback handler | No |

## 5.2 Product APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/products` | Get all products (with pagination, filter, sort) | No |
| GET | `/api/products/:id` | Get product detail by ID | No |
| GET | `/api/products/search?q=` | Search products by keyword | No |
| POST | `/api/products` | Create new product | Yes (Admin) |
| PUT | `/api/products/:id` | Update product | Yes (Admin) |
| DELETE | `/api/products/:id` | Delete/deactivate product | Yes (Admin) |
| GET | `/api/categories` | Get all categories | No |
| POST | `/api/categories` | Create category | Yes (Admin) |
| PUT | `/api/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/api/categories/:id` | Delete category | Yes (Admin) |
| POST | `/api/products/:id/reviews` | Submit product review | Yes (Customer) |
| GET | `/api/products/:id/reviews` | Get product reviews | No |

## 5.3 Cart APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/cart` | Get current user's cart | Yes (Customer) |
| POST | `/api/cart/items` | Add item to cart | Yes (Customer) |
| PUT | `/api/cart/items/:itemId` | Update item quantity | Yes (Customer) |
| DELETE | `/api/cart/items/:itemId` | Remove item from cart | Yes (Customer) |
| DELETE | `/api/cart` | Clear entire cart | Yes (Customer) |
| POST | `/api/cart/coupon` | Apply coupon code | Yes (Customer) |
| DELETE | `/api/cart/coupon` | Remove coupon code | Yes (Customer) |

## 5.4 Order APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/orders` | Place a new order (checkout) | Yes (Customer) |
| GET | `/api/orders` | Get current customer's orders | Yes (Customer) |
| GET | `/api/orders/:id` | Get order detail | Yes (Customer/Admin) |
| PUT | `/api/orders/:id/cancel` | Cancel an order | Yes (Customer) |
| GET | `/api/admin/orders` | Get all orders (admin view) | Yes (Admin) |
| PUT | `/api/admin/orders/:id/status` | Update order status | Yes (Admin) |
| GET | `/api/admin/orders/export` | Export orders to CSV | Yes (Admin) |

## 5.5 Payment APIs

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/payment/vnpay/create` | Create VNPay payment URL | Yes (Customer) |
| GET | `/api/payment/vnpay/return` | Handle VNPay return URL (frontend redirect) | No |
| POST | `/api/payment/vnpay/ipn` | Handle VNPay IPN (server callback) | No (IP whitelist) |
| GET | `/api/payment/status/:orderId` | Get payment status for an order | Yes (Customer/Admin) |

---

# 6. Edge Cases

## 6.1 Authentication Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-AUTH-01 | User registers with an email already in the system | Return `409 Conflict` with message "Email already exists" |
| EC-AUTH-02 | User submits login with correct email but wrong password | Return `401 Unauthorized`, increment failed attempt counter |
| EC-AUTH-03 | User exceeds maximum failed login attempts (5) | Lock account temporarily, return `403 Forbidden` |
| EC-AUTH-04 | Access token is expired | Return `401 Unauthorized`, client must use refresh token |
| EC-AUTH-05 | Refresh token is expired or invalid | Return `401`, force user to log in again |
| EC-AUTH-06 | User uses password reset link after it has expired | Return error "Reset link expired or invalid" |
| EC-AUTH-07 | User submits password reset link that has already been used | Return error "Reset link has already been used" |
| EC-AUTH-08 | User logs in from a different device while already logged in elsewhere | Allow concurrent sessions (or implement single-session policy if needed) |
| EC-AUTH-09 | OAuth2 login with an email already registered via email/password | Merge accounts or return error "Email already registered via password login" |

## 6.2 Product Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-PRD-01 | Customer views a product that has just been set to Inactive | Return `404 Not Found` |
| EC-PRD-02 | Customer attempts to add an out-of-stock product to cart | Block the action, show "Out of Stock" message |
| EC-PRD-03 | Admin deletes a category that still has active products | Return `400 Bad Request`, require reassignment of products first |
| EC-PRD-04 | Admin uploads an image exceeding the 5 MB limit | Return `413 Payload Too Large` with descriptive error |
| EC-PRD-05 | Admin uploads an unsupported file type (e.g., PDF) as product image | Reject with `400 Bad Request` "Unsupported file format" |
| EC-PRD-06 | Two admins update the same product simultaneously | Implement optimistic locking or last-write-wins with warning |

## 6.3 Cart Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-CRT-01 | Customer adds same product to cart multiple times | Increase quantity of the existing line item |
| EC-CRT-02 | Customer sets item quantity to 0 in cart | Remove item from cart automatically |
| EC-CRT-03 | Cart item quantity exceeds available stock | Cap quantity to available stock, warn user |
| EC-CRT-04 | Cart item quantity exceeds max limit (99) | Cap at 99, display warning |
| EC-CRT-05 | Customer applies an expired coupon code | Return error "Coupon code has expired" |
| EC-CRT-06 | Customer applies a coupon code that has reached its usage limit | Return error "Coupon usage limit reached" |
| EC-CRT-07 | Product is removed from system while it is in a customer's cart | Display warning on cart page, prevent checkout for that item |
| EC-CRT-08 | Guest user tries to checkout | Redirect to login page, preserve cart intent via session |

## 6.4 Order Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-ORD-01 | Stock runs out between cart addition and order placement | Return `409 Conflict`, notify user of out-of-stock items |
| EC-ORD-02 | Customer attempts to cancel an order that is already `Shipped` | Return error "Order cannot be cancelled at this stage" |
| EC-ORD-03 | Customer submits duplicate order (double-click on Place Order) | Implement idempotency key to prevent duplicate order creation |
| EC-ORD-04 | Checkout initiated but user closes browser before payment | Order remains in `Pending` until payment timeout (15 min for VNPay) |
| EC-ORD-05 | Admin attempts to move order status backwards | Return `400 Bad Request` "Invalid status transition" |

## 6.5 Payment Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-PAY-01 | VNPay payment link expires (15 min) without payment | Order stays `Pending`; customer may request a new payment link |
| EC-PAY-02 | Customer completes payment but return URL fails to load | IPN callback ensures order status is updated; customer can verify via order history |
| EC-PAY-03 | VNPay IPN arrives with an invalid HMAC signature | Reject the callback, log the event, do NOT update order |
| EC-PAY-04 | VNPay IPN is received for an already-paid order | Ignore duplicate callback (idempotent handler), return `200 OK` to VNPay |
| EC-PAY-05 | Payment amount in VNPay response does not match order total | Reject the payment, flag order for manual review, alert admin |
| EC-PAY-06 | Customer refreshes payment success page multiple times | Idempotent handler; order should not be updated multiple times |
| EC-PAY-07 | VNPay service is completely unavailable | Display user-friendly error, offer COD as alternative, do not crash |

## 6.6 Admin Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-ADM-01 | Admin deactivates a user who has active pending orders | Orders remain active; account is deactivated, user cannot log in |
| EC-ADM-02 | Admin attempts to delete their own account | Prevent action; return error "Cannot delete your own admin account" |
| EC-ADM-03 | Admin bulk imports a CSV with duplicate/invalid product data | Report rows with errors, import valid rows, return error summary |
| EC-ADM-04 | Admin accesses dashboard while JWT is expired | Force re-login, redirect to login page |

## 6.7 Network & System Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| EC-SYS-01 | Database connection is lost during checkout | Return `503 Service Unavailable`, do not process payment |
| EC-SYS-02 | Image CDN (Cloudinary) is unavailable during product creation | Queue upload, return fallback placeholder image, retry asynchronously |
| EC-SYS-03 | Request payload exceeds size limit | Return `413 Payload Too Large` |
| EC-SYS-04 | API rate limit is exceeded by a client | Return `429 Too Many Requests` with `Retry-After` header |
| EC-SYS-05 | User navigates to a non-existent URL | Return custom `404 Not Found` page |
| EC-SYS-06 | Server-side error occurs unexpectedly | Return `500 Internal Server Error` with a generic message; log full stack trace internally |

---

*End of Requirement Analysis Document — v1.0*
*Generated: 2026-03-27 | For internal QA use only*
