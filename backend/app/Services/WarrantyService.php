<?php

namespace App\Services;

use App\Models\AccountStock;
use App\Models\ClaimItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\WarrantyClaim;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class WarrantyService
{
    const MAX_ITEMS_PER_CLAIM = 10;
    const MAX_FILE_SIZE_BYTES = 26214400; // 25 MB
    const MAX_BATCH_SIZE_BYTES = 104857600; // 100 MB

    /**
     * Lấy danh sách các tài khoản trong đơn đủ điều kiện bảo hành
     */
    public function getEligibleItems(Order $order): array
    {
        $eligible = [];
        foreach ($order->items as $item) {
            if ($item->isWarrantyValid()) {
                $eligible[] = [
                    'order_item_id' => $item->id,
                    'position' => $item->position,
                    'product_name' => $item->product->name,
                    'account_type' => $item->product->account_type,
                    'warranty_expires_at' => $item->warranty_expires_at->toIso8601String(),
                    'remaining_seconds' => max(0, now()->diffInSeconds($item->warranty_expires_at, false)),
                ];
            }
        }
        return $eligible;
    }

    /**
     * Gửi yêu cầu bảo hành tài khoản (Tối giản: Không bắt buộc video/ảnh, chuyển Admin duyệt)
     */
    public function submitClaim(Order $order, array $itemsData, array $files = [], ?string $buyerNote = null): WarrantyClaim
    {
        if (count($itemsData) === 0 || count($itemsData) > self::MAX_ITEMS_PER_CLAIM) {
            throw new InvalidArgumentException('Mỗi đợt bảo hành chỉ được chọn từ 1 đến tối đa 10 tài khoản.');
        }

        return DB::transaction(function () use ($order, $itemsData, $files, $buyerNote) {
            $claimCode = 'CLM-' . strtoupper(Str::random(10));
            $attempt = WarrantyClaim::where('order_id', $order->id)->count() + 1;

            $cleanBuyerNote = $buyerNote ? htmlspecialchars(strip_tags(trim($buyerNote)), ENT_QUOTES, 'UTF-8') : null;

            $claim = WarrantyClaim::create([
                'claim_code' => $claimCode,
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'state' => 'waiting_admin', // Chuyển thẳng về trang Admin chờ duyệt
                'attempt' => $attempt,
                'buyer_note' => $cleanBuyerNote,
            ]);

            foreach ($itemsData as $index => $itemReq) {
                $orderItemId = (int) $itemReq['order_item_id'];
                $orderItem = OrderItem::where('id', $orderItemId)->where('order_id', $order->id)->first();

                if (!$orderItem || !$orderItem->isWarrantyValid()) {
                    throw new InvalidArgumentException("Tài khoản tại vị trí " . ($orderItem?->position + 1) . " đã hết hạn bảo hành hoặc đã đạt giới hạn tối đa 3 lượt đổi.");
                }

                // Kiểm tra xem acc này có yêu cầu nào đang chờ Admin duyệt không
                $hasPending = ClaimItem::where('order_item_id', $orderItem->id)
                    ->whereHas('claim', fn($q) => $q->where('state', 'waiting_admin'))
                    ->exists();

                if ($hasPending) {
                    throw new InvalidArgumentException("Tài khoản tại vị trí " . ($orderItem->position + 1) . " đang có yêu cầu bảo hành chờ duyệt. Vui lòng đợi Shop xử lý xong.");
                }

                $storedPath = 'no_file';
                $fileHash = 'no_hash_' . uniqid();
                $mime = 'none';

                $file = $files[$index] ?? null;
                if ($file instanceof UploadedFile) {
                    // Kiểm tra Magic Bytes nhị phân thực tế để ngăn chặn shell/mã độc giả mạo đuôi ảnh
                    $this->validateMagicBytes($file);

                    $ext = strtolower($file->getClientOriginalExtension());
                    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov'])) {
                        throw new InvalidArgumentException("Tập tin tải lên không thuộc định dạng được hỗ trợ.");
                    }

                    $fileHash = hash_file('sha256', $file->getRealPath());
                    $mime = $file->getMimeType() ?: 'application/octet-stream';
                    $storedPath = $file->storeAs("warranty_evidence/{$claimCode}", Str::random(24) . '.' . $ext);
                }

                $errorDesc = htmlspecialchars(strip_tags(trim($itemReq['error_description'] ?? 'Tài khoản sai mật khẩu / bị khóa')), ENT_QUOTES, 'UTF-8');

                ClaimItem::create([
                    'warranty_claim_id' => $claim->id,
                    'order_item_id' => $orderItem->id,
                    'evidence_path' => $storedPath,
                    'evidence_hash' => $fileHash,
                    'evidence_mime' => $mime,
                    'error_description' => $errorDesc,
                ]);
            }

            return $claim->load(['claimItems.orderItem.product']);
        });
    }

    /**
     * Cấp bù tài khoản theo cơ chế All-or-Nothing
     */
    public function allocateReplacements(WarrantyClaim $claim, array $pairs): bool
    {
        $allocatedStocks = [];

        foreach ($pairs as $pair) {
            $orderItem = $pair['order_item'];
            $stock = AccountStock::where('product_id', $orderItem->product_id)
                ->where('status', 'available')
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                // Thiếu kho: ROLLBACK không trừ một phần
                $claim->update(['state' => 'waiting_stock']);
                return false;
            }

            $allocatedStocks[] = [
                'claim_item' => $pair['claim_item'],
                'order_item' => $orderItem,
                'stock' => $stock,
            ];

            // Tạm thời đánh dấu để không pick trùng trong cùng vòng lặp
            $stock->status = 'reserved';
            $stock->save();
        }

        // Nếu tất cả đều đủ kho: tiến hành hoàn tất bù acc
        foreach ($allocatedStocks as $item) {
            $stock = $item['stock'];
            $claimItem = $item['claim_item'];
            $orderItem = $item['order_item'];

            $stock->update([
                'status' => 'replaced',
                'order_id' => $claim->order_id,
                'sold_at' => now(),
            ]);

            $claimItem->update([
                'replacement_stock_id' => $stock->id,
            ]);

            // Cập nhật tài khoản mới và tăng số lượt đổi
            $orderItem->update([
                'delivered_credentials' => $stock->credentials,
                'replacement_count' => $orderItem->replacement_count + 1,
            ]);
        }

        $claim->update([
            'state' => 'approved',
            'resolved_at' => now(),
        ]);

        return true;
    }

    /**
     * Xác thực Magic Bytes của các định dạng ảnh/video cho phép
     */
    protected function validateMagicBytes(UploadedFile $file): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 32);
        fclose($handle);

        $allowed = false;

        // JPEG: FF D8 FF
        if (str_starts_with($header, "\xFF\xD8\xFF")) {
            $allowed = true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        elseif (str_starts_with($header, "\x89PNG\r\n\x1a\n")) {
            $allowed = true;
        }
        // GIF: GIF87a hoặc GIF89a
        elseif (str_starts_with($header, "GIF87a") || str_starts_with($header, "GIF89a")) {
            $allowed = true;
        }
        // WebP: RIFF....WEBP
        elseif (str_starts_with($header, "RIFF") && substr($header, 8, 4) === "WEBP") {
            $allowed = true;
        }
        // MP4 / MOV: Chứa signature ftyp ở byte 4-8
        elseif (substr($header, 4, 4) === "ftyp") {
            $allowed = true;
        }
        // WebM: 1A 45 DF A3
        elseif (str_starts_with($header, "\x1A\x45\xDF\xA3")) {
            $allowed = true;
        }
        // AVI: RIFF....AVI
        elseif (str_starts_with($header, "RIFF") && substr($header, 8, 4) === "AVI ") {
            $allowed = true;
        }

        if (!$allowed) {
            throw new InvalidArgumentException("Tập tin '{$file->getClientOriginalName()}' không đúng định dạng hình ảnh/video hợp lệ.");
        }
    }
}
