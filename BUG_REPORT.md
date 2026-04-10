# 🐛 BUG REPORT - Phân Tích Tĩnh Mã Nguồn DA_CNPM
> **Phương pháp:** Static Code Analysis  
> **Ngày phân tích:** 2026-03-29 | **Tổng số bug:** 27

---

## 🔴 CRITICAL (Crash hoặc data sai nghiêm trọng)

---

### BUG-001 · `AdminChatbotRoutes` không được mount vào `routes/index.js`
- **File:** `backend/routes/index.js`
- **Triệu chứng:** `POST /api/admin-chatbot` → **404 Not Found** dù file route tồn tại
- **Test case FAIL:** TC_ADMINCHAT_001 đến TC_ADMINCHAT_005 (tất cả)
- **Sửa:**
```js
import adminChatbotRoutes from "./AdminChatbotRoutes.js";
routes.use("/admin-chatbot", adminChatbotRoutes);
```

---

### BUG-002 · `getRedisClient()` throw exception khi Redis offline → crash AI Agent
- **File:** `backend/config/redis.js` dòng 58-61
- **Triệu chứng:** Redis chưa khởi động → `redisChatService` gọi `getRedisClient()` → throw `Error('Redis client not initialized')` → **toàn bộ AI Agent trả 500**
- **Test case FAIL:** TC_AI_001 → TC_AI_030 (nếu Redis offline)
- **Sửa:** Trả `null` thay vì throw, caller kiểm tra null và fallback

---

### BUG-003 · `orderTools.createOrder()` không xóa giỏ hàng sau khi tạo đơn
- **File:** `backend/utils/ai-Agent/actions/orderTools.js` dòng 45-47
- **Triệu chứng:** Đặt hàng qua AI → đơn tạo thành công nhưng **giỏ hàng vẫn còn** → user đặt lại → đơn trùng
- **Test case FAIL:** TC_E2E_002
- **Sửa:**  
```js
await order.save();
await Cart.findOneAndDelete({ user: userId }); // ← thêm dòng này
```

---

### BUG-004 · `addFromLastViewed` không truyền `sessionId` → đọc sai session Redis
- **File:** `backend/utils/ai-Agent/actions/cartTools.js` dòng 301
- **Triệu chứng:** "lấy con thứ 2" → `getSessionMeta(userId)` không có sessionId → tạo session mới → `lastViewedProducts = []` → **Không tìm thấy sản phẩm**
- **Test case FAIL:** TC_AI_009, TC_AI_024
- **Sửa:**
```js
export async function addFromLastViewed({ userId, index = 1, quantity = 1, token, sessionId }) {
  const meta = await redisChat.getSessionMeta(userId, sessionId); // thêm sessionId
```

---

### BUG-005 · `DashboardController.getLatestUsers` trả về `password` hash trong response
- **File:** `backend/controller/DashboardController.js` dòng 101
- **Triệu chứng:** `GET /api/dashboard/latest-users` → **response chứa bcrypt hash password** của 5 user mới nhất
- **Test case FAIL:** TC_SEC_008, TC_DASH_006
- **Sửa:**
```js
const users = await User.find().sort({ createdAt: -1 }).limit(5)
  .select('-password -resetPasswordToken -resetPasswordExpires');
```

---

### BUG-006 · Auth shield của AI Agent bỏ sót nhiều từ khóa nhạy cảm
- **File:** `backend/utils/ai-Agent/agentCore.js` dòng 35-38
- **Triệu chứng:** User chưa đăng nhập nhắn "mua luôn" hoặc "đặt hàng" → **không bị chặn** (chỉ check "giỏ", "đơn hàng", "thêm vào giỏ")
- **Test case FAIL:** TC_AI_008 với một số lệnh biến thể
- **Sửa:**
```js
const AUTH_KEYWORDS = ["giỏ","đơn hàng","thêm vào giỏ","mua","thanh toán","đặt hàng","checkout","hủy đơn"];
const requiresAuth = AUTH_KEYWORDS.some(kw => normalizedMessage.toLowerCase().includes(kw));
```

---

## 🟠 HIGH (Sai logic, data không đúng)

---

### BUG-007 · `cartTools.addToCart` không kiểm tra tổng số lượng vượt stock khi cộng dồn
- **File:** `backend/utils/ai-Agent/actions/cartTools.js` dòng 40-41
- **Triệu chứng:** Cart có 5 iPhone (stock=6), AI thêm 3 → total=8 > 6, **không bị chặn, cart lưu số lượng vượt kho**
- **Test case FAIL:** TC_CART_003 (qua AI), TC_AI_007
- **Sửa:** Kiểm tra `newQty = existingQty + quantity; if (newQty > stock) throw Error...`

