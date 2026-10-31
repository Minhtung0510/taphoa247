# 🚀 DTFF SHOP — ANDROID GATEWAY TEST LAB (MÔI TRƯỜNG THỬ NGHIỆM ĐỘC LẬP)

> **Mục tiêu:** Thử nghiệm trọn vẹn luồng nhận thông báo tiền về từ điện thoại Android **TRƯỚC KHI** tích hợp vào hệ thống chính.  
> **Cam kết:** Hoàn toàn nằm trong thư mục `AppGateWay/`, **không thay thế và không làm ảnh hưởng đến SePay hay hệ thống đang bán hàng**.

---

## 📂 CẤU TRÚC THƯ MỤC `AppGateWay/`

```text
AppGateWay/
├── test-server/                 # Server Node.js độc lập nhận webhook & Dashboard Live (Cổng 8888)
│   └── server.js
├── macrodroid/                  # Hướng dẫn & cấu hình cho MacroDroid (Tier 1 - Khuyên dùng để test ngay)
│   ├── HUONG_DAN_MACRODROID.md
│   └── webhook_payload_template.json
├── android-app/                 # Mã nguồn Android Studio Native Kotlin (Tier 2 - Bền vững lâu dài)
│   ├── app/src/main/java/...
│   ├── AndroidManifest.xml
│   └── build.gradle.kts
├── laravel-module/              # Code Backend Laravel đóng gói sẵn (sẽ tích hợp khi test thành công)
│   └── NotificationParser.php
├── run-test-server.bat          # File 1-click khởi động Test Studio trên máy tính
└── README.md                    # Tài liệu hướng dẫn này
```

---

## ⚡ HƯỚNG DẪN 3 BƯỚC BẮT ĐẦU TEST NGAY (MẤT 5 PHÚT)

### 📌 BƯỚC 1: Khởi động Test Server trên máy tính
1. Nhấp đúp chuột vào file: **`run-test-server.bat`**  
   *(Hoặc mở PowerShell gõ: `node AppGateWay\test-server\server.js`)*.
2. Mở trình duyệt truy cập: **`http://localhost:8888`**
   - Bạn sẽ thấy giao diện **DTFF Gateway Test Studio** với đầy đủ:
     - Trạng thái thiết bị Online/Offline.
     - Bộ nút bấm giả lập các ngân hàng (**TPBank**, **MBBank**, **Vietcombank**...).
     - Bảng theo dõi giao dịch realtime (không cần F5).

---

### 📌 BƯỚC 2: Thử nghiệm bóc tách Regex ngay trên Web (Chưa cần đụng tới điện thoại)
1. Tại cột bên trái giao diện `http://localhost:8888`, bấm vào nút:
   - `🏦 TPBank: +50,000 VND (ACC-XQR4R4TC)`
2. Bấm nút màu xanh: **🚀 Bắn Thử Webhook Vào Server**
3. Cột bên phải lập tức hiển thị thẻ giao dịch:
   - **Số tiền:** `50,000 đ`
   - **Mã đơn:** `ACC-XQR4R4TC`
   - **Trạng thái:** `✅ KHỚP ĐƠN`
   - **Nội dung:** Đã tự động che số dư nhạy cảm.

---

### 📌 BƯỚC 3: Kết nối điện thoại thật qua MacroDroid (Khi muốn test thực tế)
1. Mở file [HUONG_DAN_MACRODROID.md](file:///c:/Users/Administrator/Desktop/Test/AppGateWay/macrodroid/HUONG_DAN_MACRODROID.md).
2. Tải app **MacroDroid** trên Google Play (miễn phí).
3. Tạo Macro kích hoạt khi App ngân hàng nhận thông báo có dấu `+`, gửi HTTP POST về:
   ```text
   http://192.168.1.109:8888/api/v1/payments/device/webhook
   ```
   *(Header: `Authorization: Bearer DTFF_SECRET_TEST_2026`)*.
4. Chuyển thử 1.000đ - 2.000đ vào tài khoản ngân hàng và chứng kiến màn hình Test Studio nhảy kết quả tức thì trong 1 giây!

---

## 🎯 KHI NÀO TEST XONG & HÀI LÒNG?
Khi bạn test trên môi trường độc lập này cảm thấy tốc độ và độ ổn định đã đạt 100%, chúng ta sẽ thực hiện bước **Tích hợp vào Laravel ở chế độ `shadow` (chạy ngầm song song với SePay)** để đảm bảo an toàn tuyệt đối!
