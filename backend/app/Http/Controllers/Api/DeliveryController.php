<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class DeliveryController extends Controller
{
    /**
     * Xem thông tin tài khoản đã mua (chỉ khi đơn đã thanh toán)
     */
    public function details(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)
            ->with(['items.product.category'])
            ->firstOrFail();

        if (!$order->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng chưa được thanh toán thành công.',
                'status' => $order->status,
            ], 403);
        }

        $items = $order->items->map(function ($item) {
            $parsed = $this->parseAccountCredentials($item->delivered_credentials);
            return [
                'order_item_id' => $item->id,
                'position' => $item->position,
                'product_name' => $item->product->name,
                'category_name' => $item->product->category->name,
                'raw_credentials' => $item->delivered_credentials,
                'parsed' => $parsed,
                'warranty_expires_at' => $item->warranty_expires_at?->toIso8601String(),
                'is_warranty_valid' => $item->isWarrantyValid(),
                'replacement_count' => $item->replacement_count,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'customer_name' => $order->customer_name,
                'total_amount' => $order->total_amount,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'items_count' => $items->count(),
                'items' => $items,
            ],
        ]);
    }

    /**
     * Tải file TXT danh sách tài khoản đơn hàng
     */
    public function downloadTxt(string $orderCode): Response
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$order->isPaid()) {
            abort(403, 'Đơn hàng chưa thanh toán.');
        }

        $content = "====================================================\n";
        $content .= "DTFF SHOP - ĐƠN HÀNG: {$order->order_code}\n";
        $content .= "Khách hàng: {$order->customer_name}\n";
        $content .= "Thời gian thanh toán: {$order->paid_at}\n";
        $content .= "Tổng tiền: " . number_format($order->total_amount) . " VNĐ\n";
        $content .= "====================================================\n\n";

        foreach ($order->items as $idx => $item) {
            $pos = $idx + 1;
            $content .= "[TÀI KHOẢN #{$pos}] - {$item->product->name}\n";
            $content .= "Hạn bảo hành đến: {$item->warranty_expires_at}\n";
            $content .= "Thông tin acc:\n";
            $content .= $item->delivered_credentials . "\n";
            $content .= "----------------------------------------------------\n\n";
        }

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"DTFF_DonHang_{$order->order_code}.txt\"",
        ]);
    }

    /**
     * Tra cứu chi tiết tài khoản (Check Acc UI)
     */
    public function checkAcc(string $orderCode, int $position): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$order->isPaid()) {
            return response()->json(['success' => false, 'message' => 'Đơn hàng chưa thanh toán'], 403);
        }

        $item = $order->items->where('position', $position)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản tại vị trí này'], 404);
        }

        $parsed = $this->parseAccountCredentials($item->delivered_credentials);

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'position' => $position,
                'total_items' => $order->items->count(),
                'product_name' => $item->product->name,
                'parsed' => $parsed,
                'raw' => $item->delivered_credentials,
                'warranty_expires_at' => $item->warranty_expires_at?->toIso8601String(),
                'is_warranty_valid' => $item->isWarrantyValid(),
            ],
        ]);
    }

    /**
     * Tải giao diện HTML 3D Interactive Kho Acc (tương tự bot cũ)
     */
    public function downloadHtml(string $orderCode): Response
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$order->isPaid()) {
            abort(403, 'Đơn hàng chưa thanh toán.');
        }

        $itemsJson = json_encode($order->items->map(function ($it) {
            return [
                'position' => $it->position + 1,
                'name' => $it->product->name,
                'data' => $this->parseAccountCredentials($it->delivered_credentials),
                'raw' => $it->delivered_credentials,
            ];
        }), JSON_UNESCAPED_UNICODE);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DTFF SHOP - Kho Acc Đơn {$order->order_code}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #0b0f19; color: #e2e8f0; font-family: system-ui, sans-serif; }
        .card { background: #131b2e; border: 1px solid #1e293b; }
        .badge { background: #00d26a22; color: #00d26a; border: 1px solid #00d26a55; }
    </style>
</head>
<body class="p-6 max-w-4xl mx-auto">
    <header class="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-white">🎮 DTFF SHOP - Kho Acc Trực Tuyến</h1>
            <p class="text-slate-400 text-sm">Mã đơn: <b class="text-emerald-400">{$order->order_code}</b> | Khách: {$order->customer_name}</p>
        </div>
        <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm">In / Lưu PDF</button>
    </header>

    <div id="acc-list" class="space-y-6"></div>

    <script>
        const items = {$itemsJson};
        const container = document.getElementById('acc-list');

        items.forEach(item => {
            const d = item.data;
            const el = document.createElement('div');
            el.className = 'card p-6 rounded-xl shadow-lg';
            el.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="badge px-3 py-1 rounded-full text-xs font-semibold">Tài Khoản #\${item.position}</span>
                        <h2 class="text-xl font-bold text-white mt-1">\${item.name}</h2>
                    </div>
                    <button onclick="navigator.clipboard.writeText('\${d.username}:\${d.password}'); alert('Đã sao chép TK:MK!');" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold">Sao Chép TK:MK</button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-lg mb-4 text-sm">
                    <div><span class="text-slate-500 block text-xs">Tài khoản</span><b class="text-white select-all">\${d.username}</b></div>
                    <div><span class="text-slate-500 block text-xs">Mật khẩu</span><b class="text-amber-400 select-all">\${d.password}</b></div>
                    <div><span class="text-slate-500 block text-xs">Rank</span><b class="text-emerald-400">\${d.rank || 'Unranked'}</b></div>
                    <div><span class="text-slate-500 block text-xs">Tổng Skin</span><b class="text-purple-400">\${d.skins_count || 0} skins</b></div>
                </div>

                <details class="text-xs text-slate-400 bg-slate-950/50 p-3 rounded">
                    <summary class="cursor-pointer text-slate-300 font-medium">Xem log chi tiết tài khoản</summary>
                    <pre class="mt-2 whitespace-pre-wrap font-mono">\${item.raw}</pre>
                </details>
            `;
            container.appendChild(el);
        });
    </script>
</body>
</html>
HTML;

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"DTFF_KhoAcc_{$order->order_code}.html\"",
        ]);
    }

    /**
     * Trích xuất thông tin có cấu trúc từ credentials raw log
     */
    protected function parseAccountCredentials(?string $raw): array
    {
        $raw = trim((string) $raw);
        $data = [
            'username' => '',
            'password' => '',
            'riot_id' => '',
            'rank' => 'Unranked',
            'peak_rank' => '',
            'level' => 1,
            'skins_count' => 0,
            'knives' => [],
            'is_cs' => false,
        ];

        if (empty($raw)) {
            return $data;
        }

        // Trường hợp đơn giản username:password
        if (!str_contains($raw, "\n") && str_contains($raw, ':')) {
            $parts = explode(':', $raw, 2);
            $data['username'] = trim($parts[0]);
            $data['password'] = trim($parts[1]);
            return $data;
        }

        // Trích xuất từ định dạng log chi tiết
        if (preg_match('/Username:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['username'] = trim($m[1]);
        }
        if (preg_match('/Password:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['password'] = trim($m[1]);
        }
        if (preg_match('/Riot ID:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['riot_id'] = trim($m[1]);
        }
        if (preg_match('/Rank:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['rank'] = trim($m[1]);
        }
        if (preg_match('/Peak Rank:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['peak_rank'] = trim($m[1]);
        }
        if (preg_match('/Level:\s*(\d+)/i', $raw, $m)) {
            $data['level'] = (int) $m[1];
        }
        if (preg_match('/Total Skins:\s*(\d+)/i', $raw, $m)) {
            $data['skins_count'] = (int) $m[1];
        }
        if (preg_match('/Knives:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['knives'] = array_map('trim', explode(',', $m[1]));
        }

        if (str_contains(strtolower($raw), 'steam') || str_contains(strtolower($raw), 'csgo')) {
            $data['is_cs'] = true;
        }

        return $data;
    }
}
