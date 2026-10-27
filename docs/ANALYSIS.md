# PHÂN TÍCH HỆ THỐNG BOT DISCORD & ĐẶC TẢ CHUYỂN ĐỔI SANG WEB E-COMMERCE

> **Tài liệu phân tích kỹ thuật (Technical Analysis & Reverse Engineering)**  
> **Dự án gốc**: `https://github.com/Minhtung0510/SellAccfix` (Discord Bot bán tài khoản game)  
> **Mục tiêu**: Chuyển đổi và mở rộng thành hệ thống Website E-Commerce thương mại hóa chuẩn SEO, giữ nguyên tính tương thích nghiệp vụ với Discord bot.

---

## 1. TỔNG QUAN HỆ THỐNG HIỆN TẠI (DISCORD BOT)

Bot Discord `SellAccfix` vận hành theo mô hình bán tài khoản game tự động qua kênh Discord Guild, sử dụng cấu trúc ticket riêng tư:
* **Framework**: `discord.py` 2.7+ (cogs, dynamic items, modal, views).
* **Nguồn lưu trữ**:
  * Sản phẩm & giá: `prices.json` & `utils/constants.py`.
  * Kho tài khoản: Các file text thuần trong thư mục `data/*.txt`.
  * Đơn hàng: `data/orders.json`.
  * Bảo hành & Lịch sử giao acc: SQLite `data/warranty.sqlite3` kết hợp file upload trong `data/warranty_evidence/`.
* **Cổng thanh toán**: Tích hợp ngân hàng qua dịch vụ **Web2M** (tạo VietQR động theo chuẩn MBBank, tự động đọc biến động số dư qua API `https://api.web2m.com/historyapimb/...`).

---

## 2. PHÂN TÍCH CHI TIẾT CÁC LUỒNG NGHIỆP VỤ (BUSINESS WORKFLOWS)

### 2.1. Luồng mua hàng (Purchase Flow)
1. **Khởi tạo**: Khách vào server Discord, mở ticket riêng (`ticket-...`). Bot tự động gửi menu danh mục game (`valorant`, `csgo2`, `steam`).
2. **Chọn loại tài khoản**:
   * Khách chọn loại acc trong menu thả xuống (`ui/views.py` `AccountSelect`).
   * Bot kiểm tra số lượng tồn kho tức thì qua `Modules.AccountProcess.get_acc_count(file_path)`.
   * Khách chọn số lượng muốn mua (tối đa bằng số lượng tồn kho khả dụng).
3. **Tạo đơn chờ thanh toán (Pending Order)**:
   * Sinh mã ngẫu nhiên 8 ký tự alphanumeric: `order_code = generate_random_code(8)`.
   * Cú pháp chuyển khoản (Memo/Nội dung CK): `ACC-<order_code>`.
   * Tính tổng tiền: `amount = item_price * quantity`.
   * Sinh link ảnh VietQR MBBank:
     `https://apiqr.web2m.com/api/generate/{BANK}/{ACCOUNT_NO}/{NAME_ENC}?amount={amount}&memo={memo}`
   * Ghi đơn vào `data/orders.json` với timestamp `created_at`.
   * Đơn có thời gian sống (TTL): Mặc định `PENDING_TTL_SECONDS = 1800` (30 phút).

### 2.2. Luồng thanh toán (Payment Polling & Verification)
1. **Tiến trình kiểm tra ngầm**: `OrdersCog._order_worker()` trong `cogs/orders.py` thức dậy mỗi chu kỳ `ORDER_POLL_INTERVAL` (mặc định 15 giây) hoặc khi có sự kiện đơn mới.
2. **Tối ưu gọi API Web2M**: Khi có đơn chờ (`pending`), bot gọi `_fetch_history()` đúng 1 lần cho toàn bộ đơn đang active, tránh spam request.
3. **Khớp giao dịch (Transaction Matching)**:
   * Chuẩn hóa chuỗi mô tả giao dịch: Chuyển hoa, gộp `description` + `addDescription`, loại bỏ khoảng trắng.
   * Điều kiện khớp:
     * Mã `order_code` nằm trong nội dung chuyển khoản.
     * Số tiền ghi có `creditAmount` $\ge$ `amount` của đơn hàng.
