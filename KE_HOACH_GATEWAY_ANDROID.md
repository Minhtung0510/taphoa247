# 📱 KẾ HOẠCH V2: CỔNG NHẬN TIỀN TỰ ĐỘNG QUA ĐIỆN THOẠI ANDROID
> **Dự án:** DTFF SHOP (Laravel 11)
> **Mục tiêu:** Tự nhận biết tiền vào tài khoản ngân hàng qua thông báo đẩy trên Android, tự khớp đơn và giao tài khoản trong 1-3 giây. Chạy song song với SePay, có giám sát, đối soát và đường lui.
> **Phiên bản:** V2 (viết lại hoàn chỉnh từ V1, đã vá các lỗi thiết kế bảo mật và vận hành)

---

## 📑 MỤC LỤC
0. [Những thay đổi chính so với V1](#0-những-thay-đổi-chính-so-với-v1)
1. [Mục tiêu, phạm vi, nguyên tắc](#1-mục-tiêu-phạm-vi-nguyên-tắc)
2. [Kiến trúc tổng thể & vòng đời giao dịch](#2-kiến-trúc-tổng-thể--vòng-đời-giao-dịch)
3. [Quy ước mã thanh toán & QR](#3-quy-ước-mã-thanh-toán--qr)
4. [Thiết kế cơ sở dữ liệu](#4-thiết-kế-cơ-sở-dữ-liệu)
5. [Backend Laravel: code chi tiết](#5-backend-laravel-code-chi-tiết)
6. [Phía Android](#6-phía-android)
7. [Bảo mật](#7-bảo-mật)
8. [Vận hành: giám sát, đối soát, hết hạn, sự cố](#8-vận-hành)
9. [Kế hoạch kiểm thử](#9-kế-hoạch-kiểm-thử)
10. [Lộ trình triển khai & tiêu chí nghiệm thu](#10-lộ-trình-triển-khai--tiêu-chí-nghiệm-thu)
11. [Rủi ro & các điểm cần chốt](#11-rủi-ro--các-điểm-cần-chốt)
12. [Cấu hình `.env` & triển khai server](#12-cấu-hình-env--triển-khai-server)

---

## 0. NHỮNG THAY ĐỔI CHÍNH SO VỚI V1

| # | Vấn đề ở V1 | Cách xử lý ở V2 |
|---|---|---|
| 1 | Chỉ dùng 1 secret tĩnh, secret mẫu nằm ngay trong file | Mỗi thiết bị có secret riêng (mã hóa trong DB). Tier "signed" dùng **HMAC-SHA256 + timestamp**. Có xoay secret không gián đoạn |
| 2 | Hash chống trùng = nội dung + giờ gửi (dễ lách, dễ trùng oan) | Khóa chống trùng = `event_id` (UUID sinh từ thông báo) + `dedupe_hash` có `posted_at` của thông báo; cả hai `UNIQUE` |
| 3 | Chỉ kiểm tra `status` đơn trước khi giao (race condition) | `DB::transaction` + `lockForUpdate()` trên giao dịch và đơn |
| 4 | Mã đơn không thống nhất (`ACCXQR4R4TC` vs `ACC-10928`), ngân hàng bỏ dấu `-` là hỏng | Mã thanh toán cố định `ACC` + 8 ký tự (bảng chữ không gây nhầm), **không có dấu gạch**, chuẩn hóa chuỗi trước khi bóc |
| 5 | Chuyển thiếu/dư/trễ/hết hàng chưa xử lý | Máy trạng thái đầy đủ: `underpaid`, `late_paid`, `duplicate_paid`, `fulfill_failed`, `pending_review`... kèm luồng admin |
| 6 | Không biết khi điện thoại chết | **Heartbeat** mỗi 60s + watchdog + cảnh báo Telegram + tự ẩn QR khi cổng offline |
| 7 | MacroDroid retry không bền | Thêm **Tier 2: app Kotlin riêng** với WorkManager (hàng đợi bền, retry lũy thừa) |
| 8 | Bật tự động giao ngay | Có **4 chế độ vận hành** (`off`, `shadow`, `dual`, `device_primary`) để chạy thử mà chưa giao hàng thật |
| 9 | Không đối soát | Báo cáo cuối ngày + lệnh đối soát + danh sách chưa khớp |
| 10 | Lưu nguyên thông báo (có số dư) | Che số dư/số tài khoản trước khi lưu, tự xóa sau N ngày |

---

## 1. MỤC TIÊU, PHẠM VI, NGUYÊN TẮC

### 1.1. Mục tiêu
1. Khách quét VietQR, chuyển khoản xong, hệ thống nhận biết và giao hàng tự động trong **≤ 3 giây** (khi điện thoại online).
2. Không giao hàng 2 lần, không giao hàng khi chưa đủ tiền, không giao hàng cho thông báo giả.
3. Khi có lỗi (điện thoại chết, đổi định dạng thông báo, khách ghi sai nội dung), **admin biết ngay và xử lý được trong 1 thao tác**, không mất tiền của khách.
4. Chi phí 0đ (điện thoại cũ + server hiện có).

### 1.2. Ngoài phạm vi
- Không thay thế SePay: SePay vẫn là kênh chính cho tới khi Gateway Android chứng minh độ tin cậy.
- Không tự rút/chuyển tiền, không truy cập app ngân hàng ngoài việc đọc thông báo.

### 1.3. Nguyên tắc thiết kế
- **Không sửa `SePayService`** (theo `AGENTS.md`). Gateway là module độc lập. Ngoại lệ duy nhất cần bạn duyệt: thêm khóa đơn (`lockForUpdate`) vào `OrderService::fulfillOrder` (xem mục 11).
- **Thông báo chỉ là "gợi ý có chữ ký", không phải sự thật tuyệt đối.** Đơn giá trị lớn cần duyệt hoặc đối soát.
- **Mọi thứ bất thường đều phải để lại dấu vết** (không im lặng bỏ qua) và có đường để admin xử lý tay.
- **Idempotent mọi nơi:** gửi lại cùng một sự kiện bao nhiêu lần cũng chỉ có một kết quả.

---

## 2. KIẾN TRÚC TỔNG THỂ & VÒNG ĐỜI GIAO DỊCH

### 2.1. Sơ đồ

```
Khách quét VietQR (nội dung CK = ACCxxxxxxxx)
        │
        ▼
 Ngân hàng ──► Push notification ──► Điện thoại Android
                                      │ (BankListener / MacroDroid)
                                      │ 1. lọc đúng app ngân hàng, đúng "+tiền"
                                      │ 2. tạo event_id (UUID cố định theo thông báo)
                                      │ 3. xếp hàng bền (WorkManager) rồi gửi HTTPS
                                      ▼
                         POST /api/v1/payments/device/webhook
                                      │
            ┌─────────────────────────┴──────────────────────────┐
            │ Middleware VerifyDeviceRequest                      │
            │  - tìm thiết bị theo X-Device-Id                    │
            │  - kiểm tra chữ ký HMAC + timestamp (±5 phút)       │
            └─────────────────────────┬──────────────────────────┘
                                      ▼
                 DevicePaymentWebhookController
                  - validate payload, kiểm tra app_package hợp lệ
                  - NotificationParser: bóc số tiền + mã thanh toán
                  - INSERT device_transactions (UNIQUE event_id / dedupe_hash)
                  - DeviceTransactionProcessor::process()
                                      ▼
                 ┌──── DB transaction + lockForUpdate ────┐
                 │ khớp đơn → kiểm tra số tiền/hạn đơn    │
                 │ → fulfillOrder() (chỉ 1 lần)            │
                 └────────────────────────────────────────┘
                                      ▼
              Đơn `paid` ► web tự nhảy "Thành công" (polling 2s)
              Bất thường ► Telegram cảnh báo + hiện trong Admin

Song song: điện thoại gửi heartbeat mỗi 60s ► server theo dõi online/offline
```

### 2.2. Bốn chế độ vận hành (`DEVICE_GATEWAY_MODE`)

| Chế độ | Hành vi | Dùng khi |
|---|---|---|
| `off` | Webhook trả 503, không xử lý | Tắt khẩn cấp |
| `shadow` | Nhận, parse, khớp đơn, **ghi nhận nhưng KHÔNG giao hàng** | 1-2 tuần đầu để đo độ chính xác so với SePay |
| `dual` | Giao hàng tự động (≤ hạn mức), song song SePay | Giai đoạn thử thật |
| `device_primary` | Android là kênh chính, SePay dự phòng | Sau khi ổn định |

### 2.3. Máy trạng thái của `device_transactions.status`

| Trạng thái | Ý nghĩa | Hành động tiếp |
|---|---|---|
| `received` | Vừa nhận, chưa xử lý (trạng thái trung gian) | Tự xử lý ngay |
| `fulfilled` | Đã khớp đơn, đã giao hàng | Xong |
| `shadow` | Khớp đơn nhưng đang ở chế độ shadow | Chỉ theo dõi |
| `pending_review` | Đủ tiền nhưng vượt hạn mức tự động | Admin bấm duyệt |
| `underpaid` | Khách chuyển thiếu | Chờ khách chuyển bù (cộng dồn) hoặc admin xử lý |
| `late_paid` | Khớp đơn nhưng đơn đã hết hạn/hủy | Admin duyệt giao hoặc hoàn tiền |
| `duplicate_paid` | Đơn đã `paid` rồi (SePay giao trước, hoặc khách chuyển 2 lần) | Admin kiểm tra, hoàn phần dư |
| `fulfill_failed` | Đủ tiền nhưng giao hàng lỗi (hết kho...) | Admin nhập kho rồi bấm "giao lại" |
| `unmatched` | Không tìm thấy đơn (sai/thiếu nội dung CK) | Admin khớp tay |
| `ignored` | Admin bỏ qua (không phải tiền của shop) | Xong |

---

## 3. QUY ƯỚC MÃ THANH TOÁN & QR

### 3.1. Định dạng mã
- **`payment_code` = `ACC` + 8 ký tự** lấy từ bảng `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (loại `0 O 1 I` để khỏi nhầm).
- **Không dùng dấu `-` hay `_`, không khoảng trắng** (nhiều ngân hàng xóa/đổi ký tự đặc biệt trong nội dung CK).
- Ví dụ: `ACCK7M2XQ9P`. Độ dài 11 ký tự, đủ ngắn để không bị cắt, đủ dài để không đoán được (32^8 ≈ 1,1 nghìn tỷ tổ hợp).
- `payment_code` là cột **riêng**, `UNIQUE`, không thay thế `order_code` cũ (giữ tương thích SePay).

### 3.2. Nơi cần sửa phía frontend/QR
- Khi tạo VietQR: nội dung chuyển khoản = `payment_code` (không phải `order_code`).
- Trang thanh toán hiển thị rõ: *"Giữ nguyên nội dung chuyển khoản"* và đồng hồ đếm ngược hạn đơn (30 phút).
- Trang thanh toán **polling** `GET /api/v1/orders/{payment_code}/status` mỗi 2 giây (hoặc dùng broadcasting nếu đã có). Khi `paid` thì chuyển sang màn hình nhận hàng.
- Nếu `DeviceGateway::isOnline()` là `false` và chế độ là `device_primary`: ẩn QR của gateway Android, chuyển sang QR/kênh SePay.

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU

> Tên cột/trạng thái của bảng `orders` bên dưới là **giả định** (tôi chưa thấy codebase). Đối chiếu lại enum `status` thực tế trước khi chạy migration.

### 4.1. Migration: `device_gateways` (mỗi điện thoại một bản ghi)

```php
// database/migrations/2026_10_28_000001_create_device_gateways_table.php
Schema::create('device_gateways', function (Blueprint $t) {
    $t->id();
    $t->string('name', 80);                       // "Máy nhận tiền TPBank"
    $t->string('device_uid', 64)->unique();       // gửi trong X-Device-Id
    $t->text('secret');                           // cast 'encrypted'
    $t->text('secret_next')->nullable();          // dùng khi xoay secret
    $t->string('trust_level', 10)->default('basic'); // basic (MacroDroid) | signed (app Kotlin)
    $t->json('allowed_packages');                 // ["com.xxx.bank"]
    $t->boolean('is_active')->default(true);
    $t->timestamp('last_seen_at')->nullable();
    $t->unsignedTinyInteger('last_battery')->nullable();
    $t->string('last_network', 20)->nullable();
    $t->string('app_version', 20)->nullable();
    $t->unsignedInteger('pending_queue')->default(0);
    $t->timestamp('offline_alerted_at')->nullable();
    $t->timestamps();
});
```

### 4.2. Migration: `device_transactions`

```php
Schema::create('device_transactions', function (Blueprint $t) {
    $t->id();
    $t->foreignId('gateway_id')->constrained('device_gateways');
    $t->uuid('event_id')->nullable()->unique();   // do app sinh; MacroDroid có thể để trống
    $t->char('dedupe_hash', 64)->unique();        // sha256(gateway|package|nội dung chuẩn hóa|posted_at)
    $t->string('app_package', 100);
    $t->string('title', 255)->nullable();
    $t->text('content_masked');                   // đã che số dư / số tài khoản
    $t->timestamp('posted_at')->nullable();       // thời điểm thông báo hiện trên máy
    $t->unsignedBigInteger('parsed_amount')->nullable();   // VND
    $t->json('parsed_codes')->nullable();         // các ứng viên payment_code
    $t->string('bank_ref', 40)->nullable();       // mã GD ngân hàng nếu bóc được
    $t->string('status', 20)->default('received')->index();
    $t->foreignId('order_id')->nullable()->index();
    $t->boolean('applied')->default(false);       // đã cộng vào order.device_paid_amount chưa
    $t->string('matched_by', 40)->nullable();     // 'auto' | 'admin:<id>'
    $t->timestamp('matched_at')->nullable();
    $t->string('note', 500)->nullable();
    $t->timestamps();
    $t->index(['gateway_id', 'created_at']);
});
```

### 4.3. Migration: bổ sung bảng `orders`

```php
Schema::table('orders', function (Blueprint $t) {
    $t->string('payment_code', 16)->nullable()->unique()->after('order_code');
    $t->timestamp('expires_at')->nullable()->index();
    $t->unsignedBigInteger('device_paid_amount')->default(0); // cộng dồn tiền nhận qua Android
});
```

### 4.4. Sinh `payment_code` cho đơn mới (Observer, không sửa code cũ)

```php
// app/Support/PaymentCode.php
final class PaymentCode
{
    public const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public static function generate(): string
    {
        do {
            $s = '';
            for ($i = 0; $i < 8; $i++) {
                $s .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $code = 'ACC' . $s;
        } while (\App\Models\Order::where('payment_code', $code)->exists());
        return $code;
    }
}

// app/Observers/OrderPaymentCodeObserver.php
class OrderPaymentCodeObserver
{
    public function creating(Order $order): void
    {
        $order->payment_code ??= PaymentCode::generate();
        $order->expires_at   ??= now()->addMinutes(30);
    }
}
// AppServiceProvider::boot():  Order::observe(OrderPaymentCodeObserver::class);
```

Đơn cũ chưa có `payment_code`: chạy 1 lần `php artisan tinker` để backfill cho các đơn `pending`.

---

## 5. BACKEND LARAVEL: CODE CHI TIẾT

### 5.1. Cấu trúc file

```
app/
  Models/DeviceGateway.php
  Models/DeviceTransaction.php
  Http/Middleware/VerifyDeviceRequest.php
  Http/Controllers/Api/DevicePaymentWebhookController.php
  Http/Controllers/Api/DeviceHeartbeatController.php
  Http/Controllers/Admin/DeviceTransactionAdminController.php
  Services/Gateway/NotificationParser.php
  Services/Gateway/DeviceTransactionProcessor.php
  Services/Gateway/GatewayAlert.php
  Support/PaymentCode.php
  Console/Commands/GatewayCreate.php
  Console/Commands/GatewayRotateSecret.php
  Console/Commands/GatewayWatchdog.php
  Console/Commands/GatewayDailyReport.php
  Console/Commands/OrdersExpire.php
  Console/Commands/GatewayPrune.php
```

### 5.2. Models

```php
// app/Models/DeviceGateway.php
class DeviceGateway extends Model
{
    protected $guarded = [];
    protected $hidden  = ['secret', 'secret_next'];
    protected $casts = [
        'secret'             => 'encrypted',
        'secret_next'        => 'encrypted',
        'allowed_packages'   => 'array',
        'is_active'          => 'boolean',
        'last_seen_at'       => 'datetime',
        'offline_alerted_at' => 'datetime',
    ];

    public static function isOnline(int $seconds = 180): bool
    {
        return static::where('is_active', true)
            ->where('last_seen_at', '>=', now()->subSeconds($seconds))
            ->exists();
    }
}

// app/Models/DeviceTransaction.php
class DeviceTransaction extends Model
{
    protected $guarded = [];
    protected $casts = [
        'parsed_codes' => 'array',
        'posted_at'    => 'datetime',
        'matched_at'   => 'datetime',
        'applied'      => 'boolean',
    ];
    public function gateway() { return $this->belongsTo(DeviceGateway::class); }
    public function order()   { return $this->belongsTo(Order::class); }
}
```

### 5.3. Cấu hình `config/services.php`

```php
'device_gateway' => [
    'mode'             => env('DEVICE_GATEWAY_MODE', 'shadow'),   // off|shadow|dual|device_primary
    'tolerance'        => (int) env('DEVICE_GATEWAY_TOLERANCE', 300),     // giây lệch giờ cho phép
    'auto_limit_basic' => (int) env('DEVICE_AUTO_LIMIT_BASIC', 300000),   // VND
    'auto_limit_signed'=> (int) env('DEVICE_AUTO_LIMIT_SIGNED', 3000000), // VND
    'offline_after'    => (int) env('DEVICE_OFFLINE_AFTER', 180),         // giây
    'retention_days'   => (int) env('DEVICE_TX_RETENTION_DAYS', 90),
    'telegram_token'   => env('GATEWAY_TELEGRAM_TOKEN'),
    'telegram_chat'    => env('GATEWAY_TELEGRAM_CHAT_ID'),
],
```

### 5.4. Middleware xác thực thiết bị

```php
// app/Http/Middleware/VerifyDeviceRequest.php
class VerifyDeviceRequest
{
    public function handle(Request $request, Closure $next)
    {
        if (config('services.device_gateway.mode') === 'off') {
            return response()->json(['error' => 'gateway_off'], 503);
        }

        $uid = (string) $request->header('X-Device-Id');
        $gateway = $uid !== ''
            ? DeviceGateway::where('device_uid', $uid)->where('is_active', true)->first()
            : null;
        if (!$gateway) {
            return $this->deny();
        }

        $ok = $gateway->trust_level === 'signed'
            ? $this->verifySigned($request, $gateway)
            : $this->verifyBasic($request, $gateway);

        if (!$ok) {
            Log::warning('device_gateway.auth_failed', ['uid' => $uid, 'ip' => $request->ip()]);
            return $this->deny();
        }

        $request->attributes->set('gateway', $gateway);
        return $next($request);
    }

    private function verifySigned(Request $r, DeviceGateway $g): bool
    {
        $ts  = (int) $r->header('X-Timestamp');
        $sig = (string) $r->header('X-Signature');
        if ($ts === 0 || abs(now()->timestamp - $ts) > config('services.device_gateway.tolerance')) {
            return false;
        }
        $payload = $ts . "\n" . hash('sha256', $r->getContent());
        foreach (array_filter([$g->secret, $g->secret_next]) as $secret) {
            if (hash_equals(hash_hmac('sha256', $payload, $secret), $sig)) {
                return true;
            }
        }
        return false;
    }

    private function verifyBasic(Request $r, DeviceGateway $g): bool
    {
        $token = (string) $r->bearerToken();
        foreach (array_filter([$g->secret, $g->secret_next]) as $secret) {
            if (hash_equals($secret, $token)) {
                return true;
            }
        }
        return false;
    }

    private function deny()
    {
        return response()->json(['error' => 'unauthorized'], 401);
    }
}
```

Đăng ký (Laravel 11, `bootstrap/app.php`):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['device.auth' => \App\Http\Middleware\VerifyDeviceRequest::class]);
})
```

Rate limiter theo thiết bị (trong `AppServiceProvider::boot`):

```php
RateLimiter::for('device-gateway', fn (Request $r) =>
    Limit::perMinute(120)->by($r->header('X-Device-Id') ?: $r->ip()));
```

### 5.5. Routes

```php
// routes/api.php
Route::prefix('v1/payments/device')
    ->middleware(['device.auth', 'throttle:device-gateway'])
    ->group(function () {
        Route::post('webhook',   [DevicePaymentWebhookController::class, 'handle']);
        Route::post('heartbeat', [DeviceHeartbeatController::class, 'handle']);
    });

// Admin (đặt trong nhóm đã có auth + quyền quản trị)
Route::middleware(['auth:sanctum', 'can:manage-payments'])->prefix('admin/device')->group(function () {
    Route::get('transactions',               [DeviceTransactionAdminController::class, 'index']);
    Route::post('transactions/{id}/match',   [DeviceTransactionAdminController::class, 'match']);
    Route::post('transactions/{id}/approve', [DeviceTransactionAdminController::class, 'approve']);
    Route::post('transactions/{id}/ignore',  [DeviceTransactionAdminController::class, 'ignore']);
    Route::get('status',                     [DeviceTransactionAdminController::class, 'status']);
});
```

### 5.6. Bộ bóc tách thông báo

```php
// app/Services/Gateway/NotificationParser.php
final class ParsedNotification
{
    public function __construct(
        public bool $incoming,
        public ?int $amount,
        public array $codes,
        public ?string $bankRef,
    ) {}
}

class NotificationParser
{
    public function parse(string $raw): ParsedNotification
    {
        // Chuẩn hóa: bỏ dấu tiếng Việt, in hoa
        $text = strtoupper(Str::ascii($raw));

        // 1) Chỉ chấp nhận "+<số> VND|D" (tiền vào). Số dư không có dấu "+"
        $amount = null;
        if (preg_match('/\+\s*([0-9][0-9.,]*)\s*(?:VND|D)\b/', $text, $m)) {
            $amount = $this->toInt($m[1]);
        }
        $incoming = $amount !== null && $amount > 0;

        // 2) Cắt bỏ phần "SO DU ..." để không bóc nhầm
        $body = preg_split('/\bSO DU\b|\bSD\b\s*:/', $text)[0] ?? $text;

        // 3) Bỏ mọi ký tự không phải chữ/số rồi tìm mã. Chịu được: "ACC-K7M2XQ9P", "ACC K7M2 XQ9P",
        //    "acck7m2xq9p", bị chèn xuống dòng...
        $flat = preg_replace('/[^A-Z0-9]/', '', $body);
        preg_match_all('/ACC[' . PaymentCode::ALPHABET . ']{8}/', $flat, $mm);
        $codes = array_values(array_unique($mm[0]));

        // 4) Mã giao dịch ngân hàng (nếu có) để chống trùng chắc chắn hơn
        $ref = null;
        if (preg_match('/\bFT\d{8,}\b/', $text, $r)) {
            $ref = $r[0];
        }

        return new ParsedNotification($incoming, $amount, $codes, $ref);
    }

    /** "50,000" | "50.000" | "50,000.00" | "50000" => 50000 */
    private function toInt(string $s): int
    {
        $s = rtrim($s, '.,');
        if (preg_match('/^(.*\d)[.,](\d{1,2})$/', $s, $m)) {   // phần thập phân 1-2 số
            $s = $m[1];
        }
        return (int) preg_replace('/\D/', '', $s);
    }

    /** Che số dư và dãy số tài khoản dài trước khi lưu */
    public function mask(string $raw): string
    {
        $raw = preg_replace('/(số dư|so du|sd)\s*[:：]?\s*[\d.,]+\s*(vnd|vnđ|đ)?/iu', '$1: ***', $raw);
        return preg_replace_callback('/\d{8,}/', fn ($m) => str_repeat('*', strlen($m[0]) - 4) . substr($m[0], -4), $raw);
    }
}
```

> Lưu ý quan trọng: `mask()` che các dãy số ≥ 8 chữ số, nhưng **không che mã giao dịch `FT...` và `payment_code`** vì chúng là chữ + số. Kiểm tra lại với mẫu thông báo thật ở Giai đoạn 1.

### 5.7. Controller nhận webhook

```php
// app/Http/Controllers/Api/DevicePaymentWebhookController.php
class DevicePaymentWebhookController extends Controller
{
    public function handle(
        Request $request,
        NotificationParser $parser,
        DeviceTransactionProcessor $processor
    ) {
        /** @var DeviceGateway $gateway */
        $gateway = $request->attributes->get('gateway');
        $gateway->forceFill(['last_seen_at' => now()])->save();   // webhook cũng tính là "còn sống"

        $v = $request->validate([
            'event_id'    => ['nullable', 'uuid'],
            'app_package' => ['required', 'string', 'max:100'],
            'title'       => ['nullable', 'string', 'max:255'],
            'raw_content' => ['required', 'string', 'max:2000'],
            'posted_at'   => ['nullable', 'date'],
        ]);

        if (!in_array($v['app_package'], $gateway->allowed_packages, true)) {
            return response()->json(['status' => 'ignored', 'reason' => 'package_not_allowed']);
        }

        $parsed = $parser->parse($v['raw_content']);
        if (!$parsed->incoming) {
            return response()->json(['status' => 'ignored', 'reason' => 'not_incoming']);
        }

        $postedAt = isset($v['posted_at']) ? Carbon::parse($v['posted_at']) : now();
        $normalized = strtoupper(Str::ascii($v['raw_content']));
        $hash = hash('sha256', implode('|', [
            $gateway->id,
            $v['app_package'],
            $parsed->bankRef ?? $normalized,
            $parsed->bankRef ? '' : $postedAt->timestamp,
        ]));

        try {
            $tx = DeviceTransaction::create([
                'gateway_id'     => $gateway->id,
                'event_id'       => $v['event_id'] ?? null,
                'dedupe_hash'    => $hash,
                'app_package'    => $v['app_package'],
                'title'          => $v['title'] ?? null,
                'content_masked' => $parser->mask($v['raw_content']),
                'posted_at'      => $postedAt,
                'parsed_amount'  => $parsed->amount,
                'parsed_codes'   => $parsed->codes,
                'bank_ref'       => $parsed->bankRef,
                'status'         => 'received',
            ]);
        } catch (UniqueConstraintViolationException $e) {
            // Gửi lại cùng một sự kiện: trả 200 để thiết bị ngừng retry
            return response()->json(['status' => 'already_processed']);
        }

        $tx = $processor->process($tx->id);

        return response()->json(['status' => 'ok', 'result' => $tx->status]);
    }
}
```

**Quy ước mã HTTP (quan trọng cho retry của điện thoại):**
- `200` = đã nhận (kể cả `ignored`, `already_processed`, `unmatched`). Thiết bị **không** gửi lại.
- `401` = sai khóa/chữ ký/lệch giờ. Thiết bị giữ lại và thử lại sau (có thể do đồng hồ máy lệch).
- `422` = payload sai. Thiết bị bỏ, không retry.
- `429/5xx` = thiết bị retry lũy thừa.

### 5.8. Bộ xử lý giao dịch (lõi hệ thống)

```php
// app/Services/Gateway/DeviceTransactionProcessor.php
class DeviceTransactionProcessor
{
    public function __construct(
        private OrderService $orders,       // dịch vụ hiện có, có hàm fulfillOrder()
        private GatewayAlert $alert,
    ) {}

    public function process(int $txId): DeviceTransaction
    {
        $tx = DB::transaction(fn () => $this->processLocked($txId));
        $this->notify($tx);
        return $tx;
    }

    private function processLocked(int $txId): DeviceTransaction
    {
        $tx = DeviceTransaction::lockForUpdate()->findOrFail($txId);
        if ($tx->status !== 'received') {
            return $tx;                                            // đã xử lý
        }
        if (!$tx->parsed_amount) {
            return $this->mark($tx, 'unmatched', 'Không bóc được số tiền');
        }

        $order = null;
        foreach ($tx->parsed_codes ?? [] as $code) {
            $order = Order::where('payment_code', $code)->lockForUpdate()->first();
            if ($order) break;
        }
        if (!$order) {
            return $this->mark($tx, 'unmatched', 'Không tìm thấy đơn theo nội dung CK');
        }
        $tx->order_id = $order->id;

        if (config('services.device_gateway.mode') === 'shadow') {
            return $this->mark($tx, 'shadow', 'Chế độ shadow: không giao hàng');
        }
        if ($order->status === 'paid') {
            return $this->mark($tx, 'duplicate_paid', 'Đơn đã được thanh toán bởi kênh khác');
        }
        if ($order->status !== 'pending' || ($order->expires_at && $order->expires_at->isPast())) {
            return $this->mark($tx, 'late_paid', 'Đơn đã hết hạn/hủy');
        }

        // Cộng dồn tiền (cho phép khách chuyển bù nhiều lần)
        if (!$tx->applied) {
            $order->device_paid_amount += $tx->parsed_amount;
            $order->save();
            $tx->applied = true;
        }
        if ($order->device_paid_amount < $order->total_amount) {
            $thieu = $order->total_amount - $order->device_paid_amount;
            return $this->mark($tx, 'underpaid', "Còn thiếu {$thieu}đ");
        }

        $level = $tx->gateway->trust_level;
        $limit = config("services.device_gateway.auto_limit_{$level}");
        if ($order->total_amount > $limit) {
            return $this->mark($tx, 'pending_review', 'Vượt hạn mức tự động giao, chờ admin duyệt');
        }

        return $this->fulfill($tx, $order, 'auto');
    }

    /** Dùng chung cho tự động và admin duyệt */
    public function fulfill(DeviceTransaction $tx, Order $order, string $by): DeviceTransaction
    {
        try {
            $ok = $this->orders->fulfillOrder($order);
        } catch (\Throwable $e) {
            report($e);
            return $this->mark($tx, 'fulfill_failed', Str::limit($e->getMessage(), 400));
        }
        if (!$ok) {
            return $this->mark($tx, 'duplicate_paid', 'fulfillOrder từ chối: đơn đã xử lý bởi kênh khác');
        }
        $tx->matched_by = $by;
        $tx->matched_at = now();
        $dư = $order->device_paid_amount - $order->total_amount;
        return $this->mark($tx, 'fulfilled', $dư > 0 ? "Khách chuyển dư {$dư}đ, cần hoàn" : null);
    }

    /** Admin khớp tay một giao dịch vào một đơn */
    public function manualMatch(int $txId, int $orderId, string $adminTag, bool $force = false): DeviceTransaction
    {
        $tx = DB::transaction(function () use ($txId, $orderId, $adminTag, $force) {
            $tx    = DeviceTransaction::lockForUpdate()->findOrFail($txId);
            $order = Order::lockForUpdate()->findOrFail($orderId);

            if (in_array($tx->status, ['fulfilled', 'ignored'], true)) {
                return $tx;
            }
            if ($order->status === 'paid') {
                return $this->mark($tx, 'duplicate_paid', 'Đơn đã paid');
            }
            $tx->order_id = $order->id;
            if (!$tx->applied) {
                $order->device_paid_amount += (int) $tx->parsed_amount;
                $order->save();
                $tx->applied = true;
            }
            if (!$force && $order->device_paid_amount < $order->total_amount) {
                return $this->mark($tx, 'underpaid', 'Chưa đủ tiền, cần force hoặc chuyển bù');
            }
            return $this->fulfill($tx, $order, $adminTag);
        });
        $this->notify($tx);
        return $tx;
    }

    private function mark(DeviceTransaction $tx, string $status, ?string $note = null): DeviceTransaction
    {
        $tx->status = $status;
        $tx->note   = $note;
        $tx->save();
        return $tx;
    }

    private function notify(DeviceTransaction $tx): void
    {
        $needAttention = ['unmatched', 'underpaid', 'late_paid', 'duplicate_paid',
                          'fulfill_failed', 'pending_review'];
        if (in_array($tx->status, $needAttention, true)) {
            $this->alert->send("⚠️ Giao dịch #{$tx->id} [{$tx->status}] "
                . number_format((int) $tx->parsed_amount) . "đ. {$tx->note}");
        }
    }
}
```

**Điểm bắt buộc để chạy song song với SePay an toàn:** `OrderService::fulfillOrder()` phải tự khóa đơn và kiểm tra lại trạng thái bên trong transaction. Nếu hiện tại chưa làm vậy, cần thêm tối thiểu:

```php
// Bên trong fulfillOrder($order)
return DB::transaction(function () use ($order) {
    $locked = Order::whereKey($order->id)->lockForUpdate()->first();
    if ($locked->status !== 'pending') {
        return false;                       // kênh khác đã giao rồi
    }
    // ... gắp tài khoản từ kho (cũng nên lockForUpdate trên dòng kho) ...
    $locked->update(['status' => 'paid']);
    return true;
});
```

### 5.9. Cảnh báo Telegram

```php
// app/Services/Gateway/GatewayAlert.php
class GatewayAlert
{
    public function send(string $text): void
    {
        $token = config('services.device_gateway.telegram_token');
        $chat  = config('services.device_gateway.telegram_chat');
        Log::warning('gateway_alert', ['text' => $text]);
        if (!$token || !$chat) return;
        try {
            Http::timeout(3)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chat, 'text' => $text,
            ]);
        } catch (\Throwable $e) {
            report($e);                      // không để lỗi cảnh báo làm hỏng luồng thanh toán
        }
    }
}
```

### 5.10. Heartbeat

```php
// app/Http/Controllers/Api/DeviceHeartbeatController.php
class DeviceHeartbeatController extends Controller
{
    public function handle(Request $request)
    {
        $g = $request->attributes->get('gateway');
        $v = $request->validate([
            'battery'       => ['nullable', 'integer', 'between:0,100'],
            'network'       => ['nullable', 'string', 'max:20'],
            'app_version'   => ['nullable', 'string', 'max:20'],
            'pending_queue' => ['nullable', 'integer', 'min:0'],
        ]);
        $g->forceFill([
            'last_seen_at'  => now(),
            'last_battery'  => $v['battery'] ?? null,
            'last_network'  => $v['network'] ?? null,
            'app_version'   => $v['app_version'] ?? null,
            'pending_queue' => $v['pending_queue'] ?? 0,
        ])->save();

        return response()->json(['ok' => true, 'server_time' => now()->timestamp]);
    }
}
```

### 5.11. Lệnh Artisan

**Tạo thiết bị và in secret đúng một lần:**

```php
// app/Console/Commands/GatewayCreate.php
protected $signature = 'gateway:create {name} {--trust=basic} {--package=*}';
public function handle(): int
{
    $secret = Str::random(48);
    $g = DeviceGateway::create([
        'name' => $this->argument('name'),
        'device_uid' => 'dev_' . Str::lower(Str::random(12)),
        'secret' => $secret,
        'trust_level' => $this->option('trust'),
        'allowed_packages' => $this->option('package'),
    ]);
    $this->info("Device ID : {$g->device_uid}");
    $this->info("Secret    : {$secret}   (chỉ hiển thị 1 lần, cất vào app điện thoại)");
    return self::SUCCESS;
}
```

**Xoay secret không gián đoạn** (`gateway:rotate {uid}`):
1. Lệnh sinh `secret_next` mới, in ra.
2. Cập nhật secret mới vào app điện thoại (server chấp nhận cả `secret` cũ lẫn `secret_next`).
3. Chạy `gateway:rotate {uid} --promote`: `secret = secret_next`, `secret_next = null`.

**Watchdog (chạy mỗi phút):**

```php
// app/Console/Commands/GatewayWatchdog.php
public function handle(GatewayAlert $alert): void
{
    $after = config('services.device_gateway.offline_after');
    DeviceGateway::where('is_active', true)->each(function (DeviceGateway $g) use ($alert, $after) {
        $offline = !$g->last_seen_at || $g->last_seen_at->lt(now()->subSeconds($after));
        if ($offline && !$g->offline_alerted_at) {
            $alert->send("🔴 Cổng '{$g->name}' MẤT KẾT NỐI từ " . optional($g->last_seen_at)->diffForHumans()
                . ". Kiểm tra điện thoại (mạng, pin, app bị kill).");
            $g->forceFill(['offline_alerted_at' => now()])->save();
        } elseif (!$offline && $g->offline_alerted_at) {
            $alert->send("🟢 Cổng '{$g->name}' đã hoạt động trở lại.");
            $g->forceFill(['offline_alerted_at' => null])->save();
        }
    });
}
```

**Hết hạn đơn (mỗi phút):**

```php
// app/Console/Commands/OrdersExpire.php
Order::where('status', 'pending')->where('expires_at', '<', now())
     ->update(['status' => 'expired']);   // đổi theo enum thực tế (cancelled/expired)
```

**Báo cáo cuối ngày (23:55):** tổng số tiền `fulfilled`, số giao dịch theo từng trạng thái, danh sách `unmatched/underpaid/late_paid/fulfill_failed` còn tồn, tổng tiền dư cần hoàn, trạng thái online của từng thiết bị. Gửi qua Telegram.

**Dọn dữ liệu (hằng ngày):** xóa `device_transactions` cũ hơn `retention_days` (trừ giao dịch chưa xử lý xong).

**Lập lịch (`routes/console.php`, Laravel 11):**

```php
Schedule::command('gateway:watchdog')->everyMinute();
Schedule::command('orders:expire')->everyMinute();
Schedule::command('gateway:daily-report')->dailyAt('23:55');
Schedule::command('gateway:prune')->dailyAt('03:30');
```

### 5.12. API Admin (tóm tắt hành vi)

| Endpoint | Chức năng |
|---|---|
| `GET /admin/device/transactions?status=unmatched` | Danh sách theo trạng thái, phân trang, lọc theo ngày/số tiền |
| `POST /admin/device/transactions/{id}/match` `{order_id, force?}` | Khớp tay (gọi `manualMatch`). Ghi `matched_by = admin:<id>` |
| `POST /admin/device/transactions/{id}/approve` | Duyệt giao dịch `pending_review` (gọi `manualMatch` với đơn đã khớp) |
| `POST /admin/device/transactions/{id}/ignore` | Chuyển `ignored` kèm lý do |
| `GET /admin/device/status` | Online/offline, pin, mạng, hàng đợi, giờ nhận gần nhất |

Giao diện admin cần có: tab "Giao dịch thiết bị" (lọc theo trạng thái), nút **Khớp với đơn…** (tìm đơn theo số tiền/thời gian gần), nút **Duyệt**, nút **Giao lại** (cho `fulfill_failed`), ô ghi chú, huy hiệu trạng thái cổng ở thanh đầu trang. Thao tác khớp tay yêu cầu quyền `manage-payments` và xác nhận lại.

### 5.13. Endpoint trạng thái đơn cho frontend

`GET /api/v1/orders/{payment_code}/status` trả `{status, expires_at, remaining_seconds, gateway_online}`. Chỉ trả thông tin tối thiểu, **không** lộ nội dung đơn hay tài khoản đã giao; việc nhận hàng cần xác thực chủ đơn như hiện tại.

---

## 6. PHÍA ANDROID

Hai mức triển khai, dùng chung một API:

| | **Tier 1: MacroDroid** | **Tier 2: App Kotlin riêng** |
|---|---|---|
| Thời gian dựng | 15-30 phút | 1-2 ngày |
| Xác thực | Bearer token (`trust_level=basic`) | HMAC + timestamp (`signed`) |
| Hàng đợi bền khi mất mạng | Hạn chế (xem lưu ý) | Có (WorkManager) |
| Hạn mức tự giao | Thấp (mặc định 300.000đ) | Cao hơn (mặc định 3.000.000đ) |
| Dùng khi | Chạy thử/shadow, đơn nhỏ | Chạy chính thức lâu dài |

### 6.1. Chuẩn bị chung (cả hai tier)
1. Máy Android 8+, cắm sạc liên tục (nên dùng ổ cắm hẹn giờ/ngắt sạc khi đầy), Wi-Fi ổn định + SIM 4G dự phòng.
2. Tạo thiết bị trên server: `php artisan gateway:create "Máy TPBank" --trust=basic --package=<package_app_ngân_hàng>`. Lưu `Device ID` và `Secret`.
3. **Lấy package name thật của app ngân hàng** (không đoán): trong MacroDroid chọn trigger Notification rồi xem danh sách app, hoặc dùng `adb shell pm list packages | grep -i <tên>`.
4. Bật thông báo biến động số dư trong app ngân hàng; tắt SMS banking nếu muốn tiết kiệm phí.
5. Cấu hình máy: bật **tự động đồng bộ ngày giờ**, khóa màn hình bằng PIN, tắt hiện nội dung thông báo nhạy cảm trên màn hình khóa **không** được tắt đối với app ngân hàng (nếu ẩn nội dung thì listener không đọc được; kiểm tra bằng thử thực tế), đặt app ngân hàng + gateway ở chế độ pin **Không hạn chế**, khóa app trong Recents, tắt tự cập nhật app ngân hàng.
6. **Thu thập mẫu thông báo thật** (chuyển 1.000-2.000đ nhiều lần, có/không nội dung). Dán nguyên văn vào bộ test (mục 9) trước khi code parser.

### 6.2. Tier 1: MacroDroid

**Macro 1: Nhận tiền → Webhook**
- Trigger: *Notification Received*, chỉ app ngân hàng, nội dung chứa `+`.
- Action: *HTTP Request*
  - Method `POST`, URL `https://<domain>/api/v1/payments/device/webhook`
  - Headers: `Authorization: Bearer <SECRET>`, `X-Device-Id: <DEVICE_ID>`, `Content-Type: application/json`
  - Body:
    ```json
    {
      "app_package": "[not_pkg_name]",
      "title": "[not_title]",
      "raw_content": "[not_body]",
      "posted_at": "[year]-[month]-[day]T[hour]:[minute]:[second]+07:00"
    }
    ```
  - Tên magic text có thể khác theo phiên bản MacroDroid: kiểm tra bằng nút chèn Magic Text trong ô Body.
- Không cần `event_id`: server chống trùng bằng `dedupe_hash`. (Giây của `posted_at` giữ cho 2 thông báo giống hệt nhau trong cùng giây là rất hiếm và đã có mã đơn khác nhau.)
- Retry: thêm điều kiện nếu mã phản hồi ≠ 200 thì chờ 30 giây và thử lại (vòng lặp tối đa ~10 lần). **Lưu ý trung thực:** cơ chế này chạy trong bộ nhớ, nếu app bị kill hoặc máy khởi động lại giữa chừng thì sự kiện mất. Đây là lý do chính để lên Tier 2 và để có đối soát cuối ngày.

**Macro 2: Heartbeat**
- Trigger: *Regular Interval* mỗi 1 phút.
- Action: HTTP POST `/api/v1/payments/device/heartbeat` cùng header như trên, body `{"battery": [battery], "network": "wifi"}`.
- Nếu máy mất mạng/chết, server thấy im lặng quá 3 phút và cảnh báo.

**Macro 3 (tùy chọn): tự khởi động lại.** Trigger *Device Boot* → bật lại dịch vụ, mở MacroDroid.

### 6.3. Tier 2: App Kotlin riêng (hàng đợi bền, ký HMAC)

Phiên bản này chỉ làm đúng 3 việc: đọc thông báo, gửi có ký, heartbeat. Dưới đây là mã lõi.

**Gradle:**

```kotlin
dependencies {
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
```

**AndroidManifest.xml (phần chính):**

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<application ...>
  <service android:name=".BankListener" android:exported="true"
      android:label="Bank Gateway"
      android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
    <intent-filter>
      <action android:name="android.service.notification.NotificationListenerService"/>
    </intent-filter>
  </service>
  <service android:name=".HeartbeatService" android:exported="false"
      android:foregroundServiceType="specialUse"/>
  <receiver android:name=".BootReceiver" android:exported="true">
    <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter>
  </receiver>
</application>
```

**Config.kt** (lưu `baseUrl`, `deviceId`, `secret`, `allowedPackages` bằng `EncryptedSharedPreferences`):

```kotlin
class Config(ctx: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        ctx, "gateway_cfg",
        MasterKey.Builder(ctx).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
    var baseUrl: String get() = prefs.getString("baseUrl", "")!!; set(v) = prefs.edit().putString("baseUrl", v).apply()
    var deviceId: String get() = prefs.getString("deviceId", "")!!; set(v) = prefs.edit().putString("deviceId", v).apply()
    var secret: String get() = prefs.getString("secret", "")!!; set(v) = prefs.edit().putString("secret", v).apply()
    var allowedPackages: Set<String> get() = prefs.getStringSet("pkgs", emptySet())!!; set(v) = prefs.edit().putStringSet("pkgs", v).apply()
}
```

**Api.kt (ký HMAC, khớp middleware phía server):**

```kotlin
object Api {
    private val client = OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS).build()

    private fun hex(b: ByteArray) = b.joinToString("") { "%02x".format(it) }
    private fun sha256(s: String) = hex(MessageDigest.getInstance("SHA-256").digest(s.toByteArray()))
    private fun hmac(key: String, msg: String): String {
        val m = Mac.getInstance("HmacSHA256"); m.init(SecretKeySpec(key.toByteArray(), "HmacSHA256"))
        return hex(m.doFinal(msg.toByteArray()))
    }

    /** Trả về mã HTTP. Ném IOException khi lỗi mạng. */
    fun post(cfg: Config, path: String, body: String): Int {
        val ts = (System.currentTimeMillis() / 1000).toString()          // ký MỚI ở mỗi lần thử
        val sig = hmac(cfg.secret, "$ts\n${sha256(body)}")
        val req = Request.Builder().url(cfg.baseUrl + path)
            .header("X-Device-Id", cfg.deviceId)
            .header("X-Timestamp", ts)
            .header("X-Signature", sig)
            .post(body.toRequestBody("application/json".toMediaType())).build()
        client.newCall(req).execute().use { return it.code }
    }
}
```

**BankListener.kt (đọc thông báo, tạo `event_id` cố định):**

```kotlin
class BankListener : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val cfg = Config(this)
        if (sbn.packageName !in cfg.allowedPackages) return
        val e = sbn.notification.extras
        val title = e.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val body = (e.getCharSequence(Notification.EXTRA_BIG_TEXT)
            ?: e.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
        if (!Regex("""\+\s*\d""").containsMatchIn(body)) return          // chỉ tiền vào

        // Cùng một thông báo (kể cả bị Android đăng lại) → cùng event_id → server chống trùng
        val eventId = UUID.nameUUIDFromBytes(
            "${sbn.packageName}|${sbn.postTime}|$body".toByteArray()).toString()
        Sender.enqueue(this, eventId, sbn.packageName, title, body, sbn.postTime)
    }
}
```

**Sender.kt + SendWorker.kt (hàng đợi bền, retry lũy thừa):**

```kotlin
object Sender {
    fun enqueue(ctx: Context, eventId: String, pkg: String, title: String, body: String, postTime: Long) {
        val req = OneTimeWorkRequestBuilder<SendWorker>()
            .setInputData(workDataOf("event_id" to eventId, "pkg" to pkg,
                "title" to title, "body" to body, "post_time" to postTime))
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .addTag("tx").build()
        // KEEP: nếu cùng event_id đang chờ thì không tạo thêm
        WorkManager.getInstance(ctx).enqueueUniqueWork("tx-$eventId", ExistingWorkPolicy.KEEP, req)
    }
}

class SendWorker(ctx: Context, p: WorkerParameters) : CoroutineWorker(ctx, p) {
    override suspend fun doWork(): Result {
        val cfg = Config(applicationContext)
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US)
            .format(Date(inputData.getLong("post_time", System.currentTimeMillis())))
        val json = JSONObject().apply {
            put("event_id", inputData.getString("event_id"))
            put("app_package", inputData.getString("pkg"))
            put("title", inputData.getString("title"))
            put("raw_content", inputData.getString("body"))
            put("posted_at", iso)
        }.toString()
        return try {
            when (Api.post(cfg, "/api/v1/payments/device/webhook", json)) {
                in 200..299 -> Result.success()
                422         -> Result.failure()      // payload sai: retry vô ích
                else        -> Result.retry()        // 401 (lệch giờ?), 429, 5xx
            }
        } catch (e: IOException) { Result.retry() }
    }
}
```

**HeartbeatService.kt (dịch vụ foreground, gửi mỗi 60 giây):**

```kotlin
class HeartbeatService : Service() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        val ch = "hb"
        getSystemService(NotificationManager::class.java)
            .createNotificationChannel(NotificationChannel(ch, "Gateway", NotificationManager.IMPORTANCE_LOW))
        startForeground(1, Notification.Builder(this, ch)
            .setContentTitle("Cổng nhận tiền đang chạy").setSmallIcon(android.R.drawable.stat_notify_sync).build())
        scope.launch {
            while (isActive) {
                try {
                    val cfg = Config(applicationContext)
                    val bm = getSystemService(BatteryManager::class.java)
                    val pending = WorkManager.getInstance(applicationContext).getWorkInfos(
                        WorkQuery.Builder.fromStates(listOf(WorkInfo.State.ENQUEUED, WorkInfo.State.RUNNING)).build()
                    ).get().size
                    val body = JSONObject().apply {
                        put("battery", bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY))
                        put("network", "online")
                        put("app_version", "1.0")
                        put("pending_queue", pending)
                    }.toString()
                    Api.post(cfg, "/api/v1/payments/device/heartbeat", body)
                } catch (_: Exception) {}
                delay(60_000)
            }
        }
        return START_STICKY
    }
    override fun onBind(i: Intent?): IBinder? = null
    override fun onDestroy() { scope.cancel() }
}
```

**BootReceiver:** khi `BOOT_COMPLETED` thì `startForegroundService(HeartbeatService)`.

**MainActivity (màn hình duy nhất, đơn giản):**
- Các ô nhập: Base URL, Device ID, Secret, danh sách package (mỗi dòng một package).
- Nút **Cấp quyền đọc thông báo** (mở `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`).
- Nút **Bỏ tối ưu pin** (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).
- Nút **Bật dịch vụ** (start `HeartbeatService`).
- Nút **Gửi giao dịch thử** (gửi một sự kiện giả có `+1,000VND ACCTEST...` để kiểm tra đường truyền và chữ ký) và hiển thị mã phản hồi.
- Hiển thị: trạng thái quyền, số sự kiện đang chờ, kết quả heartbeat gần nhất.

> Lưu ý: nhiều hãng (Xiaomi, Oppo, Vivo, Samsung) có trình "quản lý pin/tự khởi động" riêng. Phải bật **Autostart** và đặt app ở "Không hạn chế" theo từng hãng, nếu không dịch vụ vẫn có thể bị tắt ngầm. Tham khảo `dontkillmyapp.com` cho đúng hãng của máy.

---

## 7. BẢO MẬT

| Mối đe dọa | Biện pháp |
|---|---|
| Lộ secret, kẻ lạ bắn thông báo giả để nhận hàng miễn phí | Secret riêng mỗi thiết bị, lưu mã hóa; tier `signed` dùng HMAC (secret không đi qua mạng); có xoay secret; không dùng secret mẫu; HTTPS bắt buộc |
| Phát lại gói tin đã bắt | Timestamp ±5 phút (tier signed) + `event_id`/`dedupe_hash` UNIQUE: phát lại không tạo thêm hiệu ứng |
| App khác trên máy tạo thông báo giả | Chỉ chấp nhận `app_package` nằm trong `allowed_packages`; máy chuyên dụng, không cài app lạ |
| Chuyển thiếu/giả số tiền | Chỉ giao khi tổng tiền đã khớp ≥ tổng đơn; cộng dồn có kiểm soát |
| Đơn lớn bị gian lận | Hạn mức tự giao theo tier; vượt hạn mức → `pending_review` (admin đối chiếu sao kê rồi duyệt) |
| Race condition giao 2 lần | `lockForUpdate` + `fulfillOrder` kiểm tra lại trạng thái trong transaction |
| Brute-force/spam webhook | Rate limit theo `X-Device-Id`, xác thực trước khi parse, giới hạn kích thước payload (`max:2000`) |
| Lộ dữ liệu nhạy cảm trong thông báo | Che số dư và số tài khoản trước khi lưu, tự xóa sau N ngày, quyền xem tối thiểu trong admin |
| Injection qua `raw_content` | Chỉ dùng Eloquent/binding, escape khi hiển thị trong admin, không `eval`/không ghép SQL |
| Mất điện thoại | Khóa màn hình + Find My Device; vô hiệu thiết bị bằng `is_active = false` rồi xoay secret |
| Admin lạm quyền khớp tay | Quyền riêng `manage-payments`, ghi `matched_by`, lưu lịch sử, xác nhận 2 bước cho số tiền lớn |

---

## 8. VẬN HÀNH

### 8.1. Giám sát
- **Heartbeat 60s**, watchdog báo Telegram sau 3 phút im lặng, và báo khi hồi phục.
- Chỉ số cần xem hằng ngày: tỷ lệ `unmatched / tổng`, số `pending_review`, độ trễ trung bình (`created_at - posted_at`), hàng đợi tồn trên điện thoại.
- **Cảnh báo định dạng đổi:** nếu trong 1 giờ có ≥ 3 giao dịch `unmatched` liên tiếp hoặc tỷ lệ `unmatched` > 30% → báo Telegram "có thể ngân hàng đổi định dạng thông báo".

### 8.2. Đối soát cuối ngày
1. Báo cáo tự động lúc 23:55 (mục 5.11).
2. Admin đối chiếu **tổng tiền vào** trong sao kê ngân hàng với tổng `fulfilled + unmatched + underpaid + late_paid + duplicate_paid` trong ngày.
3. Chênh lệch ⇒ có thông báo bị mất (điện thoại offline/bị kill): tìm giao dịch trong sao kê, khớp tay bằng cách thêm bản ghi thủ công (hoặc xử lý ngoài hệ thống) rồi ghi chú.
4. (Giai đoạn sau) Nhập sao kê CSV để tự động so khớp.

### 8.3. Chính sách xử lý ngoại lệ

| Tình huống | Xử lý |
|---|---|
| Khách quên/sai nội dung CK | `unmatched` → admin tìm đơn theo số tiền + giờ, bấm **Khớp** |
| Khách chuyển thiếu | `underpaid`; khách chuyển bù đúng cùng mã thì tự cộng dồn và giao; hoặc admin quyết định (force/hoàn) |
| Khách chuyển dư | Vẫn giao, ghi chú "dư X đồng", admin hoàn phần dư theo chính sách |
| Chuyển sau khi đơn hết hạn | `late_paid`: admin giao (nếu còn hàng) hoặc hoàn tiền |
| Hết hàng khi đã nhận tiền | `fulfill_failed` + cảnh báo; nhập kho rồi bấm **Giao lại**, hoặc hoàn tiền |
| SePay và Android cùng báo | Chỉ một kênh giao; kênh sau nhận `duplicate_paid` (ghi nhận, không giao) |
| Khách chuyển 2 lần cùng một đơn | Lần 2 là `duplicate_paid` → hoàn tiền lần 2 |

### 8.4. Runbook sự cố

**A. Cảnh báo "Cổng mất kết nối":**
1. Gọi/nhờ người ở gần máy: kiểm tra Wi-Fi, pin, app còn chạy, thông báo "Cổng nhận tiền đang chạy" còn không.
2. Trong lúc chờ: chuyển `DEVICE_GATEWAY_MODE=dual` thành chế độ ưu tiên SePay (hoặc ẩn QR gateway). Đơn đã chuyển tiền trong lúc offline sẽ được gửi bù khi điện thoại online lại (Tier 2) hoặc xử lý bằng đối soát.
3. Sau khi máy online: kiểm tra `pending_queue` về 0, xem danh sách `unmatched`.

**B. Nghi ngờ lộ secret / gian lận:**
1. `is_active = false` cho thiết bị (chặn ngay).
2. `DEVICE_GATEWAY_MODE=shadow` (ngừng tự giao).
3. Rà các giao dịch `fulfilled` gần nhất, đối chiếu sao kê; thu hồi/khóa tài khoản đã giao nếu cần.
4. Tạo thiết bị mới hoặc xoay secret, cập nhật lại app điện thoại.

**C. Ngân hàng cập nhật app, thông báo đổi định dạng:**
1. Thu mẫu thông báo mới, thêm vào bộ test parser, sửa `NotificationParser`, deploy.
2. Xử lý lô `unmatched` tồn đọng bằng khớp tay.
3. Tắt tự cập nhật app ngân hàng trên máy chuyên dụng.

**D. Tắt khẩn cấp:** `DEVICE_GATEWAY_MODE=off` (webhook trả 503, SePay không ảnh hưởng).

---

## 9. KẾ HOẠCH KIỂM THỬ

### 9.1. Unit test parser (dùng **mẫu thông báo thật** thu ở Giai đoạn 1)

```php
#[DataProvider('samples')]
public function test_parse(string $raw, ?int $amount, array $codes): void
{
    $p = (new NotificationParser)->parse($raw);
    $this->assertSame($amount, $p->amount);
    $this->assertSame($codes, $p->codes);
}
public static function samples(): array
{
    return [
        'tpbank'  => ['GD: +50,000VND vao luc 14:35. ND: ACCK7M2XQ9P Nguyen Van A chuyen tien. So du: 1,500,000VND', 50000, ['ACCK7M2XQ9P']],
        'bo dau'  => ['TK 0123 | GD: +100,000VND | ND: ACC-K7M2-XQ9P THANH TOAN', 100000, ['ACCK7M2XQ9P']],
        'chu thuong' => ['+200.000 VND nd: acck7m2xq9p', 200000, ['ACCK7M2XQ9P']],
        'tru tien' => ['GD: -50,000VND ND: ...', null, []],
        'khuyen mai' => ['Uu dai giam 50% khi nap +10,000d ...', 10000, []], // phải kiểm tra thêm bằng lọc app/nội dung
        'thap phan' => ['+50,000.00 VND ND: ACCK7M2XQ9P', 50000, ['ACCK7M2XQ9P']],
        'bi cat' => ['+50,000VND ND: ACCK7M2', 50000, []],            // → unmatched
    ];
}
```

### 9.2. Test tích hợp (Feature test)

| Kịch bản | Kỳ vọng |
|---|---|
| Sai/thiếu chữ ký, lệch giờ > 5 phút | 401 |
| Thiết bị `is_active=false` | 401 |
| Package không nằm trong allowlist | 200 `ignored`, không tạo bản ghi |
| Gửi cùng `event_id` 2 lần | Lần 2: `already_processed`, chỉ giao 1 lần |
| Chuyển đúng tiền, đơn `pending` | `fulfilled`, đơn `paid` |
| Chuyển thiếu rồi chuyển bù | `underpaid` → `fulfilled` (cộng dồn) |
| Chuyển dư | `fulfilled` kèm ghi chú dư |
| Đơn hết hạn | `late_paid` |
| Mã không tồn tại | `unmatched` |
| Vượt hạn mức tự giao | `pending_review`; sau `approve` thì `fulfilled` |
| Hết kho | `fulfill_failed`; nhập kho + giao lại thành công |
| Chế độ `shadow` / `off` | Không giao / 503 |
| **Đồng thời:** 2 request cùng mã đơn gần như cùng lúc | Chỉ giao đúng 1 lần |
| **Song song SePay:** SePay giao trước, Android đến sau | Android nhận `duplicate_paid`, không gắp thêm tài khoản |
| Payload thiếu trường/quá dài | 422 |

Bài test đồng thời: dùng 2 tiến trình (`Process`/`parallel`) hoặc test gọi `processor->process()` trong hai connection DB cùng lúc, rồi kiểm tra chỉ có một dòng kho bị gắp.

### 9.3. Test phía điện thoại (thủ công, ghi biên bản)
- Chuyển tiền thật 1.000đ ×10 lần: đo độ trễ từ lúc ngân hàng báo đến lúc `paid` (mục tiêu < 3s).
- Tắt Wi-Fi 2 phút rồi bật lại khi đang có giao dịch: kiểm tra gửi bù đúng 1 lần.
- Khóa màn hình 30 phút, để máy nghỉ: kiểm tra có nhận được thông báo (Doze).
- Khởi động lại máy: dịch vụ tự chạy lại, heartbeat tiếp tục.
- Kill app thủ công: xem watchdog có báo không.
- Thử chuyển với nội dung: đúng / sai / trống / viết thường / có dấu gạch.

---

## 10. LỘ TRÌNH TRIỂN KHAI & TIÊU CHÍ NGHIỆM THU

| Giai đoạn | Việc làm | Tiêu chí hoàn thành |
|---|---|---|
| **0. Chuẩn bị (0.5 ngày)** | Chốt các điểm ở mục 11; chọn máy; lấy package name app ngân hàng | Có biên bản chốt quyết định |
| **1. Thu mẫu thật (0.5 ngày)** | Chuyển 1-2k nhiều lần, ghi nguyên văn thông báo từng kiểu (có/không memo, memo dài) | Bộ mẫu ≥ 10 thông báo thật |
| **2. Backend lõi (2-3 ngày)** | Migration, models, observer + `payment_code`, middleware, parser, processor, controller, heartbeat, Artisan, lịch | Toàn bộ test mục 9.1-9.2 xanh |
| **3. Admin & cảnh báo (1-2 ngày)** | API/giao diện admin, Telegram, báo cáo cuối ngày, watchdog | Admin khớp tay/duyệt/giao lại được; cảnh báo offline nhận được |
| **4. Điện thoại Tier 1 (0.5 ngày)** | Macro webhook + heartbeat, chế độ `shadow` | Webhook nhận đúng từ máy thật |
| **5. Chạy bóng (1-2 tuần)** | Mode `shadow`, SePay vẫn là kênh chính; so sánh mỗi ngày | ≥ 99% giao dịch khớp đúng, 0 báo sai tiền, trễ < 3s |
| **6. Tier 2 app Kotlin (1-2 ngày)** | Dựng app, ký HMAC, WorkManager, kiểm thử mất mạng | Qua test 9.3, hàng đợi gửi bù đúng |
| **7. Bật `dual` (1-2 tuần)** | Tự giao đơn ≤ hạn mức, SePay chạy song song | 0 giao trùng, 0 giao thiếu tiền, đối soát cuối ngày khớp |
| **8. `device_primary`** | Android thành kênh chính, SePay dự phòng | 2 tuần liên tục đối soát khớp, runbook đã diễn tập |

**Điều kiện dừng/rollback ở mọi giai đoạn:** nếu có 1 vụ giao nhầm/giao thiếu tiền, về `shadow` (hoặc `off`), tìm nguyên nhân, thêm test tái hiện rồi mới tiếp tục.

---

## 11. RỦI RO & CÁC ĐIỂM CẦN CHỐT

### 11.1. Điểm cần bạn quyết định (ảnh hưởng thiết kế)
1. **Sửa `OrderService::fulfillOrder`** để thêm khóa đơn (mục 5.8). Việc này chạm vào code ngoài `SePayService`, nhưng cần thiết để an toàn khi chạy song song. Bạn có đồng ý ngoại lệ trong `AGENTS.md` không?
2. **Tên trạng thái đơn thật** (`pending/paid/expired/cancelled`...) và cột `total_amount`: V2 đang giả định.
3. **Hạn mức tự giao** cho mỗi tier (mặc định 300.000đ và 3.000.000đ) và **thời hạn đơn** (30 phút).
4. **Chính sách hoàn tiền** cho tiền dư/trễ/hết hàng (ai hoàn, trong bao lâu, hoàn bằng cách nào).
5. **Một hay nhiều ngân hàng/điện thoại:** schema đã hỗ trợ nhiều thiết bị; nếu có nhiều tài khoản nhận cần thêm cách chọn QR theo tài khoản.

### 11.2. Rủi ro còn lại
- **Phụ thuộc định dạng thông báo của ngân hàng** (có thể đổi bất cứ lúc nào). Giảm nhẹ: cảnh báo tăng `unmatched`, bộ test mẫu thật, tắt tự cập nhật app.
- **Hãng điện thoại giết tiến trình ngầm.** Giảm nhẹ: heartbeat + watchdog, cấu hình theo từng hãng, máy chuyên dụng cắm sạc.
- **Thông báo bị mất** (hiếm nhưng không thể loại bỏ hoàn toàn). Giảm nhẹ: đối soát cuối ngày với sao kê.
- **Tính hợp quy:** nhận nhiều giao dịch bán hàng bằng tài khoản cá nhân có thể bị ngân hàng để ý/hạn chế, và việc đọc thông báo tuân theo điều khoản của từng ngân hàng. Nên tham khảo điều khoản ngân hàng và, khi quy mô lớn, cân nhắc dùng tài khoản doanh nghiệp/cổng thanh toán chính thống. Ngoài ra, nội dung kinh doanh (ví dụ tài khoản game) có thể bị ràng buộc bởi điều khoản của nền tảng liên quan: đây là vấn đề pháp lý/kinh doanh cần bạn tự đánh giá, hệ thống này không giải quyết được.
- **Thông báo không phải bằng chứng pháp lý của việc nhận tiền.** Đó là lý do có hạn mức tự giao và đối soát.

---

## 12. CẤU HÌNH `.env` & TRIỂN KHAI SERVER

```env
# Gateway Android
DEVICE_GATEWAY_MODE=shadow            # off | shadow | dual | device_primary
DEVICE_GATEWAY_TOLERANCE=300
DEVICE_AUTO_LIMIT_BASIC=300000
DEVICE_AUTO_LIMIT_SIGNED=3000000
DEVICE_OFFLINE_AFTER=180
DEVICE_TX_RETENTION_DAYS=90
GATEWAY_TELEGRAM_TOKEN=
GATEWAY_TELEGRAM_CHAT_ID=
```

**Checklist triển khai:**
- [ ] Domain có HTTPS hợp lệ (Let's Encrypt/Cloudflare), webhook chỉ chấp nhận HTTPS.
- [ ] Đồng hồ server đồng bộ NTP (chữ ký dựa vào thời gian).
- [ ] Cron chạy `php artisan schedule:run` mỗi phút (hoặc `schedule:work` dưới Supervisor).
- [ ] `php artisan migrate`, backfill `payment_code` cho đơn `pending` cũ.
- [ ] Tạo thiết bị bằng `gateway:create`, cất secret vào trình quản lý mật khẩu (không commit vào git, không dán vào file kế hoạch).
- [ ] Thử Telegram: gửi cảnh báo thử.
- [ ] Sao lưu DB hằng ngày (bảng `device_transactions` là chứng từ đối soát).
- [ ] Mọi log ở mức `warning` trở lên cho `device_gateway.*` được theo dõi.