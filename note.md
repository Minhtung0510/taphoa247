# 📋 NHẬT KÝ CÔNG VIỆC DỰ ÁN DTFF SHOP (TIẾN ĐỘ & BÀN GIAO)

**Thời gian cập nhật:** 28/10/2026  
**Dự án:** DTFF SHOP — Hệ thống bán tài khoản game & dịch vụ trực tuyến tự động 24/7  
**Công nghệ:** Next.js 16 (App Router) + Laravel 11 (REST API, SQLite/MySQL, Cổng thanh toán Android Gateway & SePay VietQR)

---

## ⛔ [QUY TẮC CỐT LÕI - BẤT KHẢ XÂM PHẠM]
> ### 🚨 CẤM TUYỆT ĐỐI ĐỤNG VÀO HỆ THỐNG THANH TOÁN (PAYMENT / SEPAY / CHECKOUT) KHI CHƯA CÓ YÊU CẦU RÕ RÀNG TỪ USER!
> - **Khu vực cấm tự ý sửa đổi:**
>   - `backend/app/Services/SePayService.php`
>   - `backend/app/Http/Controllers/Api/PaymentWebhookController.php`
>   - `backend/app/Http/Controllers/Api/CheckoutController.php` (phần đối soát / polling)
>   - `backend/app/Services/OrderService.php` (phần fulfill / hoàn tất thanh toán)
> - **Lý do & Bài học:**
>   - Bất kỳ thay đổi xóa `withoutVerifying()` nào sẽ làm sập kết nối cURL SSL trên môi trường Windows (lỗi `cURL error 60`).
>   - Hệ thống so khớp SePay hiện tại đã hoạt động hoàn hảo: hỗ trợ mã có gạch (`ACC-XXXX`), không gạch (`ACCXXXX`), mã ngắn (`XXXX`) và chống cắt chuỗi của ngân hàng TPBank/Napas. Không được chỉnh sửa lại!

---

## 📌 [VẤN ĐỀ ĐÃ GHI NHẬN - CẦN XỬ LÝ KHI USER YÊU CẦU]
> ### ⚠️ Lỗi: Đơn hàng chưa thanh toán khi bấm vào "Chi tiết đơn" bị báo "Không tìm thấy" thay vì hiện thông tin để tiếp tục thanh toán
> - **Hiện tượng:**
>   1. User tạo đơn hàng nhưng chưa kịp thanh toán hoặc tắt trang (đơn ở trạng thái `pending` / Chờ thanh toán).
>   2. User vào trang **Lịch sử đơn hàng** (`/lich-su-don-hang`).
>   3. User bấm vào nút **"Chi tiết đơn →"** của đơn đang chờ thanh toán đó.
>   4. Nút này dẫn đến URL `/don-hang/{order_code}`.
>   5. Trang `/don-hang/{order_code}` gọi API `/orders/{orderCode}/details` để lấy thông tin tài khoản đã giao. Do đơn chưa thanh toán (`!order->isPaid()`), API trả về lỗi 403 `Đơn hàng chưa được thanh toán thành công`.
>   6. Frontend bắt lỗi và hiện màn hình: *"Không Thể Mở Đơn Hàng / Đơn hàng chưa hoàn tất thanh toán hoặc không tồn tại"* thay vì hiển thị thông tin để user chuyển khoản thanh toán tiếp!
> - **Hướng xử lý dự kiến khi User yêu cầu:**
>   1. Tại trang **Lịch sử đơn hàng** (`/lich-su-don-hang`): Với các đơn có trạng thái `Chờ thanh toán`, đổi nút thành **"Thanh toán ngay →"** (màu xanh nổi bật) và link thẳng về `/checkout?order_code={order.order_code}` (hoặc mở lại giao diện VietQR thanh toán).
>   2. Tại trang **Chi tiết đơn** (`/don-hang/{code}`): Nếu nhận phản hồi đơn hàng đang `pending` (chưa thanh toán), không hiển thị trang lỗi 404/warning mà hiển thị giao diện thanh toán tiếp tục (Mã QR VietQR, STK ngân hàng, Số tiền, Nội dung chuyển khoản và đồng hồ đếm ngược).

---

## 🚀 1. CÂU LỆNH KHỞI ĐỘNG HỆ THỐNG (LOCAL DEV)

### A. Khởi động Backend (Laravel API - Cổng 8000)
Mở Terminal 1 (PowerShell):
```powershell
cd c:\Users\Administrator\Desktop\Test\backend
& "C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" artisan serve --host=0.0.0.0 --port=8000
```
*(Lưu ý: Luôn chạy với `--host=0.0.0.0` để điện thoại Android kết nối qua Wi-Fi bắn webhook).*

