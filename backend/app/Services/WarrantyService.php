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
     * Gửi yêu cầu bảo hành với kiểm tra bằng chứng nghiêm ngặt
     */
    public function submitClaim(Order $order, array $itemsData, array $files, ?string $buyerNote = null): WarrantyClaim
    {
        if (count($itemsData) === 0 || count($itemsData) > self::MAX_ITEMS_PER_CLAIM) {
            throw new InvalidArgumentException('Mỗi đợt bảo hành chỉ được chọn từ 1 đến tối đa 10 tài khoản.');
        }

        // Kiểm tra dung lượng tổng đợt upload
        $totalBytes = 0;
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $totalBytes += $file->getSize();
                if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
                    throw new InvalidArgumentException('Kích thước file ' . $file->getClientOriginalName() . ' vượt quá 25MB.');
                }
            }
        }
        if ($totalBytes > self::MAX_BATCH_SIZE_BYTES) {
            throw new InvalidArgumentException('Tổng dung lượng các file bằng chứng vượt quá 100MB/đợt.');
        }

        return DB::transaction(function () use ($order, $itemsData, $files, $buyerNote) {
            $claimCode = 'CLM-' . strtoupper(Str::random(10));
            $attempt = WarrantyClaim::where('order_id', $order->id)->count() + 1;

            $claim = WarrantyClaim::create([
                'claim_code' => $claimCode,
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'state' => 'pending',
                'attempt' => $attempt,
                'buyer_note' => $buyerNote,
            ]);

            $claimItemsToProcess = [];

            foreach ($itemsData as $index => $itemReq) {
                $orderItemId = (int) $itemReq['order_item_id'];
                $orderItem = OrderItem::where('id', $orderItemId)->where('order_id', $order->id)->first();

                if (!$orderItem || !$orderItem->isWarrantyValid()) {
                    throw new InvalidArgumentException("Tài khoản tại vị trí {$orderItem?->position} đã hết hạn bảo hành hoặc đã đổi trước đó.");
                }

                $file = $files[$index] ?? null;
                if (!$file instanceof UploadedFile) {
                    throw new InvalidArgumentException("Bắt buộc phải tải lên đúng 1 ảnh/video bằng chứng cho tài khoản #{$orderItem->position}.");
                }

                // 1. Kiểm tra Magic Bytes
                $this->validateMagicBytes($file);

                // 2. Chống bằng chứng trùng lặp (SHA-256)
                $fileHash = hash_file('sha256', $file->getRealPath());
                $exists = ClaimItem::where('evidence_hash', $fileHash)->exists();
                if ($exists) {
                    throw new InvalidArgumentException("Bằng chứng lỗi của file '{$file->getClientOriginalName()}' đã từng được sử dụng. Vui lòng cung cấp bằng chứng mới.");
                }

                // 3. Lưu file vào private storage disk
                $storedPath = $file->storeAs("warranty_evidence/{$claimCode}", Str::random(24) . '.' . $file->getClientOriginalExtension());

                $claimItem = ClaimItem::create([
                    'warranty_claim_id' => $claim->id,
                    'order_item_id' => $orderItem->id,
                    'evidence_path' => $storedPath,
                    'evidence_hash' => $fileHash,
                    'evidence_mime' => $file->getMimeType() ?: 'application/octet-stream',
                    'error_description' => $itemReq['error_description'] ?? 'Tài khoản sai mật khẩu / bị khóa',
                ]);

                $claimItemsToProcess[] = [
                    'claim_item' => $claimItem,
                    'order_item' => $orderItem,
                ];
            }

            // Kiểm tra các trường hợp bắt buộc Admin duyệt tay
            $hasCs2OrPubg = false;
            foreach ($claimItemsToProcess as $pair) {
                $accType = $pair['order_item']->product->account_type;
                if (in_array($accType, ['cs2_prime', 'pubg_plus'])) {
                    $hasCs2OrPubg = true;
                    break;
                }
            }

            if ($attempt >= 3 || $hasCs2OrPubg) {
                $claim->update(['state' => 'waiting_admin']);
                return $claim->load('claimItems');
            }

            // Tự động cấp bù tài khoản: ATOMIC ALLOCATION (Đủ mới cấp, thiếu thì chờ)
            $this->allocateReplacements($claim, $claimItemsToProcess);

            return $claim->load('claimItems');
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

            // Tăng số lần đổi của acc gốc lên 1 (hết lượt đổi)
            $orderItem->update([
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
