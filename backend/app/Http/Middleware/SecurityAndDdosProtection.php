<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SecurityAndDdosProtection
{
    /**
     * Chặn tấn công DDoS, quét tự động (Flood/Spam) và gắn Header bảo mật
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (function_exists('header_remove')) {
            @header_remove('X-Powered-By');
            @header_remove('Server');
        }

        $ip = $request->ip();

        // 1. Chặn tấn công Path Traversal trên URI
        $uri = urldecode($request->getRequestUri());
        if (str_contains($uri, '../') || str_contains($uri, '..\\')) {
            Log::warning("[Security Shield] Chặn Path Traversal từ IP {$ip}: {$uri}");
            return response()->json([
                'success' => false,
                'message' => 'Yêu cầu bị từ chối do đường dẫn không hợp lệ.',
            ], 403);
        }

        // 2. Chặn Flood DDoS nhanh (Quá 80 requests trong vòng 10 giây từ 1 IP)
        $isLocal = app()->environment('local') || in_array($ip, ['127.0.0.1', '::1', 'localhost'], true);
        if (!$isLocal) {
            $floodKey = 'flood_count_' . md5($ip);
            $requestCount = (int) Cache::get($floodKey, 0);

            if ($requestCount > 300) {
                Log::warning("[DDoS/Flood] IP {$ip} bị chặn tạm thời do gửi request quá nhanh ({$requestCount} req/10s).");
                return response()->json([
                    'success' => false,
                    'message' => 'Hệ thống phát hiện dấu hiệu gửi request quá nhanh (Anti-DDoS Shield). Vui lòng thử lại sau giây lát.',
                ], 429)->header('Retry-After', '10');
            }

            Cache::put($floodKey, $requestCount + 1, 10);
        }

        // 3. Thực thi request
        $response = $next($request);

        // 4. Bổ sung các Header bảo mật chuẩn OWASP & Xóa bỏ dấu vết Server
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Shield', 'DTFF-AntiDDoS-Active');

        // Cấu hình Cache-Control tối ưu CDN Cloudflare (Tránh quá tải khi 1000 user truy cập)
        if ($request->is('api/v1/categories*') || $request->is('api/v1/products*')) {
            $response->headers->set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
            $response->headers->remove('Pragma');
            $response->headers->remove('Expires');
        } elseif ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        // Xóa dấu vết công nghệ backend (PHP / Laravel / Server banner)
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');
        if (function_exists('header_remove')) {
            @header_remove('X-Powered-By');
            @header_remove('Server');
        }

        return $response;
    }
}
