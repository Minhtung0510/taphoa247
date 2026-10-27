# KIẾN TRÚC HỆ THỐNG WEB E-COMMERCE BÁN TÀI KHOẢN GAME (SYSTEM ARCHITECTURE)

> **Dự án**: DTFF Gaming Shop (Chuyển đổi từ Discord Bot `SellAccfix`)  
> **Kiến trúc**: Monorepo Decoupled Architecture (`/backend` Laravel 11 REST API + `/frontend` Next.js 14/15 App Router)

---

## 1. SƠ ĐỒ THỰC THỂ LIÊN KẾT (ENTITY RELATIONSHIP DIAGRAM - ERD)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ WARRANTY_CLAIMS : "submits"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ ACCOUNT_STOCK : "has"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered_in"
    ORDERS ||--|{ ORDER_ITEMS : "includes"
    ORDERS ||--o{ PAYMENTS : "paid_by"
    ORDERS ||--o{ WARRANTY_CLAIMS : "has"
    ORDER_ITEMS ||--o| ACCOUNT_STOCK : "delivers"
    WARRANTY_CLAIMS ||--|{ CLAIM_ITEMS : "contains"
    CLAIM_ITEMS ||--o| ACCOUNT_STOCK : "replaces_with"
    USERS ||--o{ AUDIT_LOGS : "performs"

    USERS {
        bigint id PK
        string name
        string email UK
        string password
        string role "admin|customer"
        string remember_token
        timestamp created_at
    }

    CATEGORIES {
        bigint id PK
        string name "Valorant|CS2|Steam|PUBG"
        string slug UK "valorant|cs2|steam|pubg"
        text description
        string icon
        int sort_order
        boolean is_active
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        string name
        string slug UK "valo-unranked|valo-diamond-off"
        string account_type UK "valo_unranked|cs2_prime..."
        bigint price "VND"
        int warranty_hours "2 or 5"
        boolean is_auto_warranty "true except cs2_prime/pubg_plus"
        boolean is_off_mode "true for _off products"
        text short_description
        longtext details_markdown
        json badges "['Best Seller', 'Bảo Hành 5h']"
        boolean is_active
        timestamps timestamps
    }

    ACCOUNT_STOCK {
        bigint id PK
        bigint product_id FK
        string account_type
        text credentials "AES-256 encrypted raw credentials/log"
        string credentials_hash UK "SHA-256 for deduplication"
        string status "available|reserved|sold|replaced|dead"
        bigint order_id FK "nullable"
        timestamp reserved_at "nullable"
        timestamp sold_at "nullable"
        timestamps timestamps
    }

    ORDERS {
        bigint id PK
        string order_code UK "8 chars alphanumeric: ACC-XXXXXXXX"
        bigint user_id FK "nullable (guest checkout allowed)"
        string customer_name
        string customer_email
        string customer_phone "nullable"
        string memo UK "ACC-XXXXXXXX"
        bigint total_amount "VND"
        string status "pending|paid|processing|completed|cancelled|timeout"
        string payment_gateway "web2m"
        string qr_url
        string delivery_format "inline|txt_file"
        timestamp paid_at "nullable"
        timestamp expires_at "created_at + 1800s"
        timestamps timestamps
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        bigint account_stock_id FK
        int quantity
        bigint unit_price
        bigint subtotal
        int position "Index 0..N in order"
        text delivered_credentials "AES-256 snapshot at delivery"
        int warranty_duration_hours
        timestamp warranty_expires_at
        int replacement_count "Max 1"
        timestamps timestamps
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK
        string transaction_code UK "Web2M / Bank ref number"
        bigint amount
        string bank_code "MBB"
        string account_no
        string memo_received
        text raw_payload "JSON response from Web2M"
        timestamp transaction_time
        timestamps timestamps
    }

    WARRANTY_CLAIMS {
        bigint id PK
        string claim_code UK
        bigint order_id FK
        bigint user_id FK "nullable"
        string state "pending|approved|rejected|waiting_stock"
        int attempt "1, 2, 3+"
        text buyer_note
        text admin_note "nullable"
        bigint resolved_by FK "admin user id"
        timestamp resolved_at "nullable"
        timestamps timestamps
    }

    CLAIM_ITEMS {
        bigint id PK
        bigint warranty_claim_id FK
        bigint order_item_id FK
        string evidence_path "Private disk path"
        string evidence_hash "SHA-256"
        string evidence_mime "image/png, video/mp4..."
        bigint replacement_stock_id FK "nullable"
        text error_description
        timestamps timestamps
    }

    AUDIT_LOGS {
        bigint id PK
        bigint user_id FK
        string action "stock_import|price_update|claim_resolve"
        string ip_address
        text user_agent
        json details
        timestamps timestamps
    }

    SETTINGS {
        string key PK
        text value
        string type "string|integer|boolean|json"
    }
```

---

## 2. DANH SÁCH RESTFUL API SPECIFICATION

Toàn bộ API trả về JSON chuẩn theo cấu trúc:
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo nếu có",
  "meta": { ... }
}
```

### 2.1. Public Catalog & Storefront API
| Phương thức | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Lấy danh mục game kèm số lượng sản phẩm | Public |
| `GET` | `/api/v1/categories/{slug}` | Chi tiết danh mục kèm sản phẩm và SEO data | Public |
| `GET` | `/api/v1/products` | Danh sách sản phẩm, lọc theo game, trạng thái còn hàng | Public |
| `GET` | `/api/v1/products/{slug}` | Chi tiết sản phẩm, giá, tồn kho realtime, đánh giá | Public |
| `GET` | `/api/v1/store/stats` | Thống kê số lượng acc đã bán, số người xem online | Public |

### 2.2. Checkout & Payment API
| Phương thức | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders/checkout` | Tạo đơn hàng, giữ chỗ kho (reserve), sinh QR VietQR | Public / Guest |
| `GET` | `/api/v1/orders/{order_code}/status` | Tra cứu trạng thái đơn hàng (polling/status) | Public (Order Token/Guest) |
| `GET` | `/api/v1/orders/{order_code}/stream` | Server-Sent Events (SSE) theo dõi biến động thanh toán | Public |
| `POST` | `/api/v1/webhooks/web2m` | Webhook nhận biến động số dư từ Web2M (nếu có) | Web2M Secret |

### 2.3. Delivery & Check Acc API
| Phương thức | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders/{order_code}/details` | Xem chi tiết đơn hàng & acc đã mua | Chủ đơn / Auth |
| `GET` | `/api/v1/orders/{order_code}/download` | Tải file TXT danh sách tài khoản | Chủ đơn / Auth |
| `GET` | `/api/v1/orders/{order_code}/check-acc/{position}` | Xem chi tiết thông tin acc, skin, rank, dao | Chủ đơn / Auth |
| `GET` | `/api/v1/orders/{order_code}/download-html` | Tải file HTML 3D Interactive Kho Acc | Chủ đơn / Auth |

### 2.4. Warranty (Bảo Hành) API
| Phương thức | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders/{order_code}/warranty-eligibility` | Kiểm tra các acc còn hạn bảo hành trong đơn | Chủ đơn / Auth |
| `POST` | `/api/v1/warranty/claims` | Gửi yêu cầu bảo hành (kèm upload 1 ảnh/video mỗi acc) | Chủ đơn / Auth |
| `GET` | `/api/v1/warranty/claims/{claim_code}` | Tra cứu trạng thái xử lý bảo hành | Chủ đơn / Auth |
| `GET` | `/api/v1/warranty/evidence/{id}` | Xem file bằng chứng (Temporary Signed URL) | Chủ đơn / Admin |

### 2.5. Admin Management API (Laravel Sanctum - Role: Admin)
| Phương thức | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Thống kê doanh thu, số đơn, tồn kho, yêu cầu BH | Admin |
| `GET/POST` | `/api/v1/admin/products` | CRUD sản phẩm, cập nhật giá | Admin |
| `POST` | `/api/v1/admin/stock/import` | Nạp kho bằng file TXT hoặc paste text | Admin |
| `GET` | `/api/v1/admin/stock` | Xem danh sách kho tồn, phân trang, lọc trạng thái | Admin |
| `GET` | `/api/v1/admin/orders` | Danh sách đơn hàng, tìm kiếm, xuất báo cáo Excel | Admin |
| `POST` | `/api/v1/admin/orders/{code}/force-complete` | Khớp đơn tay cho khách | Admin |
| `GET` | `/api/v1/admin/warranty` | Danh sách yêu cầu bảo hành chờ duyệt | Admin |
| `POST` | `/api/v1/admin/warranty/{id}/approve` | Duyệt bảo hành & cấp bù acc thủ công | Admin |
| `POST` | `/api/v1/admin/warranty/{id}/reject` | Từ chối bảo hành kèm lý do | Admin |

---

## 3. SƠ ĐỒ LUỒNG ĐƠN HÀNG & BẢO HÀNH (STATE MACHINES)

### 3.1. Luồng Đơn Hàng & Giữ Chỗ Kho (Order Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant Web as Next.js Frontend
    participant API as Laravel 11 API
    participant DB as Database (Pessimistic Lock)
    participant Web2M as Web2M / MBBank
    participant Queue as Laravel Scheduler/Queue

    Customer->>Web: Chọn loại acc (VD: Valo Gold) & số lượng (2)
    Web->>API: POST /orders/checkout
    activate API
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT * FROM account_stock WHERE status='available' LIMIT 2 FOR UPDATE
    alt Không đủ tồn kho
        API->>Web: 422 Lỗi: Kho không đủ số lượng
    else Đủ kho
        API->>DB: Cập nhật status='reserved', reserved_at=NOW
        API->>DB: Tạo ORDER (status='pending', expires_at=NOW+1800s, memo='ACC-ABC12345')
        API->>DB: COMMIT TRANSACTION
        API->>Web: Trả về QR MBBank + memo + countdown 30 phút
    end
    deactivate API

    Customer->>Web2M: Quét mã VietQR chuyển khoản ngân hàng

    loop Polling mỗi 15s (hoặc Webhook)
        Queue->>Web2M: GET /historyapimb/{pass}/{acc}/{token}
        Web2M-->>Queue: Danh sách giao dịch mới
        Queue->>DB: Kiểm tra memo 'ACC-ABC12345' & số tiền >= tổng đơn
        alt Khớp thanh toán
            Queue->>DB: BEGIN TRANSACTION
            Queue->>DB: UPDATE orders SET status='completed', paid_at=NOW
            Queue->>DB: UPDATE account_stock SET status='sold' WHERE id IN (...)
            Queue->>DB: Ghi log payments & order_items
            Queue->>DB: COMMIT
            Queue->>Web: Bắn sự kiện SSE: Đã thanh toán thành công!
        end
    end

    alt Quá hạn 30 phút mà chưa thanh toán
        Queue->>DB: SELECT * FROM orders WHERE status='pending' AND expires_at < NOW
        Queue->>DB: UPDATE account_stock SET status='available' WHERE order_id=...
        Queue->>DB: UPDATE orders SET status='timeout'
    end
```

### 3.2. Luồng Bảo Hành Tự Động (Warranty Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant Web as Next.js Frontend
    participant API as Laravel 11 API
    participant DB as Database
    actor Admin as Quản Trị Viên

    Customer->>Web: Vào trang Bảo hành, nhập Mã đơn hàng
    Web->>API: GET /orders/{code}/warranty-eligibility
    API->>DB: Kiểm tra: Còn trong hạn 2h (hoặc 5h)? Đã đổi lần nào chưa?
    API-->>Web: Danh sách các vị trí acc đủ điều kiện bảo hành

    Customer->>Web: Chọn acc lỗi (max 10 acc) + Upload ảnh/video lỗi + Mô tả
    Web->>API: POST /warranty/claims
    activate API
    API->>API: Kiểm tra magic bytes ảnh/video, kích thước <= 25MB/file, tổng <= 100MB
    API->>API: Tính SHA-256 hash của từng file bằng chứng
    API->>DB: Chặn nếu SHA-256 đã tồn tại trong bảng claim_items (chống gian lận)
    API->>DB: Lưu file vào private disk: storage/app/warranty_evidence/
    API->>DB: Tạo WARRANTY_CLAIM (state='pending')

    alt Loại game là cs2_prime hoặc pubg_plus HOẶC lần bảo hành thứ 3+
        API->>DB: Cập nhật state='waiting_admin' (Bắt buộc Admin check tay)
        API-->>Web: "Yêu cầu đã được gửi, Admin sẽ kiểm tra và bù acc trong 15 phút"
    else Tự động cấp bù
        API->>DB: BEGIN TRANSACTION
        API->>DB: SELECT * FROM account_stock WHERE account_type=... AND status='available' LIMIT needed FOR UPDATE
        alt Đủ kho bù
            API->>DB: Cập nhật acc mới status='replaced'
            API->>DB: Cập nhật claim state='approved', resolved_at=NOW
            API->>DB: COMMIT
            API-->>Web: Trả về tài khoản bù mới ngay lập tức
        else Thiếu kho bù
            API->>DB: ROLLBACK (Tuyệt đối không trừ một phần kho)
            API->>DB: Cập nhật claim state='waiting_stock'
            API-->>Web: "Đã ghi nhận lỗi. Kho tạm hết, hệ thống sẽ tự cấp acc ngay khi nạp kho!"
        end
    end
    deactivate API
```

---

## 4. CHIẾN LƯỢC BẢO MẬT TOÀN DIỆN (SECURITY ARCHITECTURE)

1. **Mã hóa tài khoản ở trạng thái tĩnh (Encryption at Rest)**:
   * Toàn bộ mật khẩu, cookie, mã đăng nhập game được mã hóa bằng thuật toán `AES-256-CBC` với App Key được quản lý nghiêm ngặt qua biến môi trường.
2. **Chống tấn công IDOR (Insecure Direct Object Reference)**:
   * Khách hàng truy cập đơn hàng phải có Token xác thực đơn hàng hoặc đăng nhập đúng tài khoản sở hữu.
   * File bằng chứng bảo hành không công khai URL trực tiếp, chỉ truy cập qua Temporary Signed URL có thời hạn tối đa 15 phút.
3. **Chống Upload File Độc Hại**:
   * Kiểm tra MIME-type, phần mở rộng và đọc **Magic Bytes** trực tiếp (VD: `FF D8 FF` cho JPEG, `89 50 4E 47` cho PNG, `00 00 00 ... ftyp` cho MP4).
   * File lưu trữ không có quyền thực thi (`chmod 600`), tên file được hash ngẫu nhiên bằng UUIDv4.
4. **Rate Limiting & Chống Brute Force**:
   * Login: Tối đa 5 lần/phút.
   * Checkout: Tối đa 10 lần/phút/IP.
   * Check đơn/Tra cứu: Tối đa 30 lần/phút.
5. **Chống SQL Injection, XSS & CSRF**:
   * Sử dụng Eloquent ORM và Prepared Statements 100%.
   * Sanitization mọi input người dùng.
   * CORS được whitelist chính xác domain frontend Next.js.

---

## 5. CHIẾN LƯỢC SEO CHUẨN TỐI ƯU (SEO TECHNICAL STRATEGY)

1. **Cấu trúc URL Thân Thiện (Clean Slugs)**:
   * Trang chủ: `/`
   * Danh mục game: `/valorant`, `/cs2`, `/steam`, `/pubg`
   * Trang sản phẩm: `/valorant/acc-valorant-diamond-chu-off`, `/cs2/acc-cs2-prime`
   * Blog hướng dẫn: `/huong-dan/cach-doi-mat-khau-acc-valorant`
2. **Metadata & OpenGraph Động (Dynamic Metadata)**:
   * Mỗi trang có `generateMetadata` riêng biệt: Title 50–60 ký tự, Description 140–160 ký tự, Canonical URL tự động, OpenGraph Image động.
3. **Structured Data (JSON-LD)**:
   * `Organization` & `WebSite` với SearchAction ở trang chủ.
   * `Product` + `Offer` với giá tiền VND, tình trạng còn hàng (`InStock` / `OutOfStock`) khớp 100% với tồn kho thực tế.
   * `BreadcrumbList` cho mọi trang con.
   * `FAQPage` cho trang danh mục và FAQ.
4. **Sitemap & Robots**:
   * `app/sitemap.ts`: Tự động sinh danh sách toàn bộ danh mục, sản phẩm, bài viết với `lastModified` chuẩn xác.
   * `app/robots.ts`: Chặn bot index các trang riêng tư (`/admin`, `/checkout`, `/don-hang/*`).
5. **Core Web Vitals & Hiệu Năng**:
   * Toàn bộ sản phẩm được fetch phía Server (Server Component + ISR revalidate 60s), cấm fetch bằng `useEffect`.
   * Ảnh tối ưu tự động bằng `next/image` định dạng AVIF/WebP.
   * LCP < 2.5s, CLS < 0.1, INP < 200ms.
6. **Conversion Tracking**:
   * GA4 + Facebook Pixel tích hợp phía Client.
   * **Facebook Conversions API (CAPI)** bắn trực tiếp từ Laravel khi đơn hàng chuyển trạng thái `completed`, deduplicate qua `event_id = order_code`.
