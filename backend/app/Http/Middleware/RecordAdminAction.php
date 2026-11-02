<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;

class RecordAdminAction
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && $response->isSuccessful()) {
            // Deliberately exclude request/response bodies: passwords, stock and API keys are secret.
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => $request->method().' '.$request->route()->uri(),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
                'details' => ['targets' => collect($request->route()->parameters())->map(fn ($v) => $v instanceof \Illuminate\Database\Eloquent\Model ? $v->getKey() : $v)->all(), 'status' => $response->getStatusCode()],
            ]);
        }
        return $response;
    }
}
