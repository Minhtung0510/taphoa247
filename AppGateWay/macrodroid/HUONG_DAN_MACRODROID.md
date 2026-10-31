# 📱 HƯỚNG DẪN CẤU HÌNH MACRODROID (TIER 1 - CHẠY TEST NGAY TRONG 15 PHÚT)

Tài liệu này hướng dẫn bạn cài đặt app **MacroDroid** trên điện thoại Android thật để tự động bắt thông báo tiền về từ App Ngân Hàng và bắn Webhook vào Test Server (`http://192.168.1.109:8888`).

---

## 🛠️ BƯỚC 1: CÀI ĐẶT & CẤP QUYỀN TRÊN ĐIỆN THOẠI
1. Mở **Google Play Store** trên điện thoại, tìm và tải app: **MacroDroid - Device Automation** (hoàn toàn miễn phí).
2. Mở app MacroDroid, bấm **Next/Bỏ qua** các màn giới thiệu.
3. Cấp 3 quyền sống còn:
   - **Quyền đọc thông báo (Notification Access):** Vào Cài đặt máy ➔ Ứng dụng ➔ Truy cập đặc biệt ➔ Truy cập thông báo ➔ Bật cho **MacroDroid**.
   - **Tắt tối ưu hóa pin (Unrestricted Battery):** Vào Cài đặt pin của MacroDroid ➔ Chọn *"Không hạn chế"*.
   - **Khóa app trong Đa nhiệm:** Vuốt mở danh sách ứng dụng gần đây, giữ hoặc bấm vào icon MacroDroid ➔ Chọn biểu tượng ổ khóa 🔒 để máy không bao giờ tự tắt app.

---

## ⚡ BƯỚC 2: TẠO MACRO 1 — NHẬN TIỀN & BẮN WEBHOOK

1. Trong MacroDroid, bấm **Thêm Macro (Add Macro)**:
   - Đặt tên Macro: `DTFF - Bắn Webhook Tiền Về`

2. **Cấu hình Kích hoạt (Triggers - Nút màu đỏ `+`):**
   - Chọn **Sự kiện thiết bị (Device Events)** ➔ **Thông báo (Notification)** ➔ **Nhận thông báo (Notification Received)**.
   - Chọn **Chọn ứng dụng (Select Application(s))**: Tích chọn duy nhất App ngân hàng của bạn (ví dụ: *TPBank Mobile* hoặc *MB Bank* hoặc *Vietcombank*).
   - Mục **Nội dung văn bản (Text Content)**:
     - Chọn **Có chứa (Contains)**
     - Nhập: `+` *(Vì chỉ khi tiền vào tài khoản mới có dấu `+` như `+50,000 VND`)*.

3. **Cấu hình Hành động (Actions - Nút màu xanh dương `+`):**
   - Chọn **Ứng dụng (Applications)** ➔ **Mở trang web / Yêu cầu HTTP (HTTP Request)**.
   - Cài đặt chi tiết như sau:
     - **Phương thức (Method):** `POST`
     - **URL:** 
       ```text
       http://192.168.1.109:8888/api/v1/payments/device/webhook
       ```
       *(Lưu ý: Điện thoại và máy tính phải kết nối chung 1 mạng Wi-Fi)*.
     - **Content Type:** `application/json`
     - **Tiêu đề yêu cầu (Request Headers):** Thêm 2 header:
       - Header 1: `Authorization` có giá trị `Bearer DTFF_SECRET_TEST_2026`
       - Header 2: `X-Device-Id` có giá trị `dev_test_android_01`
     - **Nội dung yêu cầu (Body / Content):** Dán đoạn mã JSON sau:
       ```json
       {
         "app_package": "[not_pkg_name]",
         "title": "[not_title]",
         "raw_content": "[not_body]",
         "posted_at": "[year]-[month]-[day]T[hour]:[minute]:[second]+07:00"
       }
       ```
       *(Trong đó các biến `[not_pkg_name]`, `[not_title]`, `[not_body]` là Magic Text tự động lấy nội dung thông báo của MacroDroid)*.

4. Bấm **Lưu (dấu tick tròn góc dưới bên phải)** để kích hoạt Macro.

---

## 💓 BƯỚC 3: TẠO MACRO 2 — BẮN HEARTBEAT BÁO ONLINE (MỖI 1 PHÚT)

1. Bấm **Thêm Macro**: Đặt tên `DTFF - Heartbeat 1 Phút`.
2. **Triggers (+):** Chọn **Ngày & Giờ (Date & Time)** ➔ **Khoảng thời gian định kỳ (Regular Interval)** ➔ Chọn `1 phút`.
3. **Actions (+):** Chọn **HTTP Request**:
   - **Method:** `POST`
   - **URL:** `http://192.168.1.109:8888/api/v1/payments/device/heartbeat`
   - **Headers:** `Authorization: Bearer DTFF_SECRET_TEST_2026`
   - **Body (JSON):**
     ```json
     {
       "battery": [battery],
       "network": "wifi"
     }
     ```
4. Bấm **Lưu**. Ngay sau 1 phút, trên giao diện Test Studio (`http://localhost:8888`) huy hiệu sẽ đổi thành **🟢 Thiết bị Online (kèm % pin)**!

---

## 🧪 BƯỚC 4: THỬ NGHIỆM THỰC TẾ
1. Mở sẵn trang Dashboard trên máy tính: `http://localhost:8888`.
2. Dùng một tài khoản khác (hoặc nhờ bạn bè) chuyển **1.000đ** hoặc **2.000đ** vào tài khoản ngân hàng của bạn với nội dung:
   ```text
   ACC-XQR4R4TC
   ```
3. Xem thông báo nổi lên trên điện thoại:
   - Trong vòng **0.5 giây**, màn hình máy tính sẽ lập tức nhảy ra thẻ giao dịch màu xanh lá: **✅ KHỚP ĐƠN - Số tiền: 2.000 đ - Mã: ACC-XQR4R4TC**!
