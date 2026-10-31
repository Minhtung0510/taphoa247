# TẠP HÓA 247 — DESIGN SYSTEM SPECIFICATION (`DESIGN.md`)

> **Triết lý thiết kế:** *Cyberpunk Luxe & Modern Fintech*.
> Kết hợp giữa sự huyền bí, tốc độ của thế giới Gaming và sự tinh tế, an toàn, minh bạch của một ứng dụng tài chính cao cấp (Stripe & Linear level).

---

## 1. BẢNG MÀU CHỦ ĐẠO (COLOR TOKENS)

### A. Nền tảng (Backgrounds & Surfaces)
* **Background Deepest (Nền chính toàn trang):** `#050a14` (Đen pha xanh bóng đêm vô tận)
* **Surface Card (Nền thẻ sản phẩm, panel):** `#090b0f` và `#12151c`
* **Surface Raised (Nền modal, dropdown, popover):** `#1a202c`
* **Border Subdued (Đường viền phụ):** `#1e293b` / `rgba(255, 255, 255, 0.08)`
* **Border Active (Đường viền nổi bật):** `#232834` / `rgba(0, 229, 160, 0.3)`

### B. Màu thương hiệu & Điểm nhấn (Accents)
* **Primary Neon Green (Màu chốt đơn, tín hiệu an toàn):** `#00e5a0`
  * Dùng cho: Nút "Mua Ngay", Badge "Sẵn hàng", Trạng thái hoàn thành, Tồn kho lớn hơn 0.
* **Secondary Cyber Blue (Màu công nghệ, liên kết):** `#00c4ff`
  * Dùng cho: Mã đơn hàng, Icon hỗ trợ, Hiệu ứng chuyển màu gradient `from-[#00e5a0] to-[#00c4ff]`.
* **Warning / VIP Gold (Chủ Off, Khuyến mãi đặc biệt):** `#f59e0b` / `#fbbf24`
  * Dùng cho: Gói Chủ Off bảo hiểm 5 tiếng, Đánh giá 5 sao, Doanh thu, Thẻ quà tặng.
* **Danger / Error Red (Cảnh báo, hết hàng):** `#f43f5e` / `#ef4444`
  * Dùng cho: Báo hết hàng, Thất bại, Nút Đăng xuất, Thẻ Hủy đơn.

---

## 2. NGHỆ THUẬT CHỮ & TYPOGRAPHY

* **Font chữ giao diện chính (Sans):** `Inter`, `system-ui`, `-apple-system`, `sans-serif`
  * Trọng lượng font (Font Weight): `font-medium` (500) cho nội dung, `font-bold` (700) cho tiêu đề phụ, `font-black` (900) cho tiêu đề chính.
* **Font chữ kỹ thuật số (Monospace):** `JetBrains Mono`, `Consolas`, `monospace`
  * Dùng cho: Mã đơn hàng (`ACC-XXXX`), giá tiền (`10.000 đ`), mã giảm giá (`CHAOBANMOI`), số lượng tồn kho.

### Thang đo tỷ lệ (Type Scale)
* **Hero Headline:** `text-3xl sm:text-5xl font-black tracking-tight leading-tight`
* **Section Heading:** `text-xl sm:text-2xl font-black text-white tracking-wide`
* **Card Title:** `text-sm sm:text-base font-bold text-white`
* **Body / Subtitle:** `text-xs sm:text-sm text-slate-400 font-normal leading-relaxed`
* **Micro Badge:** `text-[10px] sm:text-[11px] font-bold tracking-wider uppercase`

---

## 3. ĐỘ BO GÓC & ĐỘ SÂU (RADIUS & ELEVATION)

### A. Bo góc (Border Radius)
* **Nút bấm chính & Ô nhập liệu (Inputs & Primary Buttons):** `rounded-xl` (12px)
* **Thẻ sản phẩm & Panel nội dung (Cards):** `rounded-2xl` (16px) hoặc `rounded-3xl` (24px)
* **Badge trạng thái & Pill tag:** `rounded-full` (9999px)

### B. Ánh sáng & Độ sâu (Glow & Ambient Elevation)
* **Thẻ bình thường:** `border border-[#232834] bg-[#12151c]/90 backdrop-blur-md`
* **Thẻ khi hover:** `hover:border-[#00e5a0]/50 hover:shadow-[0_0_25px_rgba(0,229,160,0.15)] transition-all duration-300`
* **Nút CTA chính:** `bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black shadow-lg shadow-[#00e5a0]/25 hover:brightness-110 active:scale-95`

---

## 4. QUY TẮC CÔNG THÁI HỌC & ACCESSIBILITY (a11y)

1. **Vùng chạm tối thiểu trên Mobile:** Mọi nút bấm, link hoặc icon có thể click phải có kích thước tối thiểu `44x44px` để tránh bấm trượt.
2. **Không dùng `transition: all`:** Luôn chỉ định rõ thuộc tính chuyển động (ví dụ: `transition-colors`, `transition-transform`, `transition-opacity duration-200`) để đảm bảo 60fps trên điện thoại.
3. **Độ tương phản chữ:** Không bao giờ dùng màu xám quá tối (`text-slate-600` trở xuống) trên nền đen. Tối thiểu là `text-slate-400` cho phụ đề và `text-white` cho nội dung chính.
4. **Không bao giờ dùng Alert trình duyệt thô lỗ:** Mọi thông báo phải dùng toast hoặc modal bo tròn cyberpunk đồng bộ.

---

## 5. CẤU TRÚC COMPONENT CHUẨN MẪU

### Thẻ Sản Phẩm Chuẩn (Product Card):
```tsx
<div className="group relative bg-[#090b0f] border border-[#1e293b] hover:border-[#00e5a0]/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,160,0.12)] flex flex-col justify-between">
  {/* Header: Logo game & Badge */}
  {/* Body: Tên gói, Account Type monospace, Bảo hành */}
  {/* Footer: Giá tiền nổi bật + Nút Mua Ngay Gradient */}
</div>
```

---

## 6. QUY TẮC BẤT DI BẤT DỊCH (DO'S & DON'TS)

* ✅ **DO:** Luôn hiển thị giá tiền bằng font monospace kèm dấu phân cách hàng nghìn (`.toLocaleString('vi-VN') đ`).
* ✅ **DO:** Luôn hiển thị trạng thái tồn kho rõ ràng: xanh nếu còn hàng, đỏ nếu hết hàng.
* ❌ **DON'T:** Không dùng màu tím hoặc gradient AI lờ mờ (AI Slop).
* ❌ **DON'T:** Không nhồi nhét thẻ card lồng trong card lồng trong card.
