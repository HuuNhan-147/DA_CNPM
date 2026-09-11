# Danh Mục Đặc Tả Công Cụ AI Agent (Agent Tools Specification)

Tài liệu này cung cấp bảng đặc tả chi tiết 100% của toàn bộ **15 Tools** đang hoạt động trong hệ thống AI Agent E-Commerce, bao gồm cấu trúc Schema đầu vào, đầu ra, ranh giới domain, yêu cầu xác thực và ánh xạ giữa WebMCP Client và Server Local Service.

---

## 1. Bảng Tổng Hợp 15 Tools

| STT | Tên Tool (`name`) | Phân Nhóm (`Domain`) | Cần Đăng Nhập (`requiresAuth`) | WebMCP Tool (Client) | Local Service (Server) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | `search_products` | `PRODUCT` | Không | `productMcpTools.ts` | `ProductService.searchProducts` |
| 2 | `get_product_detail` | `PRODUCT` | Không | `productMcpTools.ts` | `ProductService.getProductById` |
| 3 | `add_to_cart` | `CART` | Có | `cartMcpTools.ts` | `CartService.addToCart` |
| 4 | `add_from_last_viewed` | `CART` | Có | *Ủy quyền search + add* | `CartService.addToCart` |
| 5 | `get_cart` | `CART` | Có | `cartMcpTools.ts` | `CartService.getCartByUserId` |
| 6 | `remove_from_cart` | `CART` | Có | `cartMcpTools.ts` | `CartService.removeFromCart` |
| 7 | `update_cart` | `CART` | Có | `cartMcpTools.ts` | `CartService.updateCartItem` |
| 8 | `get_cart_count` | `CART` | Có | `cartMcpTools.ts` | `CartService.getCartItemCount` |
| 9 | `create_order` | `ORDER` | Có | `orderMcpTools.ts` | `CartService.checkout` & `OrderService` |
| 10 | `get_order_detail` | `ORDER` | Có | `orderMcpTools.ts` | `OrderService.getOrderById` |
| 11 | `get_user_orders` | `ORDER` | Có | `orderMcpTools.ts` | `OrderService.getOrdersByUserId` |
| 12 | `cancel_order` | `ORDER` | Có | `orderMcpTools.ts` | `OrderService.cancelOrder` |
| 13 | `create_vnpay_payment` | `PAYMENT` | Có | `paymentMcpTools.ts` | `VnPayService.createPaymentUrl` |
| 14 | `get_user_profile` | `PROFILE` | Có | `userMcpTools.ts` | `UserService.getUserProfile` |
| 15 | `update_user_profile` | `PROFILE` | Có | `userMcpTools.ts` | `UserService.updateUserProfile` |

---

## 2. Chi Tiết Từng Công Cụ

### 2.1. Nhóm Sản Phẩm (PRODUCT Domain)

#### 1. `search_products`
* **Mục đích:** Tìm kiếm danh sách sản phẩm theo từ khóa, danh mục hoặc khoảng giá.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "keyword": { "type": "string", "description": "Từ khóa tìm kiếm (tên, hãng...)" },
      "category": { "type": "string", "description": "ID danh mục (tùy chọn)" },
      "minPrice": { "type": "number", "description": "Giá tối thiểu" },
      "maxPrice": { "type": "number", "description": "Giá tối đa" }
    },
    "required": ["keyword"]
  }
  ```
* **Output:** `{ success: true, products: Array<IProduct>, count: number }`

#### 2. `get_product_detail`
* **Mục đích:** Xem thông tin kỹ thuật, mô tả chi tiết và tồn kho của sản phẩm.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "description": "ID định danh sản phẩm" }
    },
    "required": ["productId"]
  }
  ```
* **Output:** `{ success: true, product: IProduct }`

---

### 2.2. Nhóm Giỏ Hàng (CART Domain)

#### 3. `add_to_cart`
* **Mục đích:** Thêm sản phẩm vào giỏ hàng của khách hàng.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "description": "ID sản phẩm" },
      "quantity": { "type": "number", "description": "Số lượng (mặc định 1)" }
    },
    "required": ["productId"]
  }
  ```
* **Output:** `{ success: true, message: "Đã thêm vào giỏ hàng", cart: ICart }`

#### 4. `add_from_last_viewed`
* **Mục đích:** Thêm sản phẩm mà khách vừa xem hoặc vừa hỏi ("thêm con này vào giỏ").
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "index": { "type": "number", "description": "Vị trí trong danh sách (bắt đầu từ 1)" },
      "quantity": { "type": "number", "description": "Số lượng" }
    }
  }
  ```

