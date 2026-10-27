# DANH SÁCH CÁC QUYẾT ĐỊNH KIẾN TRÚC & KỸ THUẬT (ARCHITECTURAL DECISIONS)

Tài liệu này ghi lại toàn bộ các quyết định kỹ thuật tự chủ (Architecture Decision Records - ADR) của nhóm phát triển trong quá trình thiết kế và chuyển đổi hệ thống bán tài khoản `SellAccfix` sang Web.

---

### DECISION 01: CƠ CHẾ KHÓA DỮ LIỆU & CHỐNG BÁN TRÙNG KHO (CONCURRENCY CONTROL)
* **Bối cảnh**: Hệ thống cũ dùng file text (`data/*.txt`), khi nhiều người cùng mua hoặc vừa mua vừa nạp kho dễ bị race condition đè file gây bán trùng hoặc mất acc.
* **Quyết định**: Sử dụng bảng cơ sở dữ liệu `account_stock` với **Pessimistic Locking (`SELECT ... FOR UPDATE`)** trong database transaction. Khi khách bấm tạo đơn thanh toán, hệ thống sẽ "giữ chân" (reserve) các tài khoản này trong vòng 30 phút (TTL). Khách khác không thể nhìn thấy hoặc mua trúng các acc này. Nếu đơn quá hạn mà chưa thanh toán, scheduler sẽ nhả về trạng thái `available`.
* **Hệ quả**: Triệt tiêu 100% rủi ro bán trùng tài khoản khi traffic tăng cao.

---

### DECISION 02: BẢO MẬT DỮ LIỆU TÀI KHOẢN (ENCRYPTION AT REST)
* **Bối cảnh**: Acc game chứa thông tin nhạy cảm (Username, Password, Cookie/Token). Lưu plain-text như bot cũ là rủi ro bảo mật nghiêm trọng.
* **Quyết định**: Mọi thông tin `credentials` trong bảng `account_stock` và `order_items` được mã hóa 2 chiều bằng **AES-256-CBC qua Laravel Crypt**. Key mã hóa nằm trong `APP_KEY` (.env). Thêm trường `credentials_hash` (SHA-256 một chiều) để index tìm kiếm và ngăn chặn admin vô tình nạp trùng cùng một tài khoản nhiều lần vào kho.
* **Hệ quả**: Nếu database bị leak, kẻ tấn công cũng không thể đọc được mật khẩu tài khoản.

---

### DECISION 03: ĐỒNG BỘ DỮ LIỆU GIỮA BOT DISCORD VÀ WEB
* **Bối cảnh**: Yêu cầu đề bài: Bot Discord hiện tại vẫn giữ nguyên hoạt động, website là kênh bán mới dùng chung nghiệp vụ.
* **Quyết định**: 
  1. Website sẽ là nguồn dữ liệu chuẩn (Single Source of Truth) lưu trong MySQL/PostgreSQL.
  2. Cung cấp lệnh Artisan `php artisan inventory:import-legacy` để import toàn bộ kho cũ (`data/*.txt`), đơn cũ (`orders.json`) và lịch sử bảo hành (`warranty.sqlite3`).
  3. Để bot Discord cũ vẫn hoạt động mà không bị xung đột, Laravel cung cấp các endpoint nội bộ hoặc Artisan sync xuất ngược file TXT định kỳ nếu admin vẫn muốn chạy bot Discord cũ song song; hoặc bot Discord có thể gọi trực tiếp API của Laravel qua token bot.

---

### DECISION 04: LUỒNG THANH TOÁN IDEMPOTENT VỚI WEB2M
* **Bối cảnh**: Web2M trả về lịch sử giao dịch ngân hàng MBBank. Cần cơ chế gọi định kỳ và webhook (nếu có) sao cho một giao dịch không bao giờ được ghi nhận hay giao acc 2 lần.
* **Quyết định**:
  1. Mỗi đơn hàng có một `order_code` ngẫu nhiên 8 ký tự duy nhất (VD: `ACC-X9K2LA18`).
  2. Bảng `payments` ghi nhận mã giao dịch ngân hàng (`transaction_id` hoặc chuỗi hash nội dung giao dịch) với ràng buộc `UNIQUE`.
  3. Xử lý thanh toán thông qua Job Queue với cơ chế `atomic lock` (Redis lock) theo `order_code`.
  4. Hỗ trợ chế độ `PAYMENT_TEST_MODE=true` trong môi trường dev/staging để giả lập thanh toán thành công tức thì mà không cần nạp tiền thật.

---

### DECISION 05: BẢO MẬT FILE BẰNG CHỨNG BẢO HÀNH (SECURE EVIDENCE STORAGE)
* **Bối cảnh**: Bằng chứng bảo hành (ảnh/video) có thể bị khai thác để upload shell độc hại hoặc truy cập trái phép (IDOR).
* **Quyết định**:
  1. File tải lên được lưu tại thư mục riêng biệt ngoài public web root (`storage/app/warranty_evidence/`).
  2. Kiểm tra chặt chẽ: Dung lượng tối đa 25MB/file, 100MB/đợt; kiểm tra phần mở rộng; **kiểm tra magic bytes** của các định dạng cho phép (PNG, JPG, GIF, WebP, MP4, MOV, WebM, AVI).
  3. Lưu `evidence_hash` (SHA-256) vào bảng `claim_items` để ngăn chặn khách hàng dùng lại ảnh lỗi cũ hoặc ảnh của người khác.
  4. Xem/tải file bằng **Temporary Signed URL** (chỉ có hiệu lực trong 15 phút và yêu cầu đúng quyền sở hữu đơn hàng hoặc Admin).

---

### DECISION 06: KIẾN TRÚC FRONTEND NEXT.JS (APP ROUTER + SSR/ISR)
* **Bối cảnh**: Yêu cầu bắt buộc chuẩn SEO, Core Web Vitals tối ưu, cấm render sản phẩm bằng `useEffect`.
* **Quyết định**:
  1. Toàn bộ trang Catalog, Game Category, Product Detail, Blog, FAQ, Policy được render phía Server bằng **Server Components**.
  2. Dùng cơ chế **ISR (Incremental Static Regeneration)** với thời gian revalidate hợp lý (60 giây) kết hợp tag-based revalidation (`revalidateTag`) khi kho hàng hoặc giá thay đổi.
  3. Trang Checkout và Check Acc sử dụng Client Components cho phần đếm ngược thời gian và tương tác sao chép nhanh, nhưng dữ liệu khung ban đầu vẫn được nạp qua SSR.
  4. Giao diện Dark Gaming cao cấp (tông màu đen obsidian, xám than chì, điểm nhấn xanh ngọc neon/vàng kim) phù hợp với người chơi game Valorant, CS2, Steam.
