# Kiến Trúc và Luồng Hoạt Động của AI-Agent (E-ComMate)

Tài liệu này mô tả chi tiết quy trình xử lý của Trợ lý Ảo mua sắm E-ComMate, một hệ thống AI dựa trên mô hình LLM (Gemini) kết hợp kiến trúc **Function Calling** và **Context Memory**.

---

## 1. Thành Phần Hệ Thống (Components)

Hệ thống AI-Agent được chia thành các tệp thực thi chính trong thiết kế chia module `backend/utils/ai-Agent/`:

1. **`agentCore.js`**: Trái tim của hệ thống. Đây là nơi chứa vòng lặp Agent (Agent Loop) để giao tiếp qua lại với Google LLM và thi hành API.
2. **`promptTemplates.js`**: "Cẩm nang bán hàng" dành cho AI. File này chứa System Prompt dưới dạng ngôn ngữ tự nhiên kiểm soát lối nói, điều tiết 6 giai đoạn mua hàng và quản lý cấu trúc UI Button `[ACTIONS]`.
3. **`contextManager.js` & `referenceResolver.js`**: Lăng kính bộ nhớ. Quản lý tóm tắt (Summary) sản phẩm người dùng đang xem qua bộ đệm Redis và giải mã hiện tượng "chỉ định mơ hồ" (VD: "chọn hệ điều hành của nó", "lấy con thứ 2").
4. **`toolRegistry.js` & thư mục `actions/`**: Mã nguồn khai báo công cụ (Tools) với schema RÕ RÀNG. Cung cấp API nội bộ cho Gemini gọi để thao tác với Model Product, Cart, Order, User, VNPay. 
5. **Cơ Sở Dữ Liệu `Redis`**: Lưu giữ tốc độ cao luồng trò chuyện, mã số đăng nhập (`sessionId`).

---

## 2. Luồng Xử Lý Chi Tiết (Agent Workflow)

Một chu kỳ từ lúc hệ thống nhận tin nhắn "Tìm iphone 17" tới lúc đưa ra sản phẩm hoàn chỉnh trải qua các bước sau:

### BƯỚC 1: Tiếp nhận và Tiền xử lý (Pre-processing)
- Người dùng truyền Request gồm: Cụm từ gốc (`message`), `userId` (nếu đăng nhập), và `sessionId`.
- **Slang Normalizer**: Nếu người dùng viết tắt, các từ lóng sẽ được tra cứu và chuẩn hóa (VD: "tìm ip 17" -> "tìm kiếm iphpone 17").
- **Kiểm soát xác thực (Auth Shield)**: Nếu hệ thống nhận diện câu nói dính dáng tới các lệnh chốt sale ("giỏ hàng", "mua", "đặt đơn") mà `userId` bị null, Agent chặn request tức thì kèm lời nhắc đăng nhập.

### BƯỚC 2: Tái tạo Ngữ Cảnh bằng Memory (Context Revival)
Thực thi TỐI ƯU HÓA chạy song song bằng `Promise.allSettled`:
1. Mở Cổng Redis: Lấy ra **15 đoạn hội thoại** của người dùng hiện tại ở session này. 
2. Tra cứu Giả thuyết Đại từ (Reference Process): Phân giải các cụm từ kiểu "*tin nhắn nói đến cái này*", thay thế thành mã ID kỹ thuật ẩn cho Agent hiểu.
3. Kéo Tóm tắt ngắn gọn: Trích xuất lịch sử các sản phẩm user ngắm từ Redis Meta.

### BƯỚC 3: Bước vào Vòng Lặp Suy Luận (The Agent Loop)
`agentCore.js` gán các dữ liệu Tiền xử lý + Tools vào khay rồi hỏi server API của LLM (Gemini):
- **Giao Tiếp Lần 1**: Text gửi đi và Tools gửi đi. Mô hình sẽ phân tích nếu có Tool nào cần kích hoạt (VD: Thấy "tìm iphone", Gemini đòi gọi schema `search_products(keyword: "iphone 17")`).
- **Thực thi vòng lặp**: API gọi `search_products(keyword: "iphone 17")`. Kết quả thực tế từ DB sẽ là các object điện thoại "iphone 17".
- **Giao Tiếp Bổ sung Lần 2,3,4**: Mã hệ thống nạp Object Data đó ngược trở lại cho Gemini bằng tư cách (`role: "user", parts: functionResponse`). Chú ý: Cấu trúc của Gemini được bảo quản nguyên gốc `thought_signature` để tránh lỗi đứt gãy. Do giới hạn `maxIterations = 5`, hệ thống liên tục gọi nếu Gemini cần. Ví dụ: Search Products -> Thấy hàng -> Trả ra -> Gemini tiếp tục đòi tính hàm giỏ hàng -> Trả ra.

### BƯỚC 4: Hậu xử lý Kịch bản Trả về (Post-processing)
- Quá trình lặp hoàn tất khi Gemini tung ra được 1 câu Final Text theo đúng Style đã rèn (có chèn Emotion, và KHÔNG Markdown *nguyên tắc số 8*). Đoạn Text sinh ra cấu trúc bọc Nút điều hướng như `[ACTIONS]{...}[/ACTIONS]`.
- Hệ thống trích xuất dữ liệu mảng Product trong Memory ra thành cục object `payload` đã được Formatter gọn gàng trong `formatProductForPayload()`.
- Ghi lại History vào DB Redis.

### BƯỚC 5: Xuất dữ liệu Frontend 
Backend Trả khối Object JSON đầy đủ về, phía Frontend Component React sẽ dựa vào `payload.products` sinh ra thẻ điện thoại nằm cạnh hội thoại, và parse block `[ACTIONS]` sinh ra nút HTML Button "Xem trong giỏ".

---

## 3. Sơ đồ rút gọn các luồng tự động (Automation Blueprint)

*Đây là lý do AI-Agent này đặc thù hơn các con Bot thông thường, tạo thành tính năng "Tự Động".*
- **Sản phẩm User nói tắt**: AI *Tìm Memory cuối cùng* -> Trả Product ID nội bộ vào hàm API .
- **Tạo Cổng VNPay**: User nhập Order Information -> AI *Phân tích trích Form Input* -> Gọi `create_order` -> AI gọi `vnpay_payment`. Mọi thứ không hiển thị ở font hiển vi, mà chạy ngầm qua 2 Round. 
- AI biết tự động phán đoán: User đòi chốt đơn nhưng thiếu địa chỉ "Xã/Phường" -> Agent giữ vòng lặp và hỏi câu hỏi: *"Dạ anh bổ sung thêm thông tin xã ạ"*.
  
---
*Được biên soạn tự động từ mã nguồn nội bộ bởi Antigravity Agent.*
