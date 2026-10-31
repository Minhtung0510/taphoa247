# TẠP HÓA 247 — AGENT RULES & CONSTRAINTS

## 🚨 QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ)

### 1. CẤM TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý ĐỤNG VÀO PHẦN THANH TOÁN (SEPAY / PAYMENT / CHECKOUT)
- **Tuyệt đối KHÔNG ĐƯỢC CHỈNH SỬA các file sau trừ khi người dùng yêu cầu trực tiếp:**
  - `backend/app/Services/SePayService.php`
  - `backend/app/Http/Controllers/Api/PaymentWebhookController.php`
  - `backend/app/Http/Controllers/Api/CheckoutController.php` (các hàm xử lý polling/đối soát)
  - `backend/app/Services/OrderService.php` (hàm `fulfillOrder`)
- **Lưu ý kỹ thuật sống còn:**
  - Trên môi trường Windows / local development, PHP cURL không có chứng chỉ CA mặc định. Bất kỳ ai xóa `withoutVerifying()` sẽ gây lỗi `cURL error 60`, làm đứt toàn bộ kết nối SePay khiến tiền nhận mà hệ thống không tự động giao tài khoản.
  - Thuật toán so khớp mã đơn hàng (Memo) đã hoàn thiện và bao quát toàn bộ trường hợp: có gạch (`ACC-XXXX`), không gạch (`ACCXXXX`), mã ngắn (`XXXX`), và trường hợp ngân hàng (như TPBank/Napas) cắt ngắn bớt ký tự cuối (`ACCSWQNO..`). Giữ nguyên tuyệt đối.

---

### 2. CẤM TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỂ LỘ HOẶC NHẮC ĐẾN TÊN CÁC SHOP / NGUỒN RESELL (SHOPMMO, DIGISHOP, V.V.)
- **Bảo mật mô hình kinh doanh Resell/Dropship:** Tuyệt đối KHÔNG ĐƯỢC để bất kỳ từ ngữ nào liên quan đến các shop nguồn nhập hàng như `ShopMMO`, `ShopMMO.pro`, `tools.shopmmo.pro`, `DigiShop`, `sub.digishop.work` xuất hiện ở:
  - Frontend (mọi trang, component, header, footer, modal, chatbot AI).
  - SEO Metadata (title, description, keywords, OpenGraph, JSON-LD, sitemap).
  - Tên file tải về (dùng `SteamLoader.exe` thay vì `ShopMMO-SteamLoader.exe`).
  - Dữ liệu hiển thị cho khách hàng trong Database (`details_markdown`, `short_description`, `name`, `badges`).
- Tất cả dịch vụ, công cụ phải được quy chuẩn về thương hiệu **Tạp Hóa 247** hoặc tên công cụ độc lập trung tính (ví dụ: `SteamLoader.exe`, `Cổng API Sub Credits`, `Cursor Tool Extension`).

---
