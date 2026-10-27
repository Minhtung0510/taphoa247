# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROJECT PROGRESS TRACKER)

| Giai đoạn | Trạng thái | Chi tiết thực hiện |
| :--- | :--- | :--- |
| **BƯỚC 0 — ĐỌC & PHÂN TÍCH SOURCE BOT** | ✅ **HOÀN THÀNH** | Đã đọc kỹ toàn bộ repo `SellAccfix`. Viết tài liệu [docs/ANALYSIS.md](file:///c:/Users/Administrator/Desktop/Test/docs/ANALYSIS.md). Phát hiện 6 lỗi/rủi ro trong code cũ và lập phương án khắc phục. |
| **BƯỚC 1 — THIẾT KẾ KIẾN TRÚC** | 🔄 **ĐANG TIẾN HÀNH** | Soạn thảo [docs/ARCHITECTURE.md](file:///c:/Users/Administrator/Desktop/Test/docs/ARCHITECTURE.md) (ERD, danh sách API, luồng Checkout/Bảo hành, Chiến lược Bảo mật, Chiến lược SEO). Lập [docs/DECISIONS.md](file:///c:/Users/Administrator/Desktop/Test/docs/DECISIONS.md). |
| **BƯỚC 2 — BACKEND (LARAVEL 11 API)** | ⏳ **CHỜ BẮT ĐẦU** | Xây dựng core API Laravel, Database Migrations, Models, Services, Checkout lock, Payment poller, Warranty engine, Admin API, Import Artisan commands. |
| **BƯỚC 3 — FRONTEND (NEXT.JS APP ROUTER)** | ⏳ **CHỜ BẮT ĐẦU** | Cài đặt Next.js + TypeScript + Tailwind CSS, Dark gaming theme, SSR/ISR Catalog, Live Checkout QR, Check Acc viewer, Warranty portal, Admin Dashboard. |
| **BƯỚC 4 — TỐI ƯU SEO & TRACKING** | ⏳ **CHỜ BẮT ĐẦU** | Metadata, OpenGraph, JSON-LD schemas, sitemap.ts, robots.ts, GA4, FB Pixel + CAPI từ Laravel, Core Web Vitals audit, [docs/SEO_REPORT.md](file:///c:/Users/Administrator/Desktop/Test/docs/SEO_REPORT.md). |
| **BƯỚC 5 — KIỂM THỬ TOÀN DIỆN** | ⏳ **CHỜ BẮT ĐẦU** | Unit & Feature tests (Concurrency lock, Idempotent payment, Auto release, Warranty rules, IDOR), Frontend test (Playwright), PAYMENT_TEST_MODE. |
| **BƯỚC 6 — ĐÓNG GÓI & TRIỂN KHAI** | ⏳ **CHỜ BẮT ĐẦU** | Dockerfile, docker-compose.yml (Nginx, PHP-FPM, MySQL, Redis, Node), tài liệu [docs/DEPLOY.md](file:///c:/Users/Administrator/Desktop/Test/docs/DEPLOY.md). |

---

## NHẬT KÝ CHI TIẾT (ACTION LOGS)
* **2026-10-27 19:00**: Khởi tạo workspace monorepo.
* **2026-10-27 19:02**: Đọc và reverse-engineer toàn bộ cogs, modules, UI, storage và tests của bot Discord `SellAccfix`.
* **2026-10-27 19:03**: Hoàn thành `docs/ANALYSIS.md` đặc tả toàn bộ nghiệp vụ và rủi ro.
* **2026-10-27 19:04**: Hoàn thành `docs/DECISIONS.md` với 6 quyết định kỹ thuật then chốt.
* **2026-10-27 19:04**: Cài đặt môi trường runtime (Git, Node.js 24, PHP 8.3).
