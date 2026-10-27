'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL, FALLBACK_PRODUCTS } from '@/lib/api';
import { Product } from '@/lib/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductId = Number(searchParams.get('product_id')) || 1;

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<number>(initialProductId);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái đơn sau khi tạo
  const [order, setOrder] = useState<{
    order_code: string;
    memo: string;
    total_amount: number;
    qr_url: string;
    bank_code: string;
    account_no: string;
    account_name: string;
    remaining_seconds: number;
    status: string;
  } | null>(null);

  const [countdown, setCountdown] = useState<number>(1800);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Tải danh sách sản phẩm
  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setProducts(d.data);
      })
      .catch(() => {});
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Xử lý tạo đơn
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity,
          customer_name: customerName || 'Khách Hàng',
          customer_phone: customerPhone,
          customer_email: customerEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Lỗi khi tạo đơn hàng');
      }

      setOrder(json.data);
      setCountdown(json.data.remaining_seconds || 1800);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược và polling kiểm tra thanh toán
  useEffect(() => {
    if (!order) return;

    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    const poller = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${order.order_code}/status`);
        const json = await res.json();
        if (json.success && (json.data.is_paid || json.data.status === 'completed')) {
          clearInterval(poller);
          clearInterval(timer);
          router.push(`/don-hang/${order.order_code}`);
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [order, router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyNotice(null), 2000);
  };

  const handleTestPay = async () => {
    if (!order) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${order.order_code}/test-pay`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/don-hang/${order.order_code}`);
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Thanh Toán Đơn Hàng Tự Động 24/7
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Hệ thống VietQR tự động nhận diện giao dịch và bàn giao acc sau 3 giây.
        </p>
      </div>

      {copyNotice && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl text-center text-xs font-bold animate-pulse">
          ✓ {copyNotice}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {!order ? (
        /* Form Tạo Đơn Hàng */
        <form onSubmit={handleCreateOrder} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Chọn Loại Tài Khoản
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.price.toLocaleString('vi-VN')}đ ({p.available_stock ?? 0} acc)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Số Lượng
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Tổng Tiền
              </label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-lg font-black text-emerald-400 font-mono">
                {((selectedProduct?.price || 0) * quantity).toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Tên Của Bạn (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="VD: Anh Tuấn"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Số Điện Thoại / Zalo
              </label>
              <input
                type="tel"
                placeholder="Để hỗ trợ khi cần"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Email Nhận Thông Tin Đơn Hàng
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang khởi tạo mã QR...' : '⚡ Tạo Mã QR VietQR Thanh Toán'}
          </button>
        </form>
      ) : (
        /* Màn hình hiển thị QR & chờ tiền về */
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-mono">MÃ ĐƠN HÀNG</span>
              <div className="text-xl font-black text-emerald-400 font-mono">{order.order_code}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono">THỜI GIAN CÒN LẠI</span>
              <div className="text-lg font-black text-amber-400 font-mono">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Ảnh VietQR */}
            <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-inner">
              <img
                src={order.qr_url}
                alt="VietQR Chuyển Khoản"
                className="w-64 h-64 object-contain"
              />
              <span className="text-[11px] text-slate-600 mt-2 font-mono font-bold">
                Quét bằng app TPBank hoặc app ngân hàng bất kỳ
              </span>
            </div>

            {/* Thông tin chuyển khoản chi tiết */}
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">NGÂN HÀNG</span>
                  <b className="text-white text-sm">
                    {order.bank_code === 'TPB' || order.bank_code === 'TPBANK'
                      ? 'TPBank (Ngân Hàng Tiên Phong)'
                      : order.bank_code === 'MB' || order.bank_code === 'MBB'
                      ? 'MBBank (Quân Đội)'
                      : order.bank_code || 'Ngân Hàng'}
                  </b>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">SỐ TÀI KHOẢN</span>
                  <b className="text-white text-sm">{order.account_no}</b>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.account_no, 'số tài khoản')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                >
                  Sao chép
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">SỐ TIỀN THANH TOÁN</span>
                  <b className="text-emerald-400 text-base">{order.total_amount.toLocaleString('vi-VN')} đ</b>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.total_amount.toString(), 'số tiền')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                >
                  Sao chép
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/50 flex justify-between items-center">
                <div>
                  <span className="text-emerald-400 block text-[10px] font-bold">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)</span>
                  <b className="text-amber-400 text-sm">{order.memo}</b>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.memo, 'nội dung chuyển khoản')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                >
                  Sao chép
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <p className="font-bold">⚠️ LƯU Ý QUAN TRỌNG:</p>
            <p>1. Vui lòng giữ nguyên <b>NỘI DUNG CHUYỂN KHOẢN</b> để hệ thống nhận diện tự động.</p>
            <p>2. Sau khi chuyển tiền, hệ thống sẽ tự động chuyển hướng sang trang nhận tài khoản.</p>
          </div>

          <div className="flex items-center justify-center gap-3 py-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Thu Ngân đang trực tài khoản, có tiền là bàn giao liền...</span>
          </div>

          {/* Nút Test giả lập trong môi trường Dev/Test */}
          <div className="pt-2 text-center">
            <button
              onClick={handleTestPay}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all"
            >
              🛠️ [PAYMENT_TEST_MODE] Giả Lập Đã Thanh Toán MBBank
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
