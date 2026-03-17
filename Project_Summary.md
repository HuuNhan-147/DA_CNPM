# Tóm tắt Dự án: Đồ án Công nghệ phần mềm (DA_CNPM)

Đây là một dự án ứng dụng Web Fullstack Thương mại điện tử (E-commerce) với kiến trúc bao gồm Backend (Node.js) và Frontend (React) cùng với các tính năng tích hợp thanh toán trực tuyến và trợ lý ảo AI.

## Cấu trúc tổng quan
Dự án được tổ chức thành một monorepo gồm hai nhánh chính:
- **`backend/`**: Mã nguồn API Server xử lý logic nghiệp vụ, cơ sở dữ liệu và tích hợp các dịch vụ bên thứ 3.
- **`frontend/`**: Mã nguồn giao diện người dùng (User Interface), được thiết kế dưới dạng Single Page Application (SPA).

## 1. Công nghệ sử dụng

### Backend
- **Nền tảng/Ngôn ngữ:** Node.js, Express.js.
- **Cơ sở dữ liệu:** MongoDB (sử dụng Mongoose ORM).
- **Bộ nhớ đệm (Cache) & Service lưu trữ tạm thời:** Redis (Sử dụng `redis`, `connect-redis`).
- **Bảo mật & Xác thực:** JWT (`jsonwebtoken`), mã hóa mật khẩu (`bcrypt`, `bcryptjs`).
- **Upload File:** `multer`.
- **Gửi Email:** `nodemailer`.
- **Cổng thanh toán:** tích hợp vào `vnpayRoutes.js`.
- **Công nghệ nổi bật khác:** Google Generative AI (`@google/genai`) được sử dụng để tích hợp Chatbot hoặc AI Agent.

### Frontend
- **Framework/Thư viện chính:** React 19 (viết bằng TypeScript - `.tsx`).
- **Trình đóng gói:** Vite.
- **Quản lý trạng thái (State Management):** Redux Toolkit, React Query (TanStack Query), Zustand.
- **Định tuyến (Routing):** React Router DOM.
- **Giao diện & Styling:** TailwindCSS, kết hợp với các Icon từ `lucide-react` và `react-icons`.
- **Xử lý Form & Validate:** React Hook Form và thư viện Yup.
- **Gọi API:** Axios.
- **Thông báo UI:** SweetAlert2, React Toastify.

## 2. Các thực thể dữ liệu (Models) chính
Theo cấu trúc Database của Backend, hệ thống quản lý dữ liệu với các đối tượng sau:
- **User:** Người dùng trên hệ thống, xác thực, thông tin cá nhân.
- **Product:** Sản phẩm, mức giá, mô tả.
- **Category:** Danh mục chứa sản phẩm.
- **Cart:** Giỏ hàng cho người dùng mua sắm.
- **Order:** Hóa đơn/ Đơn đặt hàng.

## 3. Các luồng chức năng và Trang chính
Dự án hỗ trợ các module chức năng toàn diện cho một hệ thống E-commerce hiện đại:

- **Quản lý tài khoản (Authentication & Authorization):**
  - Các trang: `LoginPage`, `RegisterPage`, `ForgotPassword`, `ChangePassword`, `ResetPassword`.
  - Có phân quyền người dùng và quản trị viên (Admin).
  
- **Quản lí Sản phẩm và Mua sắm (E-commerce Core):**
  - Xem danh mục sản phẩm: `HomePage`, `ProductList`.
  - Quản lý giỏ hàng: `CartPage`.
  - Đặt hàng và lịch sử đơn hàng: `OrderPage`, `ListOrderPage`.
  
- **Thanh toán:**
  - Hỗ trợ thanh toán thông qua **VNPay** hiển thị trên trang `PaymentPage`.

- **Quản trị hệ thống (Admin):**
  - Trang quản trị: `AdminPage`, `Dashboard`.
  - Hệ thống cho phép hiển thị thống kê, quản lý người dùng, sản phẩm.

- **Tính năng trí tuệ nhân tạo (AI):**
  - Hệ thống tích hợp các API router như `aiAgentRoutes.js` và `AdminChatbotRoutes.js` để tự động hóa một số nghiệp vụ/quản trị.

## 4. Tình trạng chạy thực tế
- Dự án là một hệ thống tách biệt Front-End và Back-End, hiện mã nguồn đang được Build và sử dụng Node/Vite để phục vụ tại máy cá nhân. (Tương đương 2 tiến trình chạy độc lập).

---
> *Tài liệu này được tạo tự động dựa trên cấu trúc các thư mục, file cấu hình và models của dự án DA_CNPM.*
