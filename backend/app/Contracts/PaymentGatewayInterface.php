<?php

namespace App\Contracts;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Kiểm tra có đang ở chế độ giả lập test không
     */
    public function isTestMode(): bool;

    /**
     * Lấy mã ngân hàng đang cấu hình
     */
    public function getBankCode(): string;

    /**
     * Sinh link ảnh mã VietQR thanh toán
     */
    public function generateQrUrl(int $amount, string $memo): string;

    /**
     * Kéo danh sách lịch sử giao dịch từ ngân hàng
     */
    public function fetchHistory(): ?array;

    /**
     * Khớp giao dịch thanh toán cho đơn hàng
     */
    public function findMatchingTransaction(Order $order, ?array $history = null): ?array;
}