---

### BUG-008 · `vnpayController.vnpayReturn` crash `CastError` khi `orderId` không phải ObjectId
- **File:** `backend/controller/vnpayController.js` dòng 116
- **Triệu chứng:** Callback VNPay với `vnp_TxnRef` bị tamper không phải ObjectId → `Order.findById()` → **MongoDB CastError → HTTP 500**
- **Test case FAIL:** TC_VNP_005 (chữ ký sai + orderId lạ)
- **Sửa:** Validate `orderId` trước khi `findById`

---

### BUG-009 · `contextManager.processInput` — line 111 có thể crash `TypeError`
- **File:** `backend/utils/ai-Agent/contextManager.js` dòng 111
- **Triệu chứng:** `resolution.success=true` nhưng `resolution.product=undefined` → `console.log(resolution.product.name)` → **TypeError**
- **Test case FAIL:** TC_AI_023 (một số edge case)
- **Sửa:** `if (resolution?.product) console.log(resolution.product.name)`

---

### BUG-010 · `searchOrders` và `searchOrdersByUserName` không có middleware xác thực
- **File:** `backend/routes/OrderRoutes.js` dòng 26-27
- **Triệu chứng:** `GET /api/orders/search?query=DH` — **không cần token** → lộ toàn bộ đơn hàng + email khách hàng
- **Test case FAIL:** TC_SEC_009
- **Sửa:**
```js
router.get("/search", protect, admin, searchOrders);
router.get("/search-user", protect, admin, searchOrdersByUserName);
```

---

### BUG-011 · `cancelOrder` (AI Agent tool) không hoàn lại tồn kho khi `stockReduced=true`
- **File:** `backend/utils/ai-Agent/actions/orderTools.js` dòng 143
- **Triệu chứng:** Hủy đơn qua chat có `stockReduced=true` → `order.deleteOne()` không cộng lại stock → **kho bị mất vĩnh viễn**
- **Test case FAIL:** TC_E2E_007, TC_ORD_019 (qua AI)
- **Sửa:** Thêm logic hoàn kho trước `order.deleteOne()`

---

### BUG-012 · `updateUserProfile` cho phép đổi password mà không cần mật khẩu cũ
- **File:** `backend/controller/UserController.js` dòng 153-155
- **Triệu chứng:** `PUT /api/users/profile { password: "newpass" }` → **đổi mật khẩu bypass change-password flow**
- **Test case FAIL:** TC_SEC_004
- **Sửa:** Xóa block xử lý `req.body.password` khỏi `updateUserProfile`

---

### BUG-013 · `OrderController.deleteOrder` cho phép xóa đơn đã thanh toán
- **File:** `backend/controller/OrderController.js` dòng 279-313
- **Triệu chứng:** User gọi `DELETE /api/orders/:id` với đơn `isPaid=true` → **đơn bị xóa dù tiền đã trừ**
- **Test case FAIL:** TC_ORD_018 edge case
- **Sửa:** Thêm `if (order.isPaid && !req.user.isAdmin) return res.status(400)...`

---

## 🟡 MEDIUM (Edge case, UX xấu)

---

### BUG-014 · `DashboardController.getMonthlyRevenue` — group theo `paidAt` null xuất hiện bucket `_id: null`
- **File:** `backend/controller/DashboardController.js` dòng 33
- **Triệu chứng:** Đơn `isPaid=true` nhưng `paidAt=null` → bucket `_id: null` xuất hiện trong biểu đồ → **frontend chart lỗi**
- **Test case FAIL:** TC_DASH_003
- **Sửa:** Thêm `$match: { paidAt: { $exists: true, $ne: null } }`

---

### BUG-015 · URL reset password cứng `localhost:5173` thay vì biến môi trường
- **File:** `backend/controller/UserController.js` dòng 266
- **Triệu chứng:** Deploy production → email reset vẫn link về localhost
- **Test case FAIL:** TC_FP_006 (production), TC_FP_001 về đúng nhưng link sai
- **Sửa:** `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`

---

### BUG-016 · `addReview` không validate `rating` range ở controller → Mongoose ValidationError trả 500
- **File:** `backend/controller/ProductController.js` dòng 242
- **Triệu chứng:** `rating=10` → Mongoose throw ValidationError (min=1,max=5) → **HTTP 500 thay vì 400**
- **Test case FAIL:** TC_REV_003

---

### BUG-017 · `searchProducts` query field `brand` không tồn tại trong `ProductModel`
- **File:** `backend/utils/ai-Agent/actions/productTools.js` dòng 22-24  
- **Triệu chứng:** `$or` query có `{ brand: { $regex: keyword } }` nhưng schema không có `brand` → MongoDB không lỗi nhưng **tìm theo brand không bao giờ match**
- **Test case FAIL:** (silent bug, ảnh hưởng chất lượng tìm kiếm AI)