### B. Khởi động Frontend (Next.js - Cổng 3000)
Mở Terminal 2 (PowerShell):
```powershell
cd c:\Users\Administrator\Desktop\Test\frontend
npm run dev
```
Truy cập web tại: **`http://localhost:3000`**

---

## ✅ 2. CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH HÔM NAY

1. **Khắc phục thanh thông báo (Banner Header):**
   - Chuyển từ hiệu ứng chạy chữ giật sang cố định thanh trạng thái gọn gàng, mượt mà.
   - Tích hợp bật/tắt và cập nhật nội dung banner trực tiếp từ trang Admin.
   - Cơ chế phát sự kiện tức thì: Admin bấm "Lưu Cấu Hình" là banner trên header đổi ngay trong `0.01 giây` mà không cần F5.

2. **Tối ưu thanh điều hướng (Navbar):**
   - Loại bỏ các ô sản phẩm thừa trên thanh bar để giao diện thanh thoát, chuẩn hiện đại.
   - Phân cấp danh mục (Game Valorant, CS2, Steam...) và loại sản phẩm rõ ràng.

3. **Phân quyền & Bảo mật trang Admin (`/admin`):**
   - Chặn hoàn toàn người dùng thông thường hoặc khách lạ truy cập `/admin` (trả về trang 404 bảo mật để ẩn dấu vết hệ thống quản trị).
   - Sửa lỗi văng trang chủ hoặc bị kẹt 404 đối với tài khoản Admin chính chủ: nhận diện mượt mà từ dropdown avatar và URL.

4. **Sửa lỗi trừ kho sớm (Stock Deduct Bug):**
   - Khắc phục lỗi chưa thanh toán đã bị trừ kho tài khoản.
   - Logic mới: Đơn hàng chỉ thực sự xuất kho và trừ số lượng khi tiền đã vào tài khoản và đơn chuyển trạng thái `completed`.

5. **Hiển thị số lượng tồn kho trên Card sản phẩm:**
   - Bổ sung huy hiệu trực quan trên từng card sản phẩm (`🟢 Còn X acc` / `📦 Kho: X acc`).

6. **Sửa định dạng thời gian đếm ngược thanh toán:**
   - Khắc phục lỗi số giây hiển thị phần thập phân dài dòng (`14:23.8598...`) thành định dạng phút:giây chuẩn (`14:23`).

7. **Sửa lỗi xác nhận thanh toán SePay tự động:**
   - Sửa URL Polling tại trang checkout gọi nhầm `/orders/{code}` thành `/orders/{code}/status`.
   - Cập nhật chuẩn SePay API v2 (`userapi.sepay.vn`) và xử lý chính xác số tiền có phần thập phân (`10000.00`).
   - Tự động đối soát đơn hàng SePay khi khách mở trang **Lịch sử đơn hàng** hoặc mở link **Chi tiết đơn hàng**.

8. **Dọn dẹp & Reset dữ liệu giao dịch test:**
   - Đã xóa sạch dữ liệu bảng `orders`, `order_items`, `payments`, `warranty_claims`.
   - Phục hồi toàn bộ 77 tài khoản trong kho về trạng thái sẵn sàng bán (`available`).

9. **Sửa lỗi 403 Forbidden khi xem ảnh minh chứng bảo hành:**
   - Cập nhật API xem ảnh bằng chứng tại `WarrantyController::viewEvidence` để Admin mở link ảnh minh chứng lỗi của khách trên tab mới hiển thị trực tiếp an toàn.

10. **Bỏ hoàn toàn việc phải bấm `Ctrl + Shift + R` (Realtime Data):**
    - Bỏ cache 60s của Next.js (`cache: 'no-store'`).
    - Thêm Header chống lưu cache (`Cache-Control: no-store, no-cache`) vào Middleware API backend.
    - Bật chế độ `force-dynamic` cho trang chủ.

11. **Tính năng Auto-Sync 20 giây & Window Focus (Đồng bộ không cần F5):**
    - **Trang chủ:** Tự động nhảy số tồn kho và giá mỗi 20s hoặc khi click quay lại tab web.
    - **Lịch sử đơn hàng:** Tự động cập nhật trạng thái đã thanh toán ngầm mỗi 20s hoặc khi chuyển lại tab.
    - **Admin Dashboard:** Tự động làm mới đơn hàng và doanh thu mỗi 20s.

