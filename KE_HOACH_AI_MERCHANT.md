# KẾ HOẠCH TỔNG THỂ (V5): AI MERCHANT TỰ ĐỘNG HÓA HOÀN TOÀN — NHẬP HÀNG, ĐẠT KPI & VẬN HÀNH BẰNG APPGATEWAY

**Cập nhật:** 29/10/2026 · **Phiên bản:** V5 (Bản chuẩn hóa theo Mục tiêu cốt lõi của Dự án)  
**Hạ tầng thanh toán:** Tích hợp trực tiếp **AppGateWay** (Hệ thống Gateway Android nội bộ, không phụ thuộc SePay)  
**Thị trường mục tiêu:** Dịch vụ số, Tài khoản AI Gen (Kling AI, Suno, Veo 3, Grok, Cursor), Tools Creator (CapCut Pro, Canva, Adobe) và Bản quyền tài chính/năng suất theo mô hình `khoahocgiare.org` & `digishop.work`.

---

## PHẦN 0. MỤC TIÊU CỐT LÕI CỦA DỰ ÁN (CORE MISSION)

> **TÔN CHỈ BAN ĐẦU CỦA DỰ ÁN:**
> 1. **Bạn là "Nhà đầu tư / Boss"**: Cấp ngân sách theo ngày (`daily_cap`, ví dụ: 500.000đ – 1.000.000đ/ngày) và đặt chỉ tiêu KPI (doanh thu, lợi nhuận ròng, tỷ lệ hoàn đơn).
> 2. **AI là "Giám đốc điều hành kiêm Nhân viên tự hành" (Autonomous AI Merchant)**:
>    - **Tự tìm nguồn & nhập hàng**: Khảo sát giá, tìm nguồn sỉ rẻ, kiểm tra chất lượng (Health check), tự đặt mua lô nhỏ trong hạn mức.
>    - **Tự định giá & Marketing**: Tự điều chỉnh giá bán theo sàn lãi (`final_price`), tự tung Voucher, Hộp Quà 3D, Flash Sale trên shop để hút khách.
>    - **Tự giao hàng & Đối soát**: Khách trả tiền qua QR ➔ AppGateWay báo về ➔ AI giao hàng trong 2 giây ➔ Tự ghi nhận KPI.
>    - **Tự bảo vệ vốn (Kill Switch)**: Nếu tỷ lệ lỗi cao, nguồn hàng lừa đảo hoặc không đạt KPI lợi nhuận 3 ngày liên tiếp ➔ Tự ngắt nhập hàng, khóa ngân sách và gửi báo cáo SOS về Telegram cho bạn.

---

## PHẦN 1. HẠ TẦNG THANH TOÁN TỰ CHỦ: APPGATEWAY (THAY THẾ SEPAY)

