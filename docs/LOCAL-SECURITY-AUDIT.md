# Kiểm tra bảo mật localhost — 28/10/2026

Phạm vi: http://localhost:3000 và API http://127.0.0.1:8000; mã nguồn tại Desktop/Test. Kiểm tra bằng HTTP trực tiếp (tương đương sửa request trong DevTools), đọc mã và integration test Laravel với SQLite :memory:. Không giả thanh toán trên kho thật, không gọi Discord/ngân hàng thật từ test (Http::fake), không sửa mã nghiệp vụ.

## Kết quả đã tái hiện

### 1. Cao: chiếm quyền đọc đơn khách vãng lai bằng email chưa xác minh

- AuthController::register cấp token ngay, không xác minh email.
- AuthController::userOrders cho phép lấy đơn theo customer_email và trả credentials.
- DeliveryController::verifyOrderAccess (dòng 31), WarrantyController::verifyOrderAccess (dòng 39) cũng tin email trùng.
- Tái hiện trên dữ liệu giả: tạo đơn đã trả tiền với victim@example.test, sau đó đăng ký tài khoản mới bằng email đó; /user/orders trả mã đơn và audit-user-0:fake-password; /details trả 200 mà không có X-Order-Token.
- Điều kiện: email khách đã mua dạng guest nhưng chưa có tài khoản đăng ký; không cần biết trước mã đơn. Không chứng minh chiếm tài khoản có email đã đăng ký.
- Sửa: chỉ cấp quyền theo user_id hoặc order access token. Nếu cần nhận lại đơn qua email, dùng quy trình xác minh email/OTP và liên kết đơn rõ ràng.

### 2. Cao: một giao dịch hoàn tất hai đơn khi webhook bị phát lại

- PaymentWebhookController tìm đơn pending bằng phép chứa mã trong nội dung; OrderService dòng 30 dùng firstOrCreate nhưng không kiểm tra giao dịch đã thuộc đơn khác trước khi giao hàng.
- Test tạo hai đơn A/B, một payload có cả hai mã, số tiền chỉ đủ một đơn, cùng referenceCode; gửi payload hai lần với khóa webhook kiểm thử hợp lệ. Cả hai đơn completed nhưng chỉ có một payment.
- Điều kiện: webhook hợp lệ được gửi lại, nội dung chứa hai mã. Đây không phải bằng chứng vượt qua khóa webhook; request không khóa trên API thật trả 401. Chưa gọi nhà cung cấp để xác nhận chính sách retry và định dạng nội dung thực tế.
- Sửa: khóa và kiểm tra tính duy nhất transaction_code trước fulfillment, ràng buộc giao dịch với một order; payload khớp nhiều đơn phải từ chối hoặc chuyển đối soát. Replay phải trả thành công mà không giao thêm hàng.

### 3. Trung bình: bỏ trống email vượt giới hạn hai đơn giữ kho

- CheckoutService dòng 33–42 đặt pendingQuery=null khi không có user_id/email.
- Ba request checkout liên tiếp không email đều thành công và giữ ba tài khoản giả. Throttle 15 request/phút không giải quyết việc mỗi đơn được giữ tối đa 50 tài khoản.
- Sửa: định danh guest phía server, hạn mức số lượng/tổng giá trị kho giữ theo phiên và IP, cùng giới hạn tổng; kiểm tra giới hạn trong transaction để giảm race.

### 4. Trung bình: checkout không ghi nhận chủ đơn dù gửi Bearer token hợp lệ

- CheckoutController dòng 36 gọi request->user() trên route public không có auth:sanctum; test tạo token hợp lệ, checkout vẫn ghi user_id=null.
- Hậu quả: mất liên kết sở hữu, lịch sử đơn và hạn mức theo user không hoạt động như dự kiến; tăng sự phụ thuộc vào đường email không an toàn ở lỗi 1.
- Sửa: resolve optional Sanctum user đúng guard; guest vẫn dùng order token. Không nhận user_id từ JSON của khách.

## Rủi ro qua đọc mã, chưa tái hiện khai thác đầy đủ