4. **Xử lý quá hạn (Timeout)**: Nếu `now - created_at > 1800s` mà chưa nhận được tiền, đơn chuyển sang trạng thái timeout và bị xóa khỏi hàng đợi.

### 2.3. Luồng giao tài khoản (Delivery Flow)
1. **Cắt kho (Allocation)**:
   * Khi thanh toán thành công, gọi `Modules.AccountProcess.get_random_acc(account_type, quantity)`.
   * **Định dạng tài khoản hỗ trợ**:
     * *Dạng 1 (Đơn giản)*: `username:password` theo từng dòng.
     * *Dạng 2 (Log tool check chi tiết)*: Khối thông tin phân cách bởi hàng gạch ngang `---------------------------`, chứa `Username:`, `Riot ID:`, `Rank:`, `Total Skins:`, `Knives:`, v.v.
   * Lấy đúng `quantity` tài khoản đầu tiên, ghi đè phần còn lại vào file kho `data/*.txt`.
2. **Giao cho khách**:
   * Nếu số lượng ít: Gửi trực tiếp tin nhắn Discord embed bảo mật (che mật khẩu bằng spoiler `||password||`).
   * Nếu số lượng lớn: Đính kèm file `DTFF_DonHang_<code >.txt`.
   * Lưu thông tin vào bảng `deliveries` trong `warranty.sqlite3` để phục vụ bảo hành.
3. **Trường hợp thiếu kho (Out of stock sau khi thanh toán)**:
   * Đơn đã thanh toán nhưng kho không đủ số lượng: Bot KHÔNG hủy đơn, giữ nguyên trạng thái chờ.
   * Khi Admin nạp thêm kho qua lệnh `/add_account`, tiến trình tự động quét các đơn đang chờ hàng và tự động giao bổ sung.

### 2.4. Luồng kiểm tra tài khoản (Check Acc UI - `ui/check_acc.py`)
* Nút tương tác `Check Acc` cho phép khách tra cứu chi tiết acc đã mua:
  * Hiển thị Riot ID, Rank, Level, tổng số skin, danh sách dao (Melee).
  * Nút "Sao chép TK:MK" nhanh.
  * Nút "Tải File HTML": Tạo giao diện HTML 3D tương tác offline, cho phép khách mở trình duyệt xem toàn bộ kho đồ skin súng và dao một cách trực quan.

### 2.5. Luồng bảo hành tự động (Warranty - `utils/warranty.py` & `ui/warranty.py`)
Quy tắc bảo hành cực kỳ chặt chẽ:
1. **Thời hạn bảo hành (Warranty Window)**:
   * Tài khoản thường: **2 giờ** kể từ thời điểm giao.
   * Tài khoản "Chủ Off" (`_off`): **5 giờ** kể từ thời điểm giao.
2. **Giới hạn số lần đổi**:
   * Mỗi tài khoản gốc chỉ được đổi tối đa **1 lần duy nhất**.
   * Tài khoản bù (thay thế) KHÔNG phát sinh thêm lượt đổi.
3. **Quy mô yêu cầu**:
   * Tối đa **10 tài khoản** trong 1 đợt bảo hành.
   * Khách chọn tài khoản nào cần bảo hành theo vị trí (position index).
4. **Bằng chứng lỗi (Evidence)**:
   * Bắt buộc tải lên đúng **1 ảnh hoặc 1 video** cho mỗi tài khoản yêu cầu + mô tả lỗi.
   * Định dạng cho phép: Ảnh (`PNG`, `JPG`, `GIF`, `WebP`), Video (`MP4`, `MOV`, `WebM`, `AVI`).
   * Giới hạn kích thước: Tối đa **25 MB / file** và **100 MB / đợt**.
   * **Chống gian lận (Anti-fraud)**:
     * Tính mã băm `SHA-256` của file bằng chứng, chặn dùng lại bằng chứng cũ.
     * Kiểm tra magic bytes ở đầu file để đảm bảo không đổi đuôi file giả mạo.
