# Hướng dẫn kiểm tra API toàn tập bằng Postman cho dự án

Tài liệu này tổng hợp toàn bộ các API/Endpoint có trong dự án và hướng dẫn cách bạn có thể dễ dàng test chúng sử dụng Postman.

## 📝 1. Thiết lập chung

*   **Base URL:** `http://localhost:5000/api` (Giả sử bạn chạy server backend ở port 5000 cục bộ).
*   **Biến môi trường trong Postman (Environment Variables):** Bạn nên thiết lập các biến sau trong Postman để dễ dàng test.
    *   `{{base_url}}`: `http://localhost:5000/api`
    *   `{{token}}`: Lưu token ở đây sau khi bạn test API đăng nhập thành công.

### Thiết lập Authorization (Cấp quyền)
Nhiều API yêu cầu xác thực bằng Bearer Token. Trong Postman, với những API cần xác thực:
1. Chuyển sang tab **Authorization**
2. Type chọn **Bearer Token**
3. Mục Token: Điền `{{token}}` (sẽ được tự động lấy nếu bạn cấu hình ở mục đăng nhập).

---

## 👤 2. API Người dùng (Users) - `/api/users`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/register` | `POST` | Đăng ký người dùng mới | Trống |
| `/login` | `POST` | Đăng nhập hệ thống | Trống |
| `/profile` | `GET` | Lấy thông tin cá nhân | Bearer Token |
| `/profile` | `PUT` | Cập nhật hồ sơ cá nhân | Bearer Token |
| `/update-password` | `PUT` | Cập nhật mật khẩu | Bearer Token |
| `/order` | `GET` | Lấy danh sách đơn hàng đã mua của user | Bearer Token |
| `/forgot-password` | `POST` | Gửi email quên mật khẩu | Trống |
| `/reset-password/:token`| `POST` | Đặt lại mật khẩu | Trống |
| `/` | `GET` | Lấy danh sách tất cả người dùng | Admin Token |
| `/:id` | `GET` | Xem thông tin chi tiết một người dùng | Admin Token |
| `/:id` | `PUT` | Sửa vai trò, thông tin user | Admin Token |
| `/:id` | `DELETE`| Xóa người dùng | Admin Token |
| `/search?keyword=...` | `GET` | Tìm kiếm người dùng | Admin Token |

#### 🔑 Cách nhập Body trong Postman:

**1. Đăng ký (`POST /api/users/register`)**
*   **Body (raw JSON):**
    ```json
    {
      "name": "Nguyen Van A",
      "email": "nguyenvana@gmail.com",
      "password": "password123",
      "phone": "0987654321" 
    }
    ```

**2. Đăng nhập (`POST /api/users/login`)**
*   **Body (raw JSON):**
    ```json
    {
      "email": "nguyenvana@gmail.com",
      "password": "password123"
    }
    ```
*(Tip: Sau khi có Response trả về Token, hãy copy và paste nó vào biến `{{token}}`)*

---

## 🛍️ 3. API Sản phẩm (Products) - `/api/products`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/` | `GET` | Lấy danh sách sản phẩm | Trống |
| `/search?keyword=...`| `GET` | Tìm kiếm và lọc sản phẩm | Trống |
| `/:id` | `GET` | Lấy chi tiết sản phẩm qua ID | Trống |
| `/` | `POST` | Thêm sản phẩm mới (Có ảnh) | Admin Token |
| `/:id` | `PUT` | Sửa sản phẩm (Có ảnh) | Admin Token |
| `/:id` | `DELETE` | Xoá sản phẩm | Admin Token |
| `/:id/reviews` | `POST` | Thêm đánh giá cho sản phẩm | Bearer Token |
| `/:id/reviews` | `GET` | Lấy danh sách đánh giá của sản phẩm | Trống |

#### 🔑 Cách nhập Body trong Postman:

**1. Thêm / Sửa Sản Phẩm (`POST` hoặc `PUT`)**
*   Vì API này dùng CLOUDINARY upload ảnh, bạn KHÔNG dùng JSON, hãy chọn **Body -> form-data**:
    *   `name` (text): `Laptop Gaming`
    *   `price` (text): `20000000`
    *   `description` (text): `Mô tả laptop...`
    *   `countInStock` (text): `50`
    *   `category` (text): `64f1A2...` (ID danh mục)
    *   `image` (file): *Nhấn vào dropdown "Text", chọn "File" và upload 1 hình ảnh từ máy.*

**2. Thêm đánh giá (`POST /api/products/:id/reviews`)**
*   **Body (raw JSON):**
    ```json
    {
      "rating": 5,
      "comment": "Sản phẩm tuyệt vời!"
    }
    ```

---

## 🏷️ 4. API Danh mục (Categories) - `/api/categories`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/` | `GET` | Lấy danh sách danh mục | Trống |
| `/:id` | `GET` | Lấy thông tin 1 danh mục | Trống |
| `/` | `POST` | Thêm danh mục mới | Admin Token |
| `/:id` | `PUT` | Sửa danh mục | Admin Token |
| `/:id` | `DELETE`| Xoá danh mục | Admin Token |

#### 🔑 Cách nhập Body trong Postman:
*   **Thêm / Sửa Danh mục (`POST`, `PUT`) Body (raw JSON):**
    ```json
    {
      "name": "Điện thoại",
      "description": "Các loại điện thoại thông minh"
    }
    ```

---

