<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DeliveryController extends Controller
{
    /**
     * Xác thực quyền truy cập chi tiết đơn hàng (Chống IDOR & Khách vãng lai)
     */
    protected function verifyOrderAccess(Order $order, Request $request): bool
    {
        $user = $request->user('sanctum') ?? auth('sanctum')->user();

        // 1. Quản trị viên luôn có quyền
        if ($user && $user->isAdmin()) {
            return true;
        }

        // 2. Người dùng đã đăng nhập là chủ sở hữu đơn hàng (được gắn user_id khi đặt)
        if ($user && $order->user_id && (int) $order->user_id === (int) $user->id) {
            return true;
        }

        // 3. Khớp Access Token bảo mật của đơn hàng (Bắt buộc cho khách vãng lai hoặc qua URL bí mật)
        $providedToken = $request->header('X-Order-Token') ?: $request->query('token');
        if (!empty($order->access_token) && !empty($providedToken) && hash_equals((string) $order->access_token, (string) $providedToken)) {
            return true;
        }

        // 4. Nếu đối chiếu qua email: BẮT BUỘC tài khoản đã xác thực email thực tế
        if (
            $user &&
            $user->hasVerifiedEmail() &&
            !empty($order->customer_email) &&
            hash_equals(strtolower((string) $order->customer_email), strtolower((string) $user->email))
        ) {
            return true;
        }

        return false;
    }

    /**
     * Xem thông tin tài khoản đã mua (chỉ khi đơn đã thanh toán)
     */
    public function details(Request $request, string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)
            ->with(['items.product.category'])
            ->firstOrFail();

        if (!$this->verifyOrderAccess($order, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập thông tin tài khoản của đơn hàng này.',
            ], 403);
        }

        if (!$order->isPaid()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'order_code' => $order->order_code,
                    'access_token' => $order->access_token,
                    'customer_name' => $order->customer_name,
                    'status' => $order->status,
                    'is_paid' => false,
                    'is_expired' => $order->isExpired(),
                    'total_amount' => $order->total_amount,
                    'memo' => $order->memo,
                    'qr_url' => $order->qr_url,
                    'bank_code' => config('services.web2m.bank_code', env('BANK_CODE', 'TPB')),
                    'account_no' => config('services.web2m.account_no', env('ACCOUNT_NO', '')),
                    'is_cancelled' => $order->status === 'cancelled',
                    'remaining_seconds' => ($order->status === 'pending' && $order->expires_at) ? (int) max(0, now()->diffInSeconds($order->expires_at, false)) : 0,
                    'items_count' => $order->items->count(),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'order_item_id' => $item->id,
                            'position' => $item->position,
                            'product_name' => $item->product?->name ?? 'Tài khoản Game',
                            'category_name' => $item->product?->category?->name ?? 'Game',
                            'category_slug' => $item->product?->category?->slug,
                            'account_type' => $item->product?->account_type,
                            'delivery_format' => $item->product?->delivery_format,
                        ];
                    }),
                ],
            ]);
        }

        $items = $order->items->map(function ($item) {
            $parsed = $this->parseAccountCredentials($item->delivered_credentials);
            return [
                'order_item_id' => $item->id,
                'position' => $item->position,
                'product_name' => $item->product?->name ?? 'Tài khoản Game',
                'category_name' => $item->product?->category?->name ?? 'Game',
                'category_slug' => $item->product?->category?->slug,
                'account_type' => $item->product?->account_type,
                'delivery_format' => $item->product?->delivery_format,
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
                'access_token' => $order->access_token,
                'customer_name' => $order->customer_name,
                'status' => $order->status,
                'is_paid' => true,
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
    public function downloadTxt(Request $request, string $orderCode): Response
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$this->verifyOrderAccess($order, $request)) {
            abort(403, 'Bạn không có quyền truy cập thông tin tài khoản của đơn hàng này.');
        }

        if (!$order->isPaid()) {
            abort(403, 'Đơn hàng chưa thanh toán.');
        }

        $content = "====================================================\n";
        $content .= "TẠP HÓA 247 - ĐƠN HÀNG: {$order->order_code}\n";
        $content .= "Khách hàng: {$order->customer_name}\n";
        $content .= "Thời gian thanh toán: {$order->paid_at}\n";
        $content .= "Tổng tiền: " . number_format($order->total_amount) . " VNĐ\n";
        $content .= "====================================================\n\n";

        foreach ($order->items as $idx => $item) {
            $pos = $idx + 1;
            $productName = $item->product?->name ?? 'Tài khoản Game';
            $content .= "[TÀI KHOẢN #{$pos}] - {$productName}\n";
            $content .= "Hạn bảo hành đến: " . ($item->warranty_expires_at ? $item->warranty_expires_at->toDateTimeString() : 'Không có') . "\n";
            $content .= "Thông tin acc:\n";
            $content .= ($item->delivered_credentials ?? 'Đang cập nhật') . "\n";
            $content .= "----------------------------------------------------\n\n";
        }

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"TapHoa247_DonHang_{$order->order_code}.txt\"",
        ]);
    }

    /**
     * Tra cứu chi tiết tài khoản (Check Acc UI)
     */
    public function checkAcc(Request $request, string $orderCode, int $position): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$this->verifyOrderAccess($order, $request)) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem thông tin tài khoản của đơn hàng này.'], 403);
        }

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
                'product_name' => $item->product?->name ?? 'Tài khoản Game',
                'category_slug' => $item->product?->category?->slug,
                'account_type' => $item->product?->account_type,
                'delivery_format' => $item->product?->delivery_format,
                'parsed' => $parsed,
                'raw' => $item->delivered_credentials,
                'warranty_expires_at' => $item->warranty_expires_at?->toIso8601String(),
                'is_warranty_valid' => $item->isWarrantyValid(),
            ],
        ]);
    }

    /**
     * Tải giao diện HTML Interactive Kho Acc (Đã bảo vệ XSS & DOM Injection)
     */
    public function downloadHtml(Request $request, string $orderCode): Response
    {
        $order = Order::where('order_code', $orderCode)->with('items.product')->firstOrFail();
        if (!$this->verifyOrderAccess($order, $request)) {
            abort(403, 'Bạn không có quyền truy cập thông tin tài khoản của đơn hàng này.');
        }

        if (!$order->isPaid()) {
            abort(403, 'Đơn hàng chưa thanh toán.');
        }

        $orderCodeSafe = htmlspecialchars((string) $order->order_code, ENT_QUOTES, 'UTF-8');
        $customerNameSafe = htmlspecialchars((string) $order->customer_name, ENT_QUOTES, 'UTF-8');

        $itemsJson = json_encode($order->items->map(function ($it) {
            return [
                'position' => $it->position + 1,
                'name' => $it->product?->name ?? 'Tài khoản Game',
                'category_slug' => $it->product?->category?->slug,
                'account_type' => $it->product?->account_type,
                'delivery_format' => $it->product?->delivery_format,
                'data' => $this->parseAccountCredentials($it->delivered_credentials),
                'raw' => (string) $it->delivered_credentials,
            ];
        }), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://media.valorant-api.com data:; font-src data:; connect-src 'none';">
    <title>TẠP HÓA 247 - Chi Tiết Đơn Hàng #{$orderCodeSafe}</title>
    <style>
        * { box-sizing: border-box; }
        body { background: #070a10; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 64rem; margin: 0 auto; padding: 1.5rem; }
        #acc-list > div { background: #0b1019; border: 1px solid #263244; border-radius: 1rem; margin: 1.5rem 0; padding: 1.25rem; overflow-wrap: anywhere; }
        button { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: .75rem; padding: .7rem 1rem; cursor: pointer; }
        @media print { body { background: white; color: black; } button { display: none; } #acc-list > div { break-inside: avoid; border-color: #aaa; } }
    </style>
</head>
<body class="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid #263244">
        <div>
            <div class="text-[#00f59b] font-black text-sm tracking-wider">TẠP HÓA 247</div>
            <h1 class="text-xl sm:text-2xl font-black text-white">THÔNG TIN SẢN PHẨM ĐÃ GIAO</h1>
            <p class="text-xs text-slate-400 mt-0.5">Mã đơn: <b class="text-white">#{$orderCodeSafe}</b> | Khách hàng: {$customerNameSafe}</p>
        </div>
        <button id="btn-print-receipt" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700">In / Lưu PDF</button>
    </div>

    <div id="acc-list" class="space-y-8"></div>

    <script>
        // Hàm làm sạch dữ liệu chống Stored XSS
        function esc(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        const items = {$itemsJson};
        const container = document.getElementById('acc-list');

        const tierStyles = {
            'Ultra': { badge: 'border-[#eab308] text-[#fef08a] bg-[#eab308]/10', left: 'border-l-[#eab308]', text: 'text-[#facc15]' },
            'Exclusive': { badge: 'border-[#f97316] text-[#fed7aa] bg-[#f97316]/10', left: 'border-l-[#f97316]', text: 'text-[#fb923c]' },
            'Premium': { badge: 'border-[#ec4899] text-[#fbcfe8] bg-[#ec4899]/10', left: 'border-l-[#ec4899]', text: 'text-[#f472b6]' },
            'Deluxe': { badge: 'border-[#06b6d4] text-[#a5f3fc] bg-[#06b6d4]/10', left: 'border-l-[#06b6d4]', text: 'text-[#22d3ee]' },
            'Select': { badge: 'border-[#3b82f6] text-[#bfdbfe] bg-[#3b82f6]/10', left: 'border-l-[#3b82f6]', text: 'text-[#60a5fa]' },
        };

        const rankEmblems = {
            'unranked': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png',
            'iron': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/5/smallicon.png',
            'bronze': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/8/smallicon.png',
            'silver': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/11/smallicon.png',
            'gold': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/13/smallicon.png',
            'platinum': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/16/smallicon.png',
            'diamond': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/19/smallicon.png',
            'ascendant': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/22/smallicon.png',
            'immortal': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/smallicon.png',
            'radiant': 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png',
        };

        function getRankIcon(rank) {
            const r = (rank || '').toLowerCase();
            for (const [k, v] of Object.entries(rankEmblems)) {
                if (r.includes(k)) return v;
            }
            return rankEmblems.unranked;
        }

        items.forEach((item, index) => {
            const d = item.data || {};
            const isValorant = item.category_slug === 'valorant' || item.account_type === 'valo_acc';
            if (!isValorant) {
                const title = item.delivery_format === 'token'
                    ? 'MÃ / TOKEN ĐƯỢC GIAO'
                    : item.delivery_format === 'key_loader'
                        ? 'MÃ KÍCH HOẠT ĐƯỢC GIAO'
                        : 'THÔNG TIN GIAO HÀNG';
                const isLogin = item.delivery_format === 'raw_text' && d.username && d.password;
                const details = isLogin
                    ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:1rem">
                        <div style="padding:.85rem;border:1px solid #263244;border-radius:.75rem;background:#050a14"><div style="margin-bottom:.35rem;color:#94a3b8;font-size:.7rem">TÀI KHOẢN</div><div style="color:#e2e8f0;font: .85rem/1.5 ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere;user-select:all">\${esc(d.username)}</div></div>
                        <div style="padding:.85rem;border:1px solid #263244;border-radius:.75rem;background:#050a14"><div style="margin-bottom:.35rem;color:#94a3b8;font-size:.7rem">MẬT KHẨU</div><div style="color:#e2e8f0;font: .85rem/1.5 ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere;user-select:all">\${esc(d.password)}</div></div>
                    </div>`
                    : `<pre style="margin:.5rem 0 0;padding:1rem;border:1px solid #263244;border-radius:.75rem;background:#050a14;color:#e2e8f0;font: .85rem/1.6 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap;overflow-wrap:anywhere;user-select:all">\${esc(item.raw || 'Thông tin đang được cập nhật.')}</pre>`;
                const card = document.createElement('div');
                card.style.cssText = 'margin:1.5rem 0;padding:1.25rem;border:1px solid rgba(34,211,238,.35);border-radius:1rem;background:#0b1019;box-shadow:0 12px 32px rgba(0,0,0,.25);overflow-wrap:anywhere';
                card.innerHTML = `
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
                        <div>
                            <div style="color:#00e5a0;font-size:.75rem;font-weight:800;letter-spacing:.08em">SẢN PHẨM #\${index + 1}</div>
                            <h2 style="margin:.4rem 0 0;font-size:1.25rem;font-weight:800;color:#fff">\${esc(item.name)}</h2>
                        </div>
                        <button type="button" class="copy-delivery" style="background:#0e7490;border:0;color:#fff;font-weight:700">Sao chép toàn bộ</button>
                    </div>
                    <div style="margin-top:1.25rem;color:#67e8f9;font-size:.7rem;font-weight:800;letter-spacing:.08em">\${title}</div>
                    \${details}
                    <p style="margin:.65rem 0 0;color:#94a3b8;font-size:.75rem">Giữ nguyên định dạng giao hàng để sao chép và sử dụng chính xác.</p>
                `;
                container.appendChild(card);
                card.querySelector('.copy-delivery')?.addEventListener('click', async (event) => {
                    const button = event.currentTarget;
                    try {
                        await navigator.clipboard.writeText(item.raw || '');
                        button.textContent = 'Đã sao chép';
                    } catch {
                        window.prompt('Sao chép toàn bộ thông tin:', item.raw || '');
                    }
                });
                return;
            }
            const rankIcon = getRankIcon(d.rank);

            const tierCounts = { Ultra: 0, Exclusive: 0, Premium: 0, Deluxe: 0, Select: 0 };
            (d.weapons || []).forEach(w => {
                if (tierCounts[w.tier] !== undefined) tierCounts[w.tier]++;
                else tierCounts.Select++;
            });

            const weaponsHtml = (d.weapons && d.weapons.length > 0)
                ? d.weapons.map(w => {
                    const st = tierStyles[w.tier] || tierStyles.Select;
                    return `
                        <div class="p-3 bg-[#0c1421] border border-[#1e293b] border-l-4 \${st.left} rounded-xl flex items-center justify-between gap-3 shadow-md">
                            <div class="min-w-0 flex-1">
                                <div class="text-xs font-bold text-white truncate">\${esc(w.name)}</div>
                                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    <span class="\${st.text}">\${esc(w.tier)}</span> • \${esc(w.type)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')
                : '<div class="py-6 text-xs text-slate-500 italic">Chưa phát hiện skin súng nào trong log.</div>';

            const card = document.createElement('div');
            card.className = 'w-full bg-[#0b1019] border border-[#16202e] rounded-2xl overflow-hidden shadow-2xl relative';
            card.innerHTML = `
                <div class="h-1 w-full bg-[#00f59b]"></div>
                <div class="p-6 space-y-6">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-[#00f59b] font-black text-sm tracking-wider">TẠP HÓA 247</span>
                            <span class="text-slate-500 text-xs font-semibold">• TÀI KHOẢN #\${index + 1} (\${esc(item.name)})</span>
                        </div>
                        <div class="px-3 py-1 rounded-lg border border-[#00f59b] bg-[#00f59b]/10 text-white font-mono font-bold text-xs">
                            Đơn hàng #{$orderCodeSafe}
                        </div>
                    </div>

                    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
                        <div class="space-y-2 flex-1">
                            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">
                                \${esc(d.riot_id || d.username || 'Game Player')}
                            </h2>
                            <div class="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>Tài khoản: <b class="text-slate-200 select-all">\${esc(d.username || '—')}</b></span>
                                <span class="text-slate-600">|</span>
                                <span>Khu vực: <b class="text-slate-200">\${esc(d.region || 'AP')}</b></span>
                                <span class="text-slate-600">|</span>
                                <span>Cấp độ: <b class="text-slate-200">Lv \${esc(d.level || 1)}</b></span>
                            </div>
                            <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#00f59b] font-mono pt-0.5">
                                <span>🗹 Email: \${d.email_verified ? 'Đã xác minh' : 'Chưa xác minh'}</span>
                                <span>🗹 SĐT: \${d.phone_verified ? 'Đã liên kết' : 'Chưa liên kết'}</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-4 text-xs font-bold text-[#f59e0b] font-mono pt-1">
                                <span>🪙 VP: \${esc(d.vp || 0)}</span>
                                <span>⚡ RP: \${esc(d.rp || 0)}</span>
                                <span>👑 KC: \${esc(d.kc || 0)}</span>
                            </div>
                        </div>

                        <div class="w-full lg:w-72 p-4 bg-[#0d1624] border border-[#1e293b] rounded-2xl flex items-center gap-4 shadow-xl shrink-0">
                            <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shrink-0">
                                <img src="\${rankIcon}" alt="Rank" class="w-full h-full object-contain" />
                            </div>
                            <div class="min-w-0">
                                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">XẾP HẠNG RANK</div>
                                <div class="text-sm font-black text-[#facc15] truncate mt-0.5">\${esc(d.rank || 'Unranked')}</div>
                                <div class="text-[11px] text-slate-400 font-mono mt-0.5 truncate">Peak: <b class="text-slate-300">\${esc(d.peak_rank || 'Unranked')}</b></div>
                                <div class="text-[10px] text-slate-500 font-mono">Trận cuối: \${esc(d.last_game || 'Gần đây')}</div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3 pt-2">
                        <div class="text-xs font-bold text-[#00f59b] tracking-wide flex items-center gap-2 font-mono">
                            <span>🗹</span>
                            <span>KHO VŨ KHÍ & SKIN (\${esc(d.skins_count || (d.weapons || []).length || 0)} SKINS)</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                            <span class="px-3 py-1 rounded-lg border text-[11px] \${tierStyles.Ultra.badge}">Ultra: \${tierCounts.Ultra}</span>
                            <span class="px-3 py-1 rounded-lg border text-[11px] \${tierStyles.Exclusive.badge}">Exclusive: \${tierCounts.Exclusive}</span>
                            <span class="px-3 py-1 rounded-lg border text-[11px] \${tierStyles.Premium.badge}">Premium: \${tierCounts.Premium}</span>
                            <span class="px-3 py-1 rounded-lg border text-[11px] \${tierStyles.Deluxe.badge}">Deluxe: \${tierCounts.Deluxe}</span>
                            <span class="px-3 py-1 rounded-lg border text-[11px] \${tierStyles.Select.badge}">Select: \${tierCounts.Select}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            \${weaponsHtml}
                        </div>
                    </div>

                    <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <div>
                            <span class="text-slate-400 text-[10px] block">MẬT KHẨU TÀI KHOẢN:</span>
                            <b class="text-amber-300 text-sm select-all">\${esc(d.password || '••••••••')}</b>
                        </div>
                        <button id="copy-btn-\${index}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                            📋 Sao chép TK:MK
                        </button>
                    </div>

                    <div class="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                        <div>TẠP HÓA 247 • Thông tin sản phẩm đã giao | Mã đơn: #{$orderCodeSafe}</div>
                        <div class="text-[#00f59b] font-bold">TẠP HÓA 247</div>
                    </div>
                </div>
            `;
            container.appendChild(card);

            // Gán sự kiện click bằng addEventListener an toàn chống Injection
            const copyBtn = document.getElementById(`copy-btn-\${index}`);
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const u = d.username || '';
                    const p = d.password || '';
                    navigator.clipboard.writeText(`\${u}:\${p}`).then(() => {
                        alert('✓ Đã sao chép TK:MK vào bộ nhớ tạm!');
                    }).catch(() => {
                        prompt('Sao chép tài khoản:', `\${u}:\${p}`);
                    });
                });
            }

            const printBtn = document.getElementById('btn-print-receipt');
            if (printBtn) {
                printBtn.addEventListener('click', function() { window.print(); });
            }
        });
    </script>
</body>
</html>
HTML;

        return response($html, 200, [
            'Content-Type'              => 'text/html; charset=utf-8',
            'Content-Disposition'       => "attachment; filename=\"TapHoa247_KhoAcc_{$order->order_code}.html\"",
            'X-Content-Type-Options'    => 'nosniff',
            'X-Frame-Options'           => 'DENY',
            'Content-Security-Policy'   =>
                "default-src 'none'; " .
                "script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'; " .
                "style-src 'self' 'unsafe-inline'; " .
                "img-src 'self' https://media.valorant-api.com data:; " .
                "font-src 'self'; " .
                "connect-src 'none'; " .
                "frame-ancestors 'none';",
        ]);
    }

    /**
     * Trích xuất thông tin có cấu trúc từ credentials raw log
     */
    protected function parseAccountCredentials(?string $raw): array
    {
        return \App\Services\AccountParserService::parse($raw);
    }
}