5. **Cấp bù tự động & Atomic Allocation**:
   * Nếu đủ kho: Tự động trích xuất đúng loại tài khoản bù cho khách.
   * Nếu thiếu kho: Giữ nguyên yêu cầu (`pending`), **tuyệt đối không trừ một phần (no partial deduction)**. Đợi admin nạp kho hoặc can thiệp.
   * **Cơ chế phục hồi (Journal recovery)**: Sử dụng kỹ thuật staged file và hash snapshot (`before_hash`, `after_hash`, `staged_file`) để đảm bảo không bị mất acc hoặc lệch kho nếu hệ thống crash giữa chừng.
6. **Ngoại lệ bắt buộc Admin duyệt tay**:
   * Đơn `cs2_prime` và `pubg_plus`: Bắt buộc Admin check tay và bù thủ công, không cấp tự động.
   * Lần yêu cầu bảo hành thứ 3 trở lên: Chuyển sang Admin xử lý tay.

---

## 3. CẤU TRÚC DỮ LIỆU HIỆN TẠI VÀ BẢNG ÁNH XẠ SANG RELATIONAL DATABASE

### 3.1. Danh mục & Bảng giá (`prices.json` -> `categories` & `products`)
| Mã bot cũ | Tên hiển thị | Danh mục | Giá mặc định | Thời gian BH | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `valo_unranked` | Unranked | Valorant | 10.000đ | 2 giờ | Acc thường |
| `valo_iron` | Iron | Valorant | 10.000đ | 2 giờ | Acc thường |
| `valo_bronze` | Bronze | Valorant | 12.000đ | 2 giờ | Acc thường |
| `valo_silver` | Silver | Valorant | 15.000đ | 2 giờ | Acc thường |
| `valo_gold` | Gold | Valorant | 20.000đ | 2 giờ | Acc thường |
| `valo_platinum` | Platinum | Valorant | 25.000đ | 2 giờ | Acc thường |
| `valo_diamond` | Diamond | Valorant | 35.000đ | 2 giờ | Acc thường |
| `valo_ascendant` | Ascendant | Valorant | 50.000đ | 2 giờ | Acc thường |
| `valo_immortal` | Immortal | Valorant | 70.000đ | 2 giờ | Acc thường |
| `valo_radiant` | Radiant | Valorant | 100.000đ | 2 giờ | Acc thường |
| `valo_*_off` | * Chế độ Chủ Off | Valorant | x2 giá thường | **5 giờ** | Acc Chủ Off (xác thực ít onl) |
| `cs2_prime` | CS2 Prime (Ranked) | CS:GO 2 | 50.000đ | 2 giờ | **Bảo hành check tay** |
| `steam_tier_1` | Steam (0-10 Games) | Steam | 5.000đ | 2 giờ | Random theo tier game |
| `steam_tier_2` | Steam (11-40 Games)| Steam | 15.000đ | 2 giờ | Random theo tier game |
| `steam_tier_3` | Steam (41+ Games) | Steam | 25.000đ | 2 giờ | Random theo tier game |
| `pubg_plus` | PUBG Plus | PUBG | 50.000đ | 2 giờ | **Bảo hành check tay** |

### 3.2. Kho tài khoản (`data/*.txt` -> Bảng `account_stock`)
* Cũ: Đọc file phẳng, split regex `---------------------------` hoặc từng dòng.
* Mới trong Laravel: Bảng `account_stock` với các trường:
  * `id`: Khóa chính.
  * `product_id`: Liên kết tới sản phẩm.
  * `account_type`: Mã loại (vd: `valo_gold`).
  * `credentials`: Chuỗi thông tin (username:password hoặc log chi tiết), **bắt buộc mã hóa AES-256 via Laravel Crypt**.
  * `credentials_hash`: SHA-256 của chuỗi gốc để chống nạp trùng cùng 1 acc vào kho.
  * `status`: `available` (sẵn sàng), `reserved` (đang giữ chỗ khi tạo đơn), `sold` (đã bán), `replaced` (acc bù bảo hành), `dead` (acc hỏng).
  * `order_id`: Liên kết đơn hàng khi bán/giữ chỗ.
  * `reserved_at`, `sold_at`.