## 🛒 5. API Giỏ hàng (Cart) - `/api/cart`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/` | `GET` | Xem giỏ hàng của user hiện tại | Bearer Token |
| `/count` | `GET` | Lấy tổng số lượng trong giỏ | Bearer Token |
| `/add` | `POST` | Thêm tính phẩm vào giỏ hàng | Bearer Token |
| `/update` | `PUT` | Cập nhật số lượng của KH | Bearer Token |
| `/:productId`| `DELETE`| Xóa một sản phẩm khỏi giỏ| Bearer Token |
| `/checkout` | `POST` | Thanh toán (Chuyển thành đơn hàng)| Bearer Token |

#### 🔑 Cách nhập Body trong Postman:

**1. Thêm vào giỏ (`POST /api/cart/add`)**
*   **Body (raw JSON):**
    ```json
    {
      "productId": "64f1A2...", 
      "quantity": 2
    }
    ```

**2. Cập nhật số lượng (`PUT /api/cart/update`)**
*   **Body (raw JSON):**
    ```json
    {
      "productId": "64f1A2...", 
      "quantity": 5
    }
    ```

**3. Checkout / Đặt hàng (`POST /api/cart/checkout`)**
*   **Body (raw JSON):** Thiết lập thông tin thanh toán, địa chỉ..
    ```json
    {
      "shippingAddress": {
        "address": "123 Đường abc",
        "city": "HCM",
        "postalCode": "700000",
        "country": "VN"
      },
      "paymentMethod": "Tiền mặt" 
    }
    ```

---

## 📦 6. API Đơn hàng (Orders) - `/api/orders`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/` | `POST` | Tạo đơn hàng mới | Bearer Token |
| `/me` | `GET` | Lấy danh sách đơn hàng của bạn | Bearer Token |
| `/:id` | `GET` | Xem chi tiết 1 đơn hàng | Bearer Token / Admin |
| `/:id/pay` | `PUT` | Đánh dấu đã thanh toán | Bearer Token |
| `/` | `GET` | (Admin) Xem TẤT CẢ đơn hàng | Admin Token |
| `/search` | `GET` | (Admin) Tìm kiếm đơn | Admin Token |
| `/search-user`|`GET`| (Admin) Tìm đơn theo user | Admin Token |
| `/:id/deliver`| `PUT` | (Admin) Cập nhật TT giao hàng | Admin Token |
| `/:id/status` | `PUT` | (Admin) Cập nhật TT đơn | Admin Token |
| `/:id` | `DELETE`| (Admin) Xoá đơn hàng | Admin Token |

#### 🔑 Cách nhập Body trong Postman:

**1. Tạo đơn hàng (`POST /api/orders`)**
*   **Body (raw JSON):**
    ```json
    {
      "orderItems": [
        {
           "product": "64f1A2...",
           "name": "Laptop",
           "image": "url_anh",
           "price": 20000000,
           "quantity": 1
        }
      ],
      "shippingAddress": {
        "address": "123 Quận 1", "city": "HCM", "postalCode": "12345", "country": "VM"
      },
      "paymentMethod": "VNPAY",
      "itemsPrice": 20000000,
      "taxPrice": 0,
      "shippingPrice": 50000,
      "totalPrice": 20050000
    }
    ```

**2. Cập nhật Status Admin (`PUT /api/orders/:id/status`)**
*   **Body (raw JSON):**
    ```json
    {
      "status": "Đang giao hàng"
    }
    ```

---

## 💳 7. API Thanh toán VNPay - `/api/vnpay`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/create` | `POST` | Tạo URL thanh toán VNPay | Bearer Token |
| `/return` | `GET` | CallBack từ VNPay báo kết quả | Trống |

**1. Tạo Payment (`POST /api/vnpay/create`)**
*   **Body (raw JSON):**
    ```json
    {
      "amount": 20050000,
      "orderId": "64f1B5..." 
    }
    ```
*   **Phản hồi kì vọng**: Trả về một URL đến trang sandbox/live của VNPAY.

---

## 📊 8. API Dashboard (Quản trị Admin) - `/api/dashboard`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/stats` | `GET` | Tổng quan (số KH, đơn hàng, DT)| Admin Token |
| `/monthly-revenue`| `GET` | Doanh thu theo tháng | Admin Token |
| `/top-products` | `GET` | Báo cáo Top sản phẩm bán chạy| Admin Token |
| `/latest-orders` | `GET` | Đơn hàng mới nhất | Admin Token |
| `/latest-users` | `GET` | Người dùng tham gia mới nhất | Admin Token |
| `/order-status` | `GET` | Thống kê số lượng TT đơn hàng| Admin Token |

*(Các endpoint này không cần body, chỉ cần Bearer Token của tài khoản Admin ở Header).*

---

## 🤖 9. API AI Agent (Chatbot) - `/api/ai-agent`

| Route | HTTP Method | Mô tả | Authorization |
| :--- | :---: | :--- | :--- |
| `/` | `POST` | Gửi tin nhắn và nhận phản hồi | Bearer Token |

**1. Chat (`POST /api/ai-agent/`)**
*   **Body (raw JSON):**
    ```json
    {
      "message": "Gợi ý cho mình vài cái laptop dưới 20 triệu",
      "sessionId": "chuoi-ki-tu-phien-lam-viec" 
    }
    ```
*(Truyền `sessionId` nếu bạn muốn giữ ngữ cảnh cuộc trò chuyện với bot. Nếu không, tạo mới)*
