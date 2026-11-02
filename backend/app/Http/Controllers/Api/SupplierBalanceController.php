<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DigishopResellerService;
use App\Services\ShopMmoService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SupplierBalanceController extends Controller
{
    public function __invoke(): \Illuminate\Http\JsonResponse
    {
        $data = Cache::remember('admin.supplier-balances', 30, function () {
            $readers = [
                ['id' => 'a', 'name' => 'Nguồn A', 'description' => 'AI, phần mềm và dịch vụ số', 'read' => fn () => app(DigishopResellerService::class)->getProfile()['reseller_balance'] ?? null],
                ['id' => 'b', 'name' => 'Nguồn B', 'description' => 'Tài khoản game và mạng xã hội', 'read' => fn () => app(ShopMmoService::class)->getBalance()],
                ['id' => 'c', 'name' => 'Nguồn C', 'description' => 'Tài khoản Muse AI', 'read' => function () {
                    $r = Http::withOptions(['verify' => config('services.tls.ca_bundle') ?: true])->timeout(10)
                        ->get('https://cloneus.net/api/profile.php', ['api_key' => config('services.cloneus.api_key')]);
                    return $r->successful() && $r->json('status') === 'success' ? $r->json('data.money') : null;
                }],
            ];
            $balances = [];
            foreach ($readers as $source) {
                try { $value = ($source['read'])(); } catch (\Throwable) { $value = null; }
                $valid = is_numeric($value) && $value >= 0;
                $balances[] = ['id' => $source['id'], 'name' => $source['name'], 'description' => $source['description'],
                    'balance' => $valid ? (int) $value : null, 'status' => $valid ? 'ok' : 'unavailable'];
            }
            return ['sources' => $balances, 'checked_at' => now()->toIso8601String()];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }
}