---

### BUG-018 · `CartController.addToCart` không validate `quantity <= 0`
- **File:** `backend/controller/CartController.js` dòng 26
- **Triệu chứng:** `quantity=-1` → `newQuantity = existing + (-1)` → pass → item trong giỏ có thể có số lượng âm
- **Test case FAIL:** TC_CART_003 edge case

---

### BUG-019 · `buildContents` push `system` messages với `role: "user"` vào Gemini context
- **File:** `backend/utils/ai-Agent/agentCore.js` dòng 338-340
- **Triệu chứng:** Session summary được truyền như **"user nói"** thay vì system instruction → Gemini nhầm lẫn context
- **Test case FAIL:** TC_AI_021 (memory/context accuracy)

---

### BUG-020 · `GEMINI_URL` dùng alias `gemini-flash-latest` có thể bị deprecate
- **File:** `backend/utils/ai-Agent/agentCore.js` dòng 11
- **Triệu chứng:** Google thay đổi alias → AI Agent fail 404 đột ngột
- **Đề xuất:** Dùng `GEMINI_MODEL` env var với giá trị cố định

---

## 🟢 LOW (Code smell, ít ảnh hưởng)

---

### BUG-021 · Middleware 404 đặt sau `app.listen()` trong callback MongoDB
- **File:** `backend/server.js` dòng 46-59
- **Triệu chứng:** Không crash nhưng khi `mongoose.connect` fail, middleware vẫn register (vô nghĩa)

---

### BUG-022 · `addFromLastViewed` — `meta = {}` khi Redis offline → `list = []` thay vì báo lỗi rõ ràng
- **File:** `backend/utils/ai-Agent/actions/cartTools.js` dòng 302

---

### BUG-023 · `CategoryRoutes` — cần kiểm tra có protect+admin cho CRUD không
- **Cần review:** `backend/routes/CategoryRoutes.js`

---

### BUG-024 · Không có rate limiting cho `POST /api/users/forgot-password`
- **File:** `backend/routes/UserRoutes.js`
- **Triệu chứng:** Có thể spam email → blast email provider
- **Test case FAIL:** TC_SEC_010

---

### BUG-025 · `server.js` không có `PATCH` trong CORS methods
- **File:** `backend/server.js` dòng 18
- **Triệu chứng:** Nếu frontend cần PATCH → CORS block (hiện tại chưa dùng PATCH)

---

### BUG-026 · `UserController.getUserOrders` (route `/api/users/order`) và `OrderController.getUserOrders` (route `/api/orders/me`) — logic trùng lặp, có thể drift
- **File:** Hai file controller

---

### BUG-027 · `getCartItemCount` trả HTTP 200 khi giỏ trống thay vì 404
- **File:** `backend/controller/CartController.js` dòng 264-266
- **Triệu chứng:** Test case TC_CART_017 mong đợi 200 + `{count:0}` — đây **thực ra đúng**, nhưng file test case gốc ghi "❌ HTTP 404" → **test case gốc sai** cần sửa

---

## 📊 TỔNG KẾT

| Mức độ | Số bug | Test Cases FAIL |
|--------|--------|-----------------|
| 🔴 Critical | 6 | ~35 TC |
| 🟠 High | 7 | ~18 TC |
| 🟡 Medium | 7 | ~10 TC |
| 🟢 Low | 7 | ~5 TC |
| **TỔNG** | **27** | **~68 TC** |

### Top 10 Test Cases FAIL nghiêm trọng nhất:

| # | Mã TC | Lý do FAIL | Bug |
|---|-------|-----------|-----|
| 1 | TC_ADMINCHAT_001~005 | Route không mount | BUG-001 |
| 2 | TC_AI_001~030 | Redis crash | BUG-002 |
| 3 | TC_AI_009, AI_024 | addFromLastViewed sai session | BUG-004 |
| 4 | TC_SEC_008 | Dashboard leak password | BUG-005 |
| 5 | TC_SEC_009 | Search orders không auth | BUG-010 |
| 6 | TC_E2E_002 | Giỏ không xóa sau đặt hàng | BUG-003 |
| 7 | TC_E2E_007 | Hủy đơn AI không hoàn kho | BUG-011 |
| 8 | TC_VNP_005 | vnpayReturn crash orderId | BUG-008 |
| 9 | TC_AI_008 | Auth shield yếu | BUG-006 |
| 10 | TC_SEC_004 | Bypass đổi pass | BUG-012 |

---
> *Static code analysis bởi Antigravity — 2026-03-29*
