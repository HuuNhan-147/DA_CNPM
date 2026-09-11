# Kế Hoạch Chuyển Đổi & Vận Hành (Migration & Operations Plan)

Tài liệu này hướng dẫn chi tiết quy trình chuyển đổi, kiểm thử nghiệm thu, giám sát vận hành (monitoring) và quy trình Rollback khẩn cấp cho kiến trúc AI Agent Module & WebMCP mới.

---

## 1. Checklist Chuyển Đổi Hệ Thống (Migration Checklist)

| Hạng mục | Trạng thái | Ghi chú kiểm tra |
| :--- | :---: | :--- |
| **1. Tách Module Độc Lập** | ✅ Hoàn thành | Toàn bộ mã nguồn Agent nằm tại `backend/modules/ai-agent/`. |
| **2. Tái sử dụng E-Commerce Services** | ✅ Hoàn thành | Không còn thao tác MongoDB model trực tiếp từ tool. 100% qua Services. |
| **3. Trừu tượng hóa Tool System** | ✅ Hoàn thành | Xây dựng xong `AgentTool`, `ToolResolver`, `LocalServiceAdapter`, `WebMCPAdapter`. |
| **4. WebMCP Client & Polyfill** | ✅ Hoàn thành | Hoàn thành `WebMCPManager` chuẩn `document.modelContext` kèm 5 modules tools. |
| **5. Dual-Path Execution** | ✅ Hoàn thành | Kiểm thử tự động chứng minh chuyển đổi mượt mà giữa WebMCP và Server Fallback. |
| **6. Build Frontend & Backend** | ✅ Hoàn thành | `npm run build` Vite exit code 0, không có lỗi kiểu dữ liệu TypeScript. |
| **7. Bộ Test Tự Động** | ✅ Hoàn thành | 46/46 test assertions PASSED (Unit, Intent, Dual-Path). |
| **8. Xóa Legacy Code** | ⏳ Chờ bước dọn dẹp | Thư mục `backend/utils/ai-Agent/` chuẩn bị được dọn dẹp an toàn. |

---

## 2. Hướng Dẫn Vận Hành (Operational Guide)

### 2.1. Khởi động môi trường phát triển (Development)
```powershell
# 1. Khởi động Backend (Port 5000)
cd backend
npm start

# 2. Khởi động Frontend (Port 5173)
cd frontend
npm run dev
```

### 2.2. Kiểm tra Discovery WebMCP trên Trình duyệt
1. Mở trình duyệt truy cập `http://localhost:5173/`.
2. Mở Developer Tools (`F12`), chuyển sang tab **Console**.
3. Gõ lệnh:
   ```javascript
   document.modelContext.getTools();
   ```
4. Xác nhận danh sách trả về đầy đủ các tools: `search_products`, `add_to_cart`, `create_order`, `create_vnpay_payment`, `get_user_profile`...

---

## 3. Chiến Lược Giám Sát & Telemetry (Monitoring & Logging)

### 3.1. Các Chỉ Số Cần Theo Dõi (Key Metrics)
1. **WebMCP Success Rate vs Fallback Rate:**
   - Log server đánh dấu nguồn thực thi `source: "client_webmcp"` hoặc `source: "server_service"`.
   - Nếu tỷ lệ `server_service` tăng đột biến ở các client web, cần kiểm tra kết nối Socket.IO.
2. **Latency Per Tool:**
   - Đo lường thời gian thực thi trong log: `duration (ms)`.
   - Thời gian chờ mặc định cho WebMCP là 15,000ms (`WebMCPAdapter.timeoutMs = 15000`).
3. **Intent Detection Accuracy:**
   - IntentRouter ghi log: `🎯 Intent detected: [DOMAINS] (confidence: ..., score: ...)`.

### 3.2. Cấu Trúc Log Chuẩn
```text
🌐 [WebMCPAdapter] Gửi yêu cầu thực thi [search_products] về trình duyệt qua WebMCP...
✅ [WebMCPAdapter] Trình duyệt phản hồi thành công [search_products] (250ms)
--- Hoặc trong trường hợp Fallback ---
⚠️ [WebMCPAdapter] Thực thi WebMCP thất bại (Timeout). Tự động kích hoạt Fallback!
🏢 [LocalServiceAdapter] Thực thi tool [search_products] tại server...
✅ [LocalServiceAdapter] [search_products] hoàn thành (180ms)
```

---

## 4. Kế Hoạch Rollback Khẩn Cấp (Rollback Strategy)

Nếu phát hiện sự cố nghiêm trọng trên môi trường Production:

### Kịch Bản 1: WebMCP Client gặp lỗi diện rộng (Vẫn giữ Module mới)
* **Giải pháp:** Tắt cờ WebMCP ở Client hoặc đặt `hasWebMCP: false` trong `AIAgentChat.tsx`.
* **Kết quả:** Hệ thống lập tức chạy 100% qua `LocalServiceAdapter` tại Server mà không cần build lại Backend.

### Kịch Bản 2: Rollback toàn diện qua Git
Nếu cần quay về commit trước khi refactor:
```powershell
git checkout HEAD~1
npm install
npm run build
```
*(Lưu ý: Do module mới được thiết kế tách biệt và có re-export tương thích ngược, tỷ lệ cần rollback toàn diện là cực kỳ thấp).*