---

## 4. PHÁT HIỆN LỖI, VẤN ĐỀ VÀ RỦI RO TRONG SOURCE CODE BOT CŨ

Qua quá trình reverse engineering source code bot, chúng tôi phát hiện 6 vấn đề nghiêm trọng cần khắc phục triệt để khi chuyển sang Web:

1. **Race Condition khi cắt kho (File Locking / Concurrency Bug)**:
   * *Hiện tại*: `Modules.AccountProcess.get_random_acc()` đọc toàn bộ file TXT vào RAM, cắt N dòng đầu rồi ghi file tạm `tmp_path`, sau đó `os.replace`.
   * *Nguy cơ*: Khi có 2 giao dịch đồng thời (hoặc vừa có người mua vừa nạp kho), 2 tiến trình đọc cùng một nội dung cũ và ghi đè lên nhau, dẫn tới **bán trùng tài khoản cho 2 khách hàng khác nhau** hoặc mất dữ liệu kho.
   * *Khắc phục trên Web*: Dùng Database Transaction kết hợp **Pessimistic Locking (`SELECT ... FOR UPDATE`)** trên bảng `account_stock`. Không bao giờ có hiện tượng bán trùng.

2. **Race Condition trên file `orders.json`**:
   * *Hiện tại*: Mọi đơn hàng đều đọc/ghi toàn bộ file `orders.json`.
   * *Khắc phục trên Web*: Mỗi đơn hàng là một bản ghi độc lập trong bảng `orders`, quản lý bằng ACID transaction.

3. **Lưu trữ tài khoản dạng Plain Text không an toàn**:
   * *Hiện tại*: Mật khẩu tài khoản game lưu thuần túy trên đĩa cứng. Nếu server bị thâm nhập hoặc lộ file log, toàn bộ kho acc bị mất cắp.
   * *Khắc phục trên Web*: Mã hóa toàn bộ `credentials` bằng AES-256-CBC qua Laravel Encryption Key.

4. **Thanh toán chưa có Idempotency chuẩn**:
   * *Hiện tại*: Dựa vào vòng lặp worker, nếu worker bị crash và khởi động lại trong khi đang xử lý đơn, có thể dẫn đến việc kiểm tra lại và giao acc lần thứ 2 cho cùng 1 mã thanh toán.
   * *Khắc phục trên Web*: Đánh dấu trạng thái thanh toán bằng State Machine nghiêm ngặt (`pending` $\rightarrow$ `paid` $\rightarrow$ `processing` $\rightarrow$ `completed`), chỉ giao acc khi transition thành công.

5. **Giữ chỗ kho (Inventory Reservation) chưa có trong bot**:
   * *Hiện tại*: Bot chỉ trừ kho khi tiền đã về. Nếu lúc tạo đơn kho còn 1 acc, nhưng 10 phút sau khách mới chuyển khoản và lúc đó acc đã bị người khác mua mất, bot sẽ rơi vào trạng thái thiếu kho.
   * *Khắc phục trên Web*: Khi tạo đơn, lập tức chuyển N acc sang trạng thái `reserved` với thời hạn 30 phút. Nếu quá hạn (TTL), Scheduler tự động giải phóng (`reserved` $\rightarrow$ `available`).

6. **Bảo mật file bằng chứng bảo hành**:
   * *Hiện tại*: File upload lưu trữ cục bộ, chưa có cơ chế kiểm duyệt truy cập theo quyền sở hữu (IDOR).
   * *Khắc phục trên Web*: File lưu ngoài thư mục `public` (private storage disk), chỉ người mua đơn đó hoặc Admin mới có quyền tải/xem thông qua **Temporary Signed URLs** có thời hạn ngắn.