#### 5. `get_cart`
* **Mục đích:** Xem toàn bộ các mặt hàng hiện có trong giỏ của người dùng.
* **Input Schema:** `{ "type": "object", "properties": {} }`
* **Output:** `{ success: true, cart: { items: [...], totalPrice: number } }`

#### 6. `remove_from_cart`
* **Mục đích:** Xóa một mặt hàng ra khỏi giỏ hàng.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "description": "ID sản phẩm cần xóa" }
    },
    "required": ["productId"]
  }
  ```

#### 7. `update_cart`
* **Mục đích:** Thay đổi số lượng mua của một sản phẩm trong giỏ.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "description": "ID sản phẩm" },
      "quantity": { "type": "number", "description": "Số lượng mới (>= 0)" }
    },
    "required": ["productId", "quantity"]
  }
  ```

#### 8. `get_cart_count`
* **Mục đích:** Lấy tổng số lượng mặt hàng trong giỏ để hiển thị huy hiệu (Badge).
* **Input Schema:** `{ "type": "object", "properties": {} }`
* **Output:** `{ success: true, count: number }`

---

### 2.3. Nhóm Đơn Hàng (ORDER Domain)

#### 9. `create_order`
* **Mục đích:** Tạo đơn hàng mới từ giỏ hàng hiện tại (Checkout).
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "shippingAddress": {
        "type": "object",
        "properties": {
          "fullname": { "type": "string" },
          "phone": { "type": "string" },
          "address": { "type": "string" },
          "city": { "type": "string" }
        },
        "required": ["fullname", "phone", "address", "city"]
      },
      "paymentMethod": { "type": "string", "enum": ["COD", "VNPay", "MoMo"] }
    },
    "required": ["shippingAddress"]
  }
  ```
* **Output:** `{ success: true, message: "Đặt hàng thành công", order: IOrder }`

#### 10. `get_order_detail`
* **Mục đích:** Tra cứu tình trạng, tiến trình giao hàng và địa chỉ nhận hàng theo mã đơn hoặc ID.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "orderIdentifier": { "type": "string", "description": "Mã đơn hàng (orderCode) hoặc ID đơn" }
    },
    "required": ["orderIdentifier"]
  }
  ```

#### 11. `get_user_orders`
* **Mục đích:** Liệt kê danh sách các đơn hàng trong lịch sử của người dùng.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "limit": { "type": "number", "description": "Số đơn tối đa (mặc định 10)" },
      "page": { "type": "number", "description": "Số trang" }
    }
  }
  ```

#### 12. `cancel_order`
* **Mục đích:** Hủy đơn hàng khi chưa chuyển trạng thái giao hàng hoặc thanh toán.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "orderIdentifier": { "type": "string", "description": "Mã đơn hàng cần hủy" },
      "reason": { "type": "string", "description": "Lý do hủy" }
    },
    "required": ["orderIdentifier"]
  }
  ```

---

### 2.4. Nhóm Thanh Toán (PAYMENT Domain)

#### 13. `create_vnpay_payment`
* **Mục đích:** Sinh URL cổng thanh toán trực tuyến VNPay cho đơn hàng cụ thể.
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "orderIdentifier": { "type": "string", "description": "Mã hoặc ID đơn hàng cần thanh toán" },
      "bankCode": { "type": "string", "description": "Mã ngân hàng (NCB, VCB... - không bắt buộc)" },
      "language": { "type": "string", "enum": ["vn", "en"] }
    },
    "required": ["orderIdentifier"]
  }
  ```
* **Output:** `{ success: true, paymentUrl: string, orderCode: string, totalPrice: number }`

---

### 2.5. Nhóm Tài Khoản Người Dùng (PROFILE Domain)

#### 14. `get_user_profile`
* **Mục đích:** Lấy thông tin tài khoản người dùng đang đăng nhập.
* **Input Schema:** `{ "type": "object", "properties": {} }`
* **Output:** `{ success: true, profile: { id, name, email, phone, role } }`

#### 15. `update_user_profile`
* **Mục đích:** Chỉnh sửa thông tin liên hệ của người dùng (tên, số điện thoại, email).
* **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "updates": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Họ tên mới" },
          "phone": { "type": "string", "description": "Số điện thoại mới" }
        }
      }
    },
    "required": ["updates"]
  }
  ```