- **HTML tải xuống:** DeliveryController dòng 280 dùng innerHTML, chèn dữ liệu credentials/skin và chuỗi vào onclick không escape theo ngữ cảnh. Có nguy cơ XSS nếu kho chứa dữ liệu độc hại. Chưa chạy payload trong trình duyệt; chưa chứng minh khách thường ghi được dữ liệu vào kho. Dùng textContent/createElement và addEventListener.
- **TLS:** AuthController dòng 172/199 và SePayService dòng 72 dùng withoutVerifying. Có nguy cơ giả mạo phản hồi OAuth/thanh toán khi đường mạng hoặc proxy bị can thiệp. Khôi phục kiểm chứng chứng chỉ và cài CA đúng.
- **OAuth:** URL đăng nhập không có state và callback không kiểm tra state; có nguy cơ login CSRF. Chưa chạy luồng Discord thật. Thêm state dùng một lần gắn với phiên và kiểm tra email verified trước khi liên kết tài khoản.
- **Upload:** WarrantyController dòng 113 đặt max:26214400 cho file. Quy tắc file của Laravel dùng KB, nên không tương đương 25 MB. MAX_FILE_SIZE_BYTES và MAX_BATCH_SIZE_BYTES trong service không được dùng trong submitClaim; giới hạn PHP/web server có thể chặn trước. Sửa thành max:25600, thêm tổng dung lượng và số file; chưa gửi file lớn.
- **Đồng thời:** duyệt bảo hành kiểm tra state trước transaction, chưa khóa claim/order item. Cần kiểm thử đồng thời trên DB thật của triển khai; SQLite in-memory không chứng minh an toàn khi tranh chấp.
- Frontend đang phục vụ Next.js development/HMR; không dùng chế độ này cho public production.

## Các kiểm soát đã vượt qua ca thử

- HTTP thật: admin/dashboard, admin/orders, auth/me không token trả 401; /.env và /.git/config ở API trả 404; nguồn Origin lạ không được cấp Access-Control-Allow-Origin.
- HTTP thật: login với mật khẩu dạng SQL injection trả 401; slug dạng SQL injection trả 404; không phải bằng chứng đã loại trừ mọi SQL injection.
- HTTP thật: quantity=-1 trả 422; test-pay trả 404 với thông báo vô hiệu hóa; webhook không khóa trả 401.
- Test cô lập: details/download/download-html/check-acc/warranty-eligibility không token bị 403; token sai bị 403, đúng token được 200.
- Test cô lập: gửi role=admin khi đăng ký vẫn nhận customer; customer gọi admin/dashboard bị 403.
- Test cô lập: sửa price/total_amount/status không thay đổi giá server hay đánh dấu đã trả tiền; quantity 0, -1, 51, số lẻ và chuỗi SQL bị 422.

## Bằng chứng và chạy lại

File tests/Feature/LocalSecurityAuditTest.php: 7 tests, 40 assertions thành công. Các test này xác nhận **hành vi quan sát được, bao gồm lỗi**, không có nghĩa hệ thống an toàn. Sau khi sửa cần đảo assertion của các ca lỗi thành hành vi an toàn.

AuthAndSecurityTest hiện có: 7 tests, 29 assertions thành công.

Chạy trong backend:

```powershell
php artisan test --filter=LocalSecurityAuditTest
php artisan test --filter=AuthAndSecurityTest
```

Các lệnh sử dụng phpunit.xml với DB SQLite :memory:, cache/session array. Không đổi cấu hình test sang DB đang dùng. HTTP live chỉ dùng truy vấn và payload bị từ chối/không khớp đơn; không tạo đơn thật hay trừ kho thật.

## Giới hạn

Đây là một đợt kiểm tra, không phải chứng nhận đã thử mọi cách tấn công. Chưa chạy UI/DevTools bằng trình duyệt, fuzz toàn bộ tham số, quét CVE dependency, tải lớn/DDoS, brute force diện rộng, race trên DB production, upload lớn, toàn bộ luồng OAuth/ngân hàng ngoài localhost, hoặc đầy đủ mọi tổ hợp quyền bảo hành. Những phần này không được coi là đã an toàn. Nên sửa lỗi 1–2 trước khi đưa website ra Internet, rồi kiểm tra lại với tài khoản và kho giả.
