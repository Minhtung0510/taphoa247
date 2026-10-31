<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveClientIp
{
    /**
     * Resolve authentic client IP behind Cloudflare Tunnel (cloudflared loopback)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $remoteAddr = $request->server->get('REMOTE_ADDR');

        if ($this->isLocalOrPrivate($remoteAddr)) {
            $cfConnectingIp = $request->header('CF-Connecting-IP');
            if ($cfConnectingIp && filter_var($cfConnectingIp, FILTER_VALIDATE_IP)) {
                $request->server->set('REMOTE_ADDR', $cfConnectingIp);
            }
        }

        return $next($request);
    }

    private function isLocalOrPrivate(?string $ip): bool
    {
        if (empty($ip)) {
            return false;
        }

        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return true;
        }

        // Check if IP is in private or reserved ranges
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
}
