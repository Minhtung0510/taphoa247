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

        if ($this->isLocalLoopback($remoteAddr)) {
            $cfConnectingIp = $request->header('CF-Connecting-IP');
            if ($cfConnectingIp && filter_var($cfConnectingIp, FILTER_VALIDATE_IP)) {
                $request->server->set('REMOTE_ADDR', $cfConnectingIp);
            }
        }

        return $next($request);
    }

    private function isLocalLoopback(?string $ip): bool
    {
        if (empty($ip)) {
            return false;
        }

        return $ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost';
    }
}