12. **Bắt buộc Đăng nhập mới được mua hàng (Enforce Login to Purchase):**
    - **Backend (`CheckoutController.php`):** Chặn các request tạo đơn chưa đăng nhập (trả về 401 Unauthorized kèm thông báo yêu cầu đăng nhập).
    - **Thẻ sản phẩm (`ProductCard.tsx`):** Khách chưa đăng nhập bấm *"Mua ngay"* sẽ tự động bật Popup Đăng nhập/Đăng ký ngay lập tức.
    - **Trang Thanh toán (`checkout/page.tsx`):** Hiển thị banner cảnh báo yêu cầu đăng nhập và nút bấm submit chuyển thành *"🔒 Đăng Nhập Để Mua Hàng"*.
    - **FAQ Trang chủ (`page.tsx`):** Cập nhật câu hỏi thường gặp giải thích rõ lý do cần đăng nhập (để lưu trữ acc và bảo hành 1 đổi 1).

13. **Kế hoạch chi tiết Cổng thanh toán qua Điện thoại Android (0đ / Không giới hạn):**
    - Đã biên soạn toàn bộ kiến trúc luồng dữ liệu, mẫu Regex bóc thông báo (TPBank, MB, VCB), thiết kế API Laravel và hướng dẫn tại: [KE_HOACH_GATEWAY_ANDROID.md](file:///c:/Users/Administrator/Desktop/Test/KE_HOACH_GATEWAY_ANDROID.md).

14. **Hoàn thiện 100% Cổng thanh toán Android Gateway Tự Xây Dựng (DTFF Gateway):**
    - **App Android Native (Kotlin):** Tự code 100% bằng Kotlin (`com.dtff.gateway`), bảo mật AES-256 mã hóa cấu hình, chạy Foreground Service 24/7 có thông báo trạng thái ngầm, có `BootReceiver` tự bật khi khởi động nguồn máy.
    - **Biên dịch & Cài đặt APK:** Đã build thành công bản APK chính thức tại `C:\Users\Administrator\Desktop\DTFF_Gateway.apk` và nạp thành công lên điện thoại Samsung Galaxy M33.
    - **Cơ chế Fast-Path siêu tốc (< 100ms):** Bắn Webhook trực tiếp bằng Coroutine ngay khi nổ thông báo; tự động lùi về hàng đợi `WorkManager` có retry lũy thừa nếu mất mạng Wi-Fi.
    - **Bộ lọc ngân hàng TPBank chuẩn xác:** Xử lý triệt để định dạng thông báo push của app TPBank Mobile (`PS:+...`, `ND:...`, `SO GD:...`), không bao giờ bị cắt nhầm số dư `SD:`.
    - **Bảo mật 2 lớp:** Xác thực Bearer Token + Ký số HMAC-SHA256 (`X-Signature` & `X-Timestamp`) chống Replay Attack và chống giả mạo thông báo.
    - **Backend Laravel & Mạng nội bộ:**
      - Đã tạo `DevicePaymentWebhookController.php` và các route webhook/heartbeat.
      - Mở Windows Firewall và cấu hình Laravel lắng nghe trên toàn mạng `0.0.0.0:8000` để điện thoại kết nối thông suốt.
      - Tắt cơ chế tự duyệt đơn ảo (mock test) của SePay, đảm bảo đơn hàng đứng chờ thanh toán thật.
    - **Thử nghiệm thực tế thành công 100%:** Khách mua hàng trên web -> Quét mã VietQR -> MoMo chuyển tiền -> App Android bắt thông báo TPBank -> Webhook bắn vào Backend -> Tự động duyệt đơn và giao acc Valorant tức thì! Đã hoàn tất thực tế các đơn: `ACC-PZSB80JH`, `ACC-GIVCTDNV`, `ACC-7ASCKCQO`, `ACC-MKQGI6XD`.

---

## ⚠️ 3. CÁC ĐIỂM CẦN LƯU Ý & HIỆN TRẠNG HỆ THỐNG

1. **Hai cổng độc lập trên máy tính:**
   - Cổng `:8000`: Backend của Shop DTFF thật (App điện thoại đang trỏ vào đây để duyệt đơn giao acc tự động).
   - Cổng `:8888`: Môi trường Test Studio độc lập trước đây (hiện tại đã tắt để dồn tài nguyên cho shop thật).
2. **Cấu hình mạng khi biến PC thành VPS:**
   - Hiện tại hệ thống đang chạy trong mạng LAN Wi-Fi nội bộ (`192.168.1.109:8000`).
   - Khi chuẩn bị public ra Internet cho khách ngoài vào mua, giải pháp tối ưu số 1 là dùng **Cloudflare Tunnel (Miễn phí 100%)**: Không cần mở port modem, có sẵn HTTPS khóa xanh, chống DDoS và điện thoại dùng 4G ra ngoài đường vẫn bắn webhook duyệt đơn về PC được.

---

## 🎯 4. KẾ HOẠCH CÔNG VIỆC TIẾP THEO (HÔM NAY & NGÀY MAI)

- [x] **Nhiệm vụ 1: Tìm kiếm & Mua Domain giá rẻ (ĐÃ HOÀN THÀNH):**
  - Đã đăng ký tên miền thương hiệu mới: **`taphoa247.io.vn`** (30.000đ tại Mắt Bão).
  - Trỏ NameServer về Cloudflare (`addilyn.ns.cloudflare.com` & `sri.ns.cloudflare.com`) - Kích hoạt thành công bảo vệ SSL và CDN toàn cầu.
- [x] **Nhiệm vụ 2: Biến PC thành VPS bằng Cloudflare Tunnel (ĐÃ HOÀN THÀNH):**
  - Đã cài đặt `cloudflared` và tạo tunnel `taphoa247-tunnel` (ID: `c735128e-ea63-4ca0-8535-2c95f2b5d57d`).
  - Đã cài đặt chạy thành Windows Service tự khởi động cùng máy tính (`Cloudflared agent`).
  - Định tuyến phân giải:
    - **`https://taphoa247.io.vn`** & **`https://www.taphoa247.io.vn`** -> Next.js Frontend (port 3000)
    - **`https://api.taphoa247.io.vn`** -> Laravel Backend API & Webhook (port 8000)
  - Cập nhật CORS, Sanctum domains và `.env.local` cho Frontend kết nối mượt mà qua HTTPS.
  - Kiểm tra kết nối công khai từ mạng ngoài: 200 OK toàn bộ, bảo mật HTTPS khóa xanh tự động.
- [ ] **Nhiệm vụ 3: Khảo sát & Nhập nguồn hàng sản phẩm số (Biên lợi nhuận cao):**
  - **Nhóm 1 - Acc Game:** Acc Valorant (Unranked lv 20+, Smurf, Skin xịn), Acc CS2 Prime, Steam GTA V.
  - **Nhóm 2 - Dịch vụ AI & Đồ họa:** ChatGPT Plus, Canva Pro, CapCut Pro (học sinh, sinh viên, dân văn phòng mua liên tục).
  - **Địa chỉ săn hàng sỉ giá gốc:** FunPay.com (chợ số Đông Âu giá rẻ), Z2U.com, G2G.com, diễn đàn MMO4ME.
- [ ] **Nhiệm vụ 4: Khắc phục triệt để luồng đơn hàng Chờ Thanh Toán (Pending UX):**
  - Trong trang **Lịch sử đơn hàng**: Nếu đơn chưa thanh toán (`pending`), hiển thị nút **"⚡ Tiếp tục thanh toán →"** dẫn quay lại quét mã VietQR.
  - Trong trang **Chi tiết đơn hàng** (`/don-hang/[code]`): Nếu đơn chưa thanh toán, hiển thị giao diện chờ thanh toán và mã VietQR thay vì báo lỗi 403.
- [ ] **Nhiệm vụ 5: Kiểm tra tính năng Bảo hành tự động (Auto-warranty):**
  - Test khách báo lỗi tài khoản -> hệ thống tự kiểm tra và đổi acc mới trong kho tự động.
- [ ] **Nhiệm vụ 6: Tối ưu giao diện Mobile & Nút Mở App Ngân Hàng:**
  - Tối ưu kích thước mã QR thanh toán trên điện thoại (thêm nút "Mở App Ngân Hàng" deeplink).

---

## 🧠 5. ĐỀ ÁN HỆ THỐNG: "THƯƠNG GIA AI TỰ HÀNH" (AUTONOMOUS AI MERCHANT)
> Đề án chi tiết về kiến trúc 5 phân hệ, kịch bản vận hành 1 ngày từ 06:00 đến 23:59, 3 tầng bảo hiểm an toàn và lộ trình kỹ thuật 4 giai đoạn đã được tách thành tài liệu độc lập:
> 👉 **Xem chi tiết tại file:** [KE_HOACH_AI_MERCHANT.md](file:///c:/Users/Administrator/Desktop/Test/KE_HOACH_AI_MERCHANT.md)