Dự án sử dụng module nội bộ [AppGateWay](file:///c:/Users/Administrator/Desktop/Test/AppGateWay) thay vì phụ thuộc vào bên thứ ba (SePay):

```
[Khách chuyển khoản QR] 
          ↓
[App Ngân hàng nhảy thông báo "+Tiền" trên điện thoại Android]
          ↓
[MacroDroid / Native Android App bắt Notification]
          ↓ (Bắn HTTP POST Webhook trong 0.5s - 1.5s)
[Server Laravel / AppGateWay Test Server cổng 8888]
          ↓ (Regex bóc tách: Số tiền, Mã đơn ACC-XXXX)
[AI Merchant kích hoạt lệnh Fulfill & Xuất kho tức thì]
```

### Ưu điểm vượt trội so với SePay:
1. **0đ chi phí duy trì:** Không mất phí thuê bao hàng tháng của SePay.
2. **Không giới hạn giao dịch:** Bắn bao nhiêu đơn tùy thích, tiền về thẳng tài khoản ngân hàng cá nhân của bạn (TPBank, MBBank, Vietcombank...).
3. **Tốc độ xử lý siêu tốc:** Bắt thông báo trực tiếp trên Android đẩy về máy chủ nội bộ trong vòng dưới 2 giây.
4. **Bảo mật tuyệt đối:** Dữ liệu giao dịch nằm hoàn toàn trên máy chủ của bạn, không lo rò rỉ dữ liệu khách hàng.

---

## PHẦN 2. DANH MỤC SẢN PHẨM MŨI NHỌN (CẬP NHẬT THEO THỰC TẾ KHOAHOCGIARE & DIGISHOP)

Loại bỏ các chợ MMO đã thoái trào (như TaphoaMMO). Tập trung vào các dòng **Tài khoản AI Thế hệ mới & Tools Creator** đang có nhu cầu tìm kiếm và chi trả cao nhất:

| Nhóm sản phẩm | Sản phẩm chủ lực | Nhu cầu thị trường | Hình thức giao hàng | Biên lợi nhuận |
|---|---|---|---|---|
| **AI Video & Music (GenAI)** | **Kling AI**, **Google Veo 3**, **Suno AI** (tạo nhạc), Luma Dream Machine | Dân làm Reels/TikTok/Shorts cần tài khoản tạo video/nhạc không giới hạn | Cấp tài khoản hoặc Redeem Code | **50% – 100%** |
| **AI Coding & Chatbot** | **Cursor AI Pro**, **ChatGPT Plus**, **Super Grok (xAI)**, **Gemini Pro**, **Claude** | Lập trình viên, dân viết lách, văn phòng | Nâng cấp chính chủ / Account ngâm | **40% – 70%** |
| **Tools Creator Quốc Dân** | **CapCut Pro** (Bán cực chạy), **Canva Pro**, **Adobe Creative Cloud** | Bất kỳ ai làm affiliate, marketing, TikToker đều cần CapCut Pro | Add team hoặc cấp profile dùng riêng | **100% – 250%** |
| **Tài chính & Đầu tư** | **TradingView Pro / Premium** | Dân trade crypto, chứng khoán, forex | Tài khoản cấp sẵn theo tháng/năm | **60% – 80%** |
| **Nguyên liệu gốc** | **Outlook / Hotmail sạch chưa qua dịch vụ** (5k – 10k) | Dân công nghệ cần mail reg tài khoản | `Mail | Pass` (Giao tự động) | **100% – 200%** |

---

## PHẦN 3. BẢNG QUẢN TRỊ NGÂN SÁCH NGÀY & KPI CỦA AI

Mỗi ngày, bạn cấp cho AI một hạn mức ngân sách (`daily_cap`). AI tự chia ngân sách theo công thức:

```
TỔNG NGÂN SÁCH NGÀY (Ví dụ: 1.000.000đ)
├─ 70% (700.000đ) : Nhập hàng tồn kho các món "chắc chắn bán được" (CapCut Pro, Cursor AI, Canva, Hotmail)
├─ 20% (200.000đ) : Ngân sách test nguồn mới hoặc nhập thử sản phẩm hot trend (T0)
└─ 10% (100.000đ) : Quỹ dự phòng bảo hành / đổi mới cho khách khi gặp lỗi
```

### Bảng KPI bắt buộc AI phải đạt:
- **KPI 1 - Doanh thu ngày (Min Revenue):** Đạt tối thiểu **1.5x - 2x** ngân sách nhập hàng (Ví dụ nhập 700k phải bán ra tối thiểu 1.200k - 1.400k).
- **KPI 2 - Biên lợi nhuận ròng (Net Profit Margin):** Tối thiểu **35%** sau khi trừ mọi chi phí.
- **KPI 3 - Tỷ lệ lỗi / hoàn tiền (Error Rate):** Dưới **5%** tổng số đơn. Nếu vượt 10% trong 24 giờ ➔ **Kích hoạt Kill Switch dừng ngay lập tức**.
- **KPI 4 - Tốc độ giao hàng:** 100% đơn hàng giao trong vòng **3 giây** sau khi AppGateWay bắt được tiền.

---

## PHẦN 4. QUY TRÌNH TỰ ĐỘNG HÓA HOÀN CHỈNH (END-TO-END FLOW)

```
[1. BẠN CẤP VỐN] ──> Nạp 1.000.000đ vào quỹ ngày & Bật trạng thái Bot
                                    ↓
[2. AI ĐIỀU TRA KHO] ─> Kiểm tra sản phẩm sắp hết hàng (Low Stock Alert)
                     ─> Tự động đặt mua sỉ từ các bên uy tín (API / Auto Order)
                     ─> Kiểm tra sống/chết (Health check) ➔ Nạp vào kho shop
                                    ↓
[3. AI BÁN HÀNG] ────> Khách vào web mua hàng
                     ─> AI tự điều chỉnh giá qua sàn giá: final_price()
                     ─> Hộp Quà 3D & Voucher tự động kích thích khách chốt đơn
                                    ↓
[4. APPGATEWAY] ─────> Khách quét QR chuyển khoản ngân hàng
                     ─> Điện thoại bắt thông báo ➔ Bắn webhook về Server trong 1s
                                    ↓
[5. AI GIAO HÀNG] ───> Trả tài khoản / link bản quyền ngay trên màn hình khách
                     ─> Ghi nhận đơn thành công, cộng dồn KPI
                                    ↓
[6. BÁO CÁO CUỐI NGÀY] > 23:00 Bot Telegram gửi báo cáo tổng kết:
                         "Hôm nay: Vốn 1.000k - Thu về 2.100k - Lãi ròng 850k - Đạt 105% KPI!"
```