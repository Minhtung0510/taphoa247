<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Gửi mã OTP xác thực qua Email
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => [
                'required',
                'string',
                'max:150',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/',
            ],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.regex' => 'Email không đúng định dạng. Email phải có đuôi tên miền hợp lệ (Ví dụ: tenban@gmail.com).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $email = strtolower(trim((string) $request->email));

        // Kiểm tra email đã được đăng ký chưa
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Địa chỉ email này đã được sử dụng. Vui lòng chuyển sang tab Đăng nhập.',
            ], 422);
        }

        // Chống spam gửi OTP (giới hạn 60s / lần)
        $rateKey = 'otp_rate_' . md5($email . '|' . $request->ip());
        if (Cache::has($rateKey)) {
            $ttl = Cache::get($rateKey) - time();
            return response()->json([
                'success' => false,
                'message' => "Vui lòng chờ {$ttl} giây nữa trước khi yêu cầu gửi lại mã OTP.",
            ], 429);
        }

        $code = sprintf('%06d', random_int(100000, 999999));
        Cache::put('otp_' . $email, $code, now()->addMinutes(10));
        Cache::put($rateKey, time() + 60, 60);

        try {
            Mail::html(
                '<div style="background:#050a14; color:#f1f5f9; padding:35px 25px; font-family:\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; border-radius:14px; max-width:500px; margin:0 auto; border:1px solid #1e293b; text-align:center;">' .
                '<h2 style="color:#00e5a0; margin:0 0 10px 0; font-size:24px; font-weight:800; letter-spacing:1px;">TẠP HÓA 247</h2>' .
                '<p style="color:#94a3b8; font-size:13px; margin:0 0 20px 0;">Mã xác thực đăng ký tài khoản khách hàng</p>' .
                '<div style="background:#0b1329; border:1px solid #00e5a0; border-radius:10px; padding:18px 25px; display:inline-block; margin:15px 0;">' .
                '<span style="font-size:34px; font-weight:900; letter-spacing:8px; color:#00e5a0; font-family:monospace;">' . $code . '</span>' .
                '</div>' .
                '<p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:20px 0 0 0;">Mã OTP có hiệu lực trong vòng <b>10 phút</b>.<br/>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>' .
                '<hr style="border:none; border-top:1px solid #1e293b; margin:25px 0;" />' .
                '<span style="color:#64748b; font-size:11px;">Hệ thống bảo vệ Tạp Hóa 247 Shield • https://taphoa247.io.vn</span>' .
                '</div>',
                function ($message) use ($email) {
                    $message->to($email)
                        ->subject('[TẠP HÓA 247] Mã xác thực OTP đăng ký tài khoản');
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc mục Spam).',
            ]);
        } catch (\Throwable $e) {
            Log::error('[Mail OTP Error] Không thể gửi email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi email xác thực. Vui lòng kiểm tra lại cấu hình SMTP hoặc liên hệ Admin.',
            ], 500);
        }
    }

    /**
     * Đăng ký tài khoản (Email + Mật khẩu + OTP Xác thực)
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => [
                'required',
                'string',
                'max:150',
                'unique:users',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/',
            ],
            'password' => 'required|string|min:6',
            'otp' => 'required|string|size:6',
        ], [
            'name.required' => 'Vui lòng nhập họ và tên hoặc biệt danh.',
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.regex' => 'Email không đúng định dạng. Email phải có đuôi tên miền hợp lệ (Ví dụ: tenban@gmail.com).',
            'email.unique' => 'Email này đã được đăng ký tài khoản.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'otp.required' => 'Vui lòng nhập mã OTP 6 số đã gửi về email.',
            'otp.size' => 'Mã OTP phải gồm 6 chữ số.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $cleanName = htmlspecialchars(strip_tags(trim($validated['name'])), ENT_QUOTES, 'UTF-8');
        $cleanEmail = strtolower(trim($validated['email']));

        // Kiểm tra OTP hợp lệ
        $cachedOtp = Cache::get('otp_' . $cleanEmail);
        if (!$cachedOtp || $cachedOtp !== trim($request->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không chính xác hoặc đã hết hạn. Vui lòng bấm gửi lại mã mới.',
            ], 422);
        }
        Cache::forget('otp_' . $cleanEmail);

        $user = User::create([
            'name' => $cleanName,
            'email' => $cleanEmail,
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
            'email_verified_at' => now(),
            'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($cleanEmail),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                    'discord_id' => $user->discord_id,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Đăng nhập (Email/SĐT + Mật khẩu) - Chống dò quét Brute-Force mật khẩu
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
        ], [
            'email.required' => 'Vui lòng nhập email hoặc số điện thoại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $cleanEmail = strtolower(trim((string) $request->email));
        $throttleKey = Str::transliterate($cleanEmail . '|' . $request->ip());

        // Kiểm tra số lần thử sai (Khóa 15 phút nếu sai quá 5 lần)
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            Log::warning("[Auth BruteForce Lockout] IP {$request->ip()} bị tạm khóa 15p do nhập sai 5 lần tài khoản {$cleanEmail}");
            return response()->json([
                'success' => false,
                'message' => "Bạn đã nhập sai mật khẩu quá 5 lần. Nhằm chống tấn công rà quét mật khẩu, hệ thống tạm khóa đăng nhập tài khoản này trong {$seconds} giây.",
            ], 429)->header('Retry-After', (string) $seconds);
        }

        $user = User::where('email', $cleanEmail)
            ->orWhere('email', $cleanEmail . '@taphoa247.io.vn')
            ->first();

        if (!$user || !$user->password || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 900); // 15 phút
            $remaining = RateLimiter::retriesLeft($throttleKey, 5);
            return response()->json([
                'success' => false,
                'message' => "Thông tin tài khoản hoặc mật khẩu không chính xác. Bạn còn {$remaining} lần thử trước khi bị khóa tạm thời.",
            ], 401);
        }

        RateLimiter::clear($throttleKey);
        $expiresAt = $user->isAdmin() ? now()->addHours(12) : null;
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar ?: 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($user->email),
                    'discord_id' => $user->discord_id,
                    'balance' => (int) ($user->balance ?? 0),
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Lấy URL chuyển hướng Discord OAuth2
     */
    public function discordRedirect(Request $request): JsonResponse
    {
        $clientId = config('services.discord.client_id');
        $allowedRedirects = config('services.discord.allowed_redirects', [config('services.discord.redirect')]);

        $requestedRedirect = $request->input('redirect_uri');
        if ($requestedRedirect && in_array($requestedRedirect, $allowedRedirects, true)) {
            $redirectUri = $requestedRedirect;
        } else {
            $redirectUri = config('services.discord.redirect');
        }

        $isConfigured = !empty($clientId) && !empty(config('services.discord.client_secret'));

        // Sinh state ngẫu nhiên lưu cache 10 phút chống CSRF
        $state = Str::random(40);
        Cache::put("discord_oauth_state:{$state}", true, now()->addMinutes(10));

        $url = "https://discord.com/api/oauth2/authorize?" . http_build_query([
            'client_id' => $clientId ?: 'CLIENT_ID_PLACEHOLDER',
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'identify email',
            'state' => $state,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'auth_url' => $url,
                'state' => $state,
                'is_configured' => $isConfigured,
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
            ],
        ]);
    }

    /**
     * Tiếp nhận mã xác thực từ Discord Callback
     */
    public function discordCallback(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
        ]);

        // Kiểm tra và thu hồi state CSRF
        $stateKey = "discord_oauth_state:{$request->state}";
        if (!Cache::pull($stateKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập Discord không hợp lệ hoặc đã hết hạn (CSRF state mismatch). Vui lòng thử lại.',
            ], 403);
        }

        $clientId = config('services.discord.client_id');
        $clientSecret = config('services.discord.client_secret');
        $allowedRedirects = config('services.discord.allowed_redirects', [config('services.discord.redirect')]);

        $requestedRedirect = $request->input('redirect_uri');
        if ($requestedRedirect && in_array($requestedRedirect, $allowedRedirects, true)) {
            $redirectUri = $requestedRedirect;
        } else {
            $redirectUri = config('services.discord.redirect');
        }

        if (empty($clientId) || empty($clientSecret)) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống chưa thiết lập Discord Client ID / Secret. Vui lòng sử dụng tính năng Đăng nhập Discord Thử nghiệm.',
            ], 400);
        }

        try {
            $response = Http::withOptions(['verify' => false])
                ->withoutVerifying()
                ->timeout(15)
                ->asForm()
                ->post('https://discord.com/api/oauth2/token', [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'grant_type' => 'authorization_code',
                    'code' => $request->code,
                    'redirect_uri' => $redirectUri,
                ]);

            if ($response->failed()) {
                Log::error('[Discord OAuth] Token exchange error: ' . $response->body());
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể kết nối tới Discord API để xác thực mã. Vui lòng thử lại sau.',
                ], 400);
            }

            $tokenData = $response->json();
            $accessToken = $tokenData['access_token'] ?? null;

            if (!$accessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Discord không trả về mã access token.',
                ], 400);
            }

            // Lấy thông tin user Discord
            $userRes = Http::withOptions(['verify' => false])
                ->withoutVerifying()
                ->timeout(15)
                ->withToken($accessToken)
                ->get('https://discord.com/api/users/@me');
            if ($userRes->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể lấy thông tin người dùng từ Discord.',
                ], 400);
            }

            $discordUser = $userRes->json();
            $discordId = (string) $discordUser['id'];
            $rawEmail = isset($discordUser['email']) ? strtolower(trim((string) $discordUser['email'])) : null;
            $isVerified = !empty($discordUser['verified']);
            $name = $discordUser['global_name'] ?? $discordUser['username'] ?? 'Discord User';

            // Định dạng avatar Discord
            $avatar = null;
            if (!empty($discordUser['avatar'])) {
                $avatar = "https://cdn.discordapp.com/avatars/{$discordId}/{$discordUser['avatar']}.png";
            } else {
                $avatar = "https://cdn.discordapp.com/embed/avatars/" . (abs(crc32($discordId)) % 5) . ".png";
            }

            // 1. Tìm user đã liên kết discord_id từ trước
            $user = User::where('discord_id', $discordId)->first();

            // 2. Nếu chưa liên kết theo discord_id, kiểm tra liên kết theo email
            if (!$user && !empty($rawEmail)) {
                $existingUser = User::where('email', $rawEmail)->first();
                if ($existingUser) {
                    if (!$isVerified) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Email của tài khoản Discord này chưa được xác minh (unverified). Để tránh bị chiếm đoạt tài khoản, vui lòng đăng nhập bằng mật khẩu hoặc xác minh email trên Discord rồi thử lại.',
                        ], 409);
                    }
                    $user = $existingUser;
                }
            }

            // BẢO MẬT: Ngăn chặn chiếm quyền Admin bằng email Discord trùng email quản trị viên
            if ($user && $user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tài khoản Quản trị viên không được phép đăng nhập trực tiếp qua Discord OAuth. Vui lòng đăng nhập qua cổng Quản trị.',
                ], 403);
            }

            if (!$user) {
                // Chưa có user: Nếu email chưa verified hoặc rỗng thì dùng email giả độc lập
                $finalEmail = ($isVerified && !empty($rawEmail))
                    ? $rawEmail
                    : "discord_{$discordId}@dtffshop.local";

                $user = User::create([
                    'name' => $name,
                    'email' => $finalEmail,
                    'discord_id' => $discordId,
                    'avatar' => $avatar,
                    'role' => 'customer',
                    'password' => null,
                    'email_verified_at' => $isVerified ? now() : null,
                ]);
            } else {
                $user->update([
                    'discord_id' => $discordId,
                    'avatar' => $avatar,
                    'name' => $user->name ?: $name,
                ]);
            }

            $expiresAt = $user->isAdmin() ? now()->addHours(12) : null;
            $token = $user->createToken('discord_token', ['*'], $expiresAt)->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập bằng tài khoản Discord thành công.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'avatar' => $user->avatar,
                        'discord_id' => $user->discord_id,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('[Discord OAuth Exception]: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối tới máy chủ Discord. Vui lòng thử lại sau.',
            ], 500);
        }
    }

    /**
     * Đăng nhập giả lập Discord 1-click (dành cho trải nghiệm tức thì trên môi trường test)
     */
    public function discordMock(Request $request): JsonResponse
    {
        if (app()->environment('production') || !config('app.allow_mock_auth', false)) {
            return response()->json([
                'success' => false,
                'message' => 'Phương thức đăng nhập giả lập đã bị vô hiệu hóa trên môi trường sản xuất (Production).',
            ], 404);
        }

        $mockId = $request->input('discord_id', '988234125678901234');
        $mockName = $request->input('name', 'Discord Gamer VIP');
        $mockEmail = $request->input('email', 'gamer_vip@discord.local');
        $mockAvatar = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';

        $user = User::where('discord_id', $mockId)->first();
        if (!$user) {
            $user = User::where('email', $mockEmail)->first();
        }

        if ($user && $user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể sử dụng tài khoản Quản trị viên cho phương thức thử nghiệm này.',
            ], 403);
        }

        if (!$user) {
            $user = User::create([
                'name' => $mockName,
                'email' => $mockEmail,
                'discord_id' => $mockId,
                'avatar' => $mockAvatar,
                'role' => 'customer',
                'password' => null,
            ]);
        } else {
            $user->update([
                'discord_id' => $mockId,
                'avatar' => $mockAvatar,
                'name' => $mockName,
                'role' => 'customer',
            ]);
        }

        $token = $user->createToken('discord_mock_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập tài khoản Discord Demo thành công.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                    'discord_id' => $user->discord_id,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Thông tin tài khoản hiện tại
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ?: 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($user->email),
                'discord_id' => $user->discord_id,
                'is_admin' => $user->isAdmin(),
                'balance' => (int) ($user->balance ?? 0),
            ],
        ]);
    }

    /**
     * Danh sách lịch sử đơn hàng của người dùng hiện tại
     */
    public function userOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        // Tự động đối soát đơn hàng pending chưa hết hạn khi người dùng mở lịch sử
        $pendingOrders = Order::where(function ($query) use ($user) {
            $query->where('user_id', $user->id);
            if ($user->hasVerifiedEmail() && !empty($user->email) && !str_contains($user->email, '@dtffshop.local')) {
                $query->orWhere('customer_email', $user->email);
            }
        })
        ->where('status', 'pending')
        ->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })
        ->get();

        if ($pendingOrders->isNotEmpty()) {
            try {
                $gateway = app(\App\Contracts\PaymentGatewayInterface::class);
                $orderService = app(\App\Services\OrderService::class);
                $history = $gateway->fetchHistory();
                if ($history) {
                    foreach ($pendingOrders as $pendingOrder) {
                        $matchedTx = $gateway->findMatchingTransaction($pendingOrder, $history);
                        if ($matchedTx) {
                            $orderService->fulfillOrder($pendingOrder, $matchedTx);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Bỏ qua nếu lỗi mạng để không làm nghẽn trang lịch sử
            }
        }

        $orders = Order::where(function ($query) use ($user) {
            $query->where('user_id', $user->id);
            if ($user->hasVerifiedEmail() && !empty($user->email) && !str_contains($user->email, '@dtffshop.local')) {
                $query->orWhere('customer_email', $user->email);
            }
        })
        ->with(['items.product.category', 'warrantyClaims.claimItems.replacementStock', 'warrantyClaims.claimItems.orderItem'])
        ->latest()
        ->get()
        ->map(function ($order) {
            return [
                'order_code' => $order->order_code,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'total_amount' => $order->total_amount,
                'status' => $order->status,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'created_at' => $order->created_at?->toIso8601String(),
                'items_count' => $order->items->count(),
                'items' => $order->items->map(function ($item) use ($order) {
                    // Tìm thông tin bảo hành của item này nếu có
                    $claimItem = null;
                    $claim = null;
                    foreach ($order->warrantyClaims as $c) {
                        $found = $c->claimItems->where('order_item_id', $item->id)->first();
                        if ($found) {
                            $claimItem = $found;
                            $claim = $c;
                            break;
                        }
                    }

                    $isPaidOrder = in_array($order->status, ['paid', 'completed']);

                    return [
                        'id' => $item->id,
                        'position' => $item->position,
                        'product_name' => $item->product?->name ?? 'Tài khoản',
                        'category_name' => $item->product?->category?->name ?? 'Game',
                        'credentials' => $isPaidOrder ? $item->delivered_credentials : null,
                        'parsed' => $isPaidOrder ? \App\Services\AccountParserService::parse($item->delivered_credentials) : null,
                        'warranty_duration_hours' => $item->warranty_duration_hours,
                        'warranty_expires_at' => $item->warranty_expires_at?->toIso8601String(),
                        'is_warranty_valid' => $item->isWarrantyValid(),
                        'replacement_count' => $item->replacement_count,
                        'claim_info' => $claim ? [
                            'claim_code' => $claim->claim_code,
                            'state' => $claim->state,
                            'status' => $claim->state,
                            'status_label' => $claim->state === 'approved' ? 'Đã đổi acc mới' : ($claim->state === 'waiting_admin' ? 'Đang chờ duyệt' : 'Từ chối'),
                            'admin_note' => $claim->admin_note,
                            'evidence_url' => $claimItem?->evidence_url,
                            'replacement_credentials' => ($claim->state === 'approved') ? $claimItem?->replacementStock?->credentials : null,
                        ] : null,
                    ];
                }),
                'warranty_claims' => $order->warrantyClaims->map(function ($claim) {
                    $firstRepl = null;
                    foreach ($claim->claimItems as $ci) {
                        if ($ci->replacementStock) {
                            $firstRepl = $ci->replacementStock->credentials;
                            break;
                        }
                    }

                    return [
                        'id' => $claim->id,
                        'claim_code' => $claim->claim_code,
                        'state' => $claim->state,
                        'status' => $claim->state,
                        'status_badge' => $claim->state === 'approved' ? 'Đã Duyệt (Đã Cấp Acc Mới)' : ($claim->state === 'waiting_admin' ? 'Đang Chờ Shop Duyệt' : 'Từ Chối'),
                        'admin_reply' => $claim->admin_note,
                        'admin_note' => $claim->admin_note,
                        'created_at' => $claim->created_at?->toIso8601String(),
                        'replacement_credentials' => $claim->state === 'approved' ? $firstRepl : null,
                        'items' => $claim->claimItems->map(function ($ci) use ($claim) {
                            return [
                                'claim_item_id' => $ci->id,
                                'order_item_id' => $ci->order_item_id,
                                'error_description' => $ci->error_description,
                                'evidence_url' => $ci->evidence_url,
                                'replacement_credentials' => $claim->state === 'approved' ? $ci->replacementStock?->credentials : null,
                            ];
                        }),
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Đăng xuất
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng xuất thành công.',
        ]);
    }
}

