# ĐẶC TẢ THỬ THÁCH HACKATHON: BẢNG 1 - ORGANIZATION AI
> **Cuộc thi:** MLAI Hackathon 2026 · Mạng lưới AI khu vực phía Nam · HCMUT × HUTECH  
> **Đề bài kỹ thuật lựa chọn:** **Đề bài A - Bộ điều phối chuyển tiếp (The Escalation Referee)**  
> **Áp dụng thực chiến:** **EquipAgent AI** — Hệ thống AI Agent Tự Hành Điều Phối & Cấp Phát Thiết Bị Nội Bộ

---

## MỤC LỤC
1. [Bối Cảnh & 3 Điều Kiện Cốt Lõi](#1-bối-cảnh--3-điều-kiện-cốt-lõi)
2. [Đặc Tả Chi Tiết Đề Bài A: The Escalation Referee](#2-đặc-tả-chi-tiết-đề-bài-a-the-escalation-referee)
3. [Barem Chấm Điểm Toàn Diện (Thang Điểm 100)](#3-barem-chấm-điểm-toàn-diện-thang-điểm-100)
4. [Quy Trình Giám Khảo Chấm Thi (8 Phút Sơ Loại)](#4-quy-trình-giám-khảo-chấm-thi-8-phút-sơ-loại)
5. [6 Sản Phẩm Bàn Giao Bắt Buộc (Deliverables)](#5-6-sản-phẩm-bàn-giao-bắt-buộc-deliverables)
6. [Kế Hoạch Ánh Xạ & Checklist Triển Khai Cho Dự Án](#6-kế-hoạch-ánh-xạ--checklist-triển-khai-cho-dự-án)

---

## 1. BỐI CẢNH & 3 ĐIỀU KIỆN CỐT LÕI

> *“Xây dựng hệ thống AI thực hiện công việc thực tế trong tổ chức và đảm bảo trách nhiệm giải trình.”*

AI không thay thế con người mà tiếp nhận một phần các công việc đang được xử lý thủ công — bao gồm việc đôn đốc tiến độ, điều phối quy trình, kiểm tra dữ liệu và liên tục đánh giá để phân loại các trường hợp cần con người xử lý trực tiếp. 

Cuộc thi nhấn mạnh **3 điều kiện cốt lõi** để một hệ thống AI có thể đưa vào vận hành thực tế:

1. **Đủ tính tự chủ (Autonomy) để xử lý công việc thực tế:**
   - Thực thi liên tiếp nhiều bước phụ thuộc mà không cần nhắc lệnh lại (ReAct loop).
   - Tự phục hồi khi gặp lỗi thay vì tiếp tục suy đoán sai lệch (Dual-Path Resilience).
   - Xác định chính xác các trường hợp không được tự ý xử lý đơn lẻ. *Một tác tử chuyển tiếp mọi trường hợp sẽ không có tính tự chủ; ngược lại, tác tử không chuyển tiếp bất kỳ trường hợp nào cũng không đáp ứng yêu cầu.*
2. **Đủ tính minh bạch (Transparency & Accountability) để con người duy trì trách nhiệm giải trình:**
   - Người quản trị có thể tra cứu hệ thống đã thực hiện thao tác gì, vào thời điểm nào, dựa trên dữ liệu đầu vào nào và lý do tương ứng (Audit Trail).
   - Có quyền can thiệp dừng hoặc hoàn tác hành động (Override & Rollback).
   - Nhận được lời giải thích có thể ứng dụng vào thực tế cho người không có chuyên môn kỹ thuật.
3. **Đánh giá khách quan tác động đến người sử dụng:**
   - Nhận diện các tác động thực tế thông qua kiểm thử người dùng và báo cáo minh bạch (không chỉ nói về tăng tốc độ đơn thuần mà phải chỉ ra cả những khó khăn/thay đổi phát sinh).

---

## 2. ĐẶC TẢ CHI TIẾT ĐỀ BÀI A: THE ESCALATION REFEREE

> **Tên đề bài:** Bộ điều phối chuyển tiếp (The Escalation Referee)  
> **Nhiệm vụ:** Tác tử có năng lực xác định chính xác thời điểm cần dừng tự động hóa để xin ý kiến con người.

### 2.1. Yêu cầu tối thiểu (Sprint 1 - 72 Giờ)
* **Quy trình cụ thể:** Chọn quy trình **Cấp phát thiết bị & Quản lý kho nội bộ** kèm quy định rõ ràng:
  * Tự động xử lý hoàn toàn các trường hợp thường quy (vật tư văn phòng phẩm, thiết bị phổ thông mượn ngắn hạn).
* **Bộ dữ liệu kiểm thử:** Tối thiểu 15 trường hợp kiểm thử, bao gồm: trường hợp thường quy, trường hợp không rõ ràng, trường hợp ngoài quy định và trường hợp vượt thẩm quyền xử lý.
* **Phân loại mức độ không chắc chắn thành 3 nhóm rõ rệt:**
  1. `UNCERTAIN_INFO`: Chưa xác định được thông tin thực tế (thiếu ngày giờ trả, thiếu phòng ban sử dụng).
  2. `OUT_OF_POLICY`: Nằm ngoài phạm vi quy định (mượn thiết bị không phục vụ công việc, mượn quá số lượng cho phép).
  3. `HIGH_AUTHORITY_REQUIRED`: Vượt thẩm quyền cần con người phê duyệt (thiết bị giá trị cao > 20 triệu, mượn dài ngày > 7 ngày).
* **Chất lượng câu hỏi chuyển tiếp:** Tạo câu hỏi cụ thể, rõ ràng để người xử lý có thể quyết định và trả lời trực tiếp — tuyệt đối không dùng câu hỏi chung chung kiểu *"Vui lòng xem xét lại hồ sơ"*.
* **Không chuyển tiếp quá mức:** Các trường hợp thường quy phải được xử lý tự động 100%. Tác tử chuyển tiếp mọi trường hợp sẽ bị đánh rớt.
* **Nguyên tắc an toàn:** Tuyệt đối không đưa ra kết quả khẳng định đối với dữ liệu đầu vào đã bị gắn cờ nghi vấn.
* **Bộ công cụ Verify:** Cung cấp 5 trường hợp kiểm thử chuyển tiếp — gồm 3 trường hợp thường quy và 2 trường hợp cần chuyển tiếp — có thể chạy trực tiếp bằng 1 thao tác nút bấm, in rõ bảng kết quả kèm câu hỏi tương ứng.

### 2.2. Yêu cầu nâng cao (Sprint 2 - Chung Kết)
* Tự động điều chỉnh ngưỡng chuyển tiếp dựa trên phản hồi của người dùng trong quá trình vận hành.
* Báo cáo độ chính xác bằng số liệu cụ thể: Tỷ lệ trường hợp cần chuyển tiếp nhưng bị bỏ sót (False Negative), và tỷ lệ trường hợp đơn giản bị chuyển tiếp không cần thiết (False Positive).
* Thử nghiệm với ít nhất 3 nhân sự trực tiếp xử lý quy trình này trong thực tế (Thủ kho, Quản lý Lab, Trưởng bộ phận) và chỉ ra ít nhất một cải tiến bắt nguồn từ phản hồi của họ.

### 2.3. Phương thức đánh giá của Ban giám khảo (Đề bài A)

#### Vòng Sơ loại - Kiểm tra nhanh 90 giây:
* Giám khảo bấm nút **Verify → Escalation**. Hệ thống tự động thực thi 5 trường hợp mẫu và hiển thị bảng kết quả.
* Giám khảo nhập 1 trường hợp không rõ ràng mới dựa trên quy chế kho.
* **ĐẠT:** 2 trường hợp được chuyển tiếp, 3 trường hợp được xử lý tự động, và trường hợp mới được xử lý hợp lý.
* **KHÔNG ĐẠT:** Hệ thống chuyển tiếp tất cả hoặc không chuyển tiếp trường hợp nào.

#### Vòng Chung kết - Kiểm thử toàn diện (20 điểm):
Ban giám khảo đưa ra 5 trường hợp mới độc lập (trong đó có ~2 trường hợp cần chuyển tiếp):

| Bài kiểm tra | Thao tác của Giám khảo & Thang điểm | Điểm tối đa |
| :--- | :--- | :---: |
| **1. Phát hiện đúng trường hợp cần chuyển tiếp** | Giám khảo thực thi 5 trường hợp riêng.<br>• **8 điểm:** Chuyển tiếp đúng cả 2 trường hợp và phân loại chính xác nhóm.<br>• **4 điểm:** Phát hiện đúng 1 trong 2 trường hợp.<br>• **0 điểm:** Không phát hiện được trường hợp nào. | **8 điểm** |
| **2. Không can thiệp các trường hợp đơn giản** | 3 trường hợp thường quy phải được xử lý tự động hoàn toàn.<br>• **6 điểm:** Không có trường hợp chuyển tiếp sai.<br>• **3 điểm:** Có 1 trường hợp chuyển tiếp sai.<br>• **0 điểm:** Từ 2 trường hợp chuyển tiếp sai trở lên. | **6 điểm** |
| **3. Chất lượng câu hỏi chuyển tiếp** | Giám khảo đánh giá nội dung câu hỏi do hệ thống tạo ra.<br>• **6 điểm:** Câu hỏi cụ thể, người duyệt có thể quyết định ngay trong 1 câu trả lời mà không cần tra cứu lại hồ sơ gốc.<br>• **3 điểm:** Câu hỏi cụ thể nhưng vẫn cần tra cứu thêm.<br>• **0 điểm:** Câu hỏi chung chung dạng *"yêu cầu xem xét lại"*. | **6 điểm** |

---

## 3. BAREM CHẤM ĐIỂM TOÀN DIỆN (THANG ĐIỂM 100)

| STT | Tiêu chí chấm điểm | Điểm tối đa | Yêu cầu chi tiết để đạt điểm tối đa |
| :---: | :--- | :---: | :--- |
| **1** | **Khả năng vận hành - Đường dẫn trực tuyến (Live URL)** | **10 điểm** | Giám khảo truy cập URL công khai, thực hiện thao tác chính theo hướng dẫn trên trang chủ. **Hoạt động trơn tru, không cần tạo tài khoản, không cần cài đặt = 10 điểm.** *(Lỗi link hoặc thao tác mù mờ = 0 điểm)*. |
| **2** | **Khả năng vận hành - Bộ công cụ kiểm thử tự động (Verify Harness)** | **12 điểm** | Một thao tác bấm duy nhất chạy toàn bộ các trường hợp và in bảng kết quả đạt/không đạt kèm dấu thời gian thực.<br>• Đạt cả 4-5 trường hợp = **12 điểm**.<br>• Đạt 3 trường hợp = 8 điểm.<br>• Phải chạy thủ công từng cái = 0 điểm. |
| **3** | **Khả năng vận hành - Dữ liệu đầu vào mới của Giám khảo** | **8 điểm** | 2 dữ liệu đầu vào do giám khảo tự đưa ra mà đội thi chưa từng thấy trước đó.<br>• **8 điểm:** Xử lý hợp lý hoặc từ chối/chuyển tiếp hợp lý cả hai.<br>• 4 điểm: Xử lý đúng 1 dữ liệu.<br>• 0 điểm: Không xử lý được hoặc đưa ra kết quả sai nhưng khẳng định đúng. |
| **4** | **5 Slide thuyết trình & Video demo** | **10 điểm** | Đầy đủ 5 slide theo đúng cấu trúc chuẩn, video dưới 3 phút thể hiện hệ thống vận hành thực tế. *Lưu ý: Thiếu Slide 3 hoặc Slide 5 bị trừ 50% số điểm mục này.* |
| **5** | **Người dùng thực tế và Tổ chức thực tế** | **20 điểm** | • **6 điểm:** 3 nhân sự cụ thể kèm chức danh thực tế đang phụ trách công việc này.<br>• **4 điểm:** Trích dẫn nguyên văn phản hồi của họ.<br>• **6 điểm:** 1 thay đổi cụ thể trong sản phẩm xuất phát từ phản hồi người dùng (thể hiện qua commit/đối chiếu).<br>• **4 điểm:** Chỉ ra cụ thể 1 tác động tiêu cực/bất cập phát sinh khi áp dụng. *(Nếu trả lời không có bất cập nào = 0 điểm).* |
| **6** | **Vai trò con người (Human-in-the-loop) & Nhật ký kiểm toán** | **20 điểm** | • **6 điểm:** Điểm phân định quyền quyết định ở Slide 2 khớp với hệ thống vận hành thực tế.<br>• **6 điểm:** Giám khảo chọn một hành động bất kỳ và Nhật ký kiểm toán (Audit Trail) truy xuất rõ: làm gì, thời điểm nào, dữ liệu nào và lý do tương ứng.<br>• **4 điểm:** Tính năng can thiệp dừng và hoàn tác (Rollback) hoạt động hiệu quả.<br>• **4 điểm:** Hệ thống giải thích được một quyết định cho người không chuyên hiểu. |
| **7** | **Kiểm thử xác thực theo Đề bài A (Escalation Referee)** | **20 điểm** | Chấm theo 3 bài kiểm tra của Đề bài A (Phát hiện chuyển tiếp 8đ + Tự động thường quy 6đ + Chất lượng câu hỏi 6đ). |
| | **TỔNG CỘNG** | **100 điểm** | **Vận hành (40đ) + Thực tế (20đ) + Human-in-the-loop (20đ) + Đề bài A (20đ)** |

---

## 4. QUY TRÌNH GIÁM KHẢO CHẤM THI (8 PHÚT SƠ LOẠI)

Mỗi bài thi được hai giám khảo chấm độc lập, bất đồng bộ (không họp trực tuyến):

```
0:00 ─── 1:00 : Truy cập Live URL, xem hướng dẫn 1 dòng ở trang chủ, thử chat mượn đồ.
1:00 ─── 3:00 : Bấm nút [⚡ Verify 90s], kiểm tra bảng kết quả Pass/Fail có timestamp thực.
3:00 ─── 5:00 : Nhập 2 dữ liệu mới do Giám khảo tự nghĩ để thử phản xạ của Agent.
5:00 ─── 6:30 : Kiểm tra bài test 90 giây của Đề A (tự động vs chuyển tiếp).
6:30 ─── 7:30 : Mở Nhật ký kiểm toán (Audit Trail), xem vết suy luận và bấm thử nút [Hoàn tác].
7:30 ─── 8:00 : Chấm điểm vào bảng tiêu chí chuẩn.
```

---

## 5. 6 SẢN PHẨM BÀN GIAO BẮT BUỘC (DELIVERABLES)

1. **Đường dẫn trực tuyến (Live URL):** Triển khai công khai (Render/Vercel), không cần tài khoản, hướng dẫn 1 dòng trên giao diện.
2. **Bộ công cụ kiểm thử tự động (Verify Harness):** Nút bấm 1-click chạy tuần tự 5 test cases kèm Runbook hướng dẫn tái lập kết quả.
3. **Kho mã nguồn công khai (Public GitHub Repo):** Đầy đủ lịch sử commit xuyên suốt sprint. Cấm squash hoặc force-push.
4. **Video demo (Dưới 3 phút):** Quay màn hình mộc, thể hiện hệ thống đang chạy thật, bao gồm cả điểm chuyển tiếp con người.
5. **Bộ 5 Slide thuyết trình (Cấu trúc cố định):**
   * **Slide 1:** Vấn đề hiện trạng trong quy trình mượn trả/quản lý thiết bị.
   * **Slide 2:** Luồng Đầu vào → Xử lý → Đầu ra & Điểm phân định quyền con người.
   * **Slide 3:** Tác động thực tế (đối chiếu trước/sau kèm phương pháp đo lường).
   * **Slide 4:** Kiến trúc hệ thống (ReAct + WebMCP + Dual-Path Fallback).
   * **Slide 5:** Giới hạn, rủi ro và bất cập phát sinh khi áp dụng.
6. **Nhật ký phát triển (Build Log - 1 trang):** Công cụ AI đã dùng, bài toán kỹ thuật giải quyết, tính năng lớn đã cắt giảm và lý do.

---

## 6. KẾ HOẠCH ÁNH XẠ & CHECKLIST TRIỂN KHAI CHO DỰ ÁN

### 6.1. Bảng Ánh Xạ Nghiệp Vụ Kho Thiết Bị
* **Danh mục thiết bị (MongoDB `products`):**
  * *Nhóm Thường quy (Auto):* Cáp HDMI 5m, Mic không dây, Bút trình chiếu, Chuột quang, Giấy in A4 (Tồn kho > 10, giá trị < 500k).
  * *Nhóm Giá trị cao (High Authority):* Máy quay Sony A7IV (50 triệu), Flycam DJI Mini 4 Pro (25 triệu), Máy chiếu hội trường Epson (40 triệu).
* **Phiếu mượn / Xuất kho (MongoDB `orders` / `carts`):**
  * Lưu thông tin người mượn, phòng ban, thời gian mượn, trạng thái (`AUTO_APPROVED`, `ESCALATED_PENDING`, `DISPATCHED`, `RETURNED`).

### 6.2. Checklist Kỹ Thuật Cần Hoàn Thiện (Ăn 100 Điểm)
- [ ] **1. Prompt & Rules (`PromptEngine.js`):** Định nghĩa vai trò Trợ lý Quản lý Kho & luật 3 nhóm chuyển tiếp (`UNCERTAIN_INFO`, `OUT_OF_POLICY`, `HIGH_AUTHORITY_REQUIRED`).
- [ ] **2. Tool Chuyển Tiếp (`escalate_case`):** Khai báo trong `ToolRegistry.js` và WebMCP để AI gọi khi vượt thẩm quyền hoặc mờ thông tin.
- [ ] **3. Bảng Audit Trail (`AuditLogService` & UI Drawer):** Lưu lại `logId`, `timestamp`, `action`, `requester`, `reasoning/thought`, `status`, kèm nút `[Hoàn tác]`.
- [ ] **4. Nút bấm `[⚡ Verify 90s]` trên giao diện:** Chạy tuần tự 5 test cases và vẽ bảng Pass/Fail kèm timestamp.
- [ ] **5. Công tắc 1-Click Role Switcher:** Cho phép giám khảo đổi qua lại giữa `Người mượn` và `Thủ kho/Quản lý` ngay trên Header.
- [ ] **6. Live URL & Bộ tài liệu nộp thi:** Deploy web lên Cloud, chuẩn bị 5 Slide và video demo 3 phút.
