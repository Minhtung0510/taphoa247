'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { ProductCard } from '@/components/product/ProductCard';

// ⛔ KHÔNG cho Google index trang thanh toán (checkout)
// Ngăn chặn: lộ product_id, thin content, duplicate content
// Chú ý: 'use client' không hỗ trợ export metadata — cần thêm X-Robots-Tag qua middleware hoặc next.config



function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductId = Number(searchParams.get('product_id')) || 0;
  const initialOptionId = searchParams.get('option_id') || '';
  const { user, token, openAuthModal } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(initialProductId);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(initialOptionId);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Trạng thái mã giảm giá (Voucher / Coupon)
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    original_amount: number;
    final_amount: number;
  } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Tự động nhận diện mã voucher từ URL (?voucher=... hoặc ?coupon=...)
  useEffect(() => {
    const code = searchParams.get('voucher') || searchParams.get('coupon');
    if (code) {
      setCouponInput(code.toUpperCase());
    }
  }, [searchParams]);

  // Tự động điền thông tin nếu user đã đăng nhập
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail && !user.email.includes('.local')) setCustomerEmail(user.email);
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái đơn sau khi tạo
  const [order, setOrder] = useState<{
    order_code: string;
    access_token?: string;
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
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setProducts(d.data);
          if (initialProductId && d.data.some((p: Product) => p.id === initialProductId)) {
            setSelectedProductId(initialProductId);
          } else {
            setSelectedProductId(d.data[0].id);
          }
        }
      })
      .catch(() => { });
  }, [initialProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;
  const productOptions = selectedProduct?.options || [];
  const selectedOption = productOptions.find((o) => String(o.id) === selectedOptionId) || (productOptions.find((o) => o.is_available) || productOptions[0]);

  useEffect(() => {
    if (selectedProduct?.options && selectedProduct.options.length > 0) {
      if (!selectedProduct.options.some((o) => String(o.id) === selectedOptionId)) {
        const firstAvail = selectedProduct.options.find((o) => o.is_available) || selectedProduct.options[0];
        if (firstAvail) setSelectedOptionId(String(firstAvail.id));
      }
    }
  }, [selectedProductId, selectedProduct]);

  const isCustomOrder = selectedProduct?.requires_customer_note ?? Boolean(
    selectedProduct?.account_type?.includes('custom') ||
    selectedProduct?.badges?.includes('Đặt Hàng Riêng') ||
    selectedProduct?.name?.toLowerCase().includes('nâng cấp') ||
    selectedProduct?.name?.toLowerCase().includes('chính chủ') ||
    selectedProduct?.name?.toLowerCase().includes('bàn giao email') ||
    selectedProduct?.name?.toLowerCase().includes('slot')
  );

  // Áp dụng mã giảm giá
  const handleApplyCoupon = async (overrideCode?: string) => {
    const code = (overrideCode || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }
    setCheckingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code,
          product_id: selectedProductId,
          quantity,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAppliedCoupon(json.data);
        setCouponSuccess(`✓ Áp dụng mã ${code} thành công! -${json.data.discount_amount.toLocaleString('vi-VN')}đ`);
        setCouponInput(code);
      } else {
        setAppliedCoupon(null);
        setCouponError(json.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      }
    } catch {
      setCouponError('Không thể kết nối máy chủ để kiểm tra mã giảm giá.');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
    setCouponInput('');
  };

  // Tự động tính toán lại mức giảm giá khi thay đổi sản phẩm hoặc số lượng
  useEffect(() => {
    if (appliedCoupon?.code && selectedProductId && quantity) {
      handleApplyCoupon(appliedCoupon.code);
    }
  }, [selectedProductId, quantity]);

  // Xử lý tạo đơn
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      openAuthModal();
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity,
          customer_name: customerName || 'Khách Hàng',
          customer_phone: customerPhone,
          customer_email: customerEmail,
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
          option_id: selectedOption ? selectedOption.id : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Lỗi khi tạo đơn hàng');
      }

      setOrder(json.data);
      if (typeof window !== 'undefined' && json.data.access_token) {
        sessionStorage.setItem(`order_token_${json.data.order_code}`, json.data.access_token);
      }
      setCountdown(Math.floor(Number(json.data.remaining_seconds || 900)));
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược thời gian thanh toán
  useEffect(() => {
    if (!order || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order, countdown]);

  // Polling kiểm tra trạng thái đơn hàng mỗi 2.5s
  useEffect(() => {
    if (!order) return;
    const checkInterval = setInterval(async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`order_token_${order.order_code}`) : '';
        const activeToken = order.access_token || storedToken || '';
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (activeToken) headers['X-Order-Token'] = activeToken;
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/orders/${order.order_code}/status`, { headers });
        const json = await res.json();
        if (json.success && ['completed', 'paid', 'processing'].includes(json.data.status)) {
          clearInterval(checkInterval);
          router.push(`/don-hang/${order.order_code}`);
        }
      } catch (e) {
        // bỏ qua lỗi mạng khi polling
      }
    }, 2500);

    return () => clearInterval(checkInterval);
  }, [order, router, token]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };


  const unitPrice = selectedOption ? selectedOption.price : (selectedProduct?.price || 0);
  const subtotal = unitPrice * quantity;
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const totalAmount = Math.max(1000, subtotal - discountAmount);

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Header ─── */}
      <div className="border-b border-slate-800/50 bg-[#080e1c] py-8 sm:py-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00e5a0]/20 to-[#00c4ff]/20 flex items-center justify-center text-2xl border border-[#00e5a0]/30 shadow-lg shadow-[#00e5a0]/10">
                💳
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Thanh Toán Đơn Hàng
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Cổng thanh toán tự động VietQR TPBank — Nhận thông tin đăng nhập trong 3 giây
                </p>
              </div>
            </div>

            {/* Quick Steps */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                1. Chọn Acc
              </span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                2. Quét VietQR
              </span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                3. Nhận Acc 3s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Auth Notice Banner */}
        {user ? (
          <div className="rounded-2xl p-4 bg-[#0a1424] border border-[#00e5a0]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-xs text-[#00e5a0]">
              <div className="w-7 h-7 rounded-xl bg-[#00e5a0]/20 flex items-center justify-center font-bold">👤</div>
              <span>
                Đang mua với tư cách thành viên: <b className="text-white">{user.name}</b> ({user.email}). Đơn hàng sẽ được lưu vĩnh viễn vào tài khoản của bạn.
              </span>
            </div>
            <Link href="/lich-su-don-hang" className="text-xs text-[#00c4ff] font-bold hover:underline shrink-0">
              Xem Lịch Sử Đơn →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-xs text-amber-200">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-base">🔒</div>
              <div>
                <b className="text-white block sm:inline">Yêu Cầu Đăng Nhập: </b>
                <span>Bạn cần đăng nhập tài khoản trước khi mua hàng để hệ thống tự động lưu trữ tài khoản và kích hoạt bảo hành 1 đổi 1.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black transition-all shrink-0 shadow-md cursor-pointer"
            >
              Đăng Nhập / Đăng Ký Ngay
            </button>
          </div>
        )}

        {/* Copy Notification Toast */}
        {copyNotice && (
          <div className="p-3 bg-[#00e5a0]/20 border border-[#00e5a0]/50 text-[#00e5a0] rounded-xl text-center text-xs font-bold animate-pulse shadow-lg">
            ✓ {copyNotice}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/15 border border-red-500/40 text-red-300 rounded-2xl text-sm flex items-center gap-3 shadow-lg">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!order ? (
          /* ═══════════════════════════════════════════
             GIAO DIỆN CHỌN HÀNG 2 CỘT CHUẨN E-COMMERCE
             ═══════════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: Xem Trước Sản Phẩm Đã Chọn (Card Preview) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📦</span> Tài Khoản Đang Chọn
              </div>

              {selectedProduct ? (
                <div className="space-y-4">
                  {/* Card Sản Phẩm Thực Tế */}
                  <div className="max-w-[340px] mx-auto lg:max-w-none">
                    <ProductCard product={selectedProduct} isCheckoutPreview={true} />
                  </div>

                  {/* Chi Tiết Bảo Hành & Quyền Lợi */}
                  <div className="rounded-2xl p-4 bg-[#12151c] border border-[#232834] space-y-2.5 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                      <span className="text-[#3ddc97]">✓</span> Quyền Lợi Đơn Hàng Này:
                    </h4>
                    <ul className="space-y-1.5 text-slate-400 pl-4 list-disc">
                      <li>
                        Bảo hành <b className="text-white">{selectedProduct.warranty_hours || (selectedProduct.is_off_mode ? 5 : 2)} giờ {selectedProduct.is_off_mode ? '(Gói Chủ Off)' : ''}</b> 1 đổi 1 tự động.
                      </li>
                      <li>Tài khoản sạch 100%, có thể đổi mật khẩu và cài đặt bảo mật.</li>
                      <li>Nhận thông tin đăng nhập trực tiếp trên màn hình sau khi chuyển khoản.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#12151c] border border-[#232834] text-center text-slate-400 text-xs">
                  Chưa chọn sản phẩm
                </div>
              )}
            </div>

            {/* Cột Phải: Form Thông Tin & Thanh Toán Đẹp Mắt */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleCreateOrder}
                className="rounded-3xl p-6 sm:p-8 bg-[#12151c] border border-[#232834] shadow-2xl space-y-6"
              >
                <div className="border-b border-[#232834] pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-[#3ddc97]">⚡</span> Thông Tin Đặt Hàng & Thanh Toán
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Vui lòng chọn loại tài khoản và điền thông tin để hệ thống tạo mã VietQR
                  </p>
                </div>

                {/* 1. Chọn Sản Phẩm */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Chọn Loại Tài Khoản Cần Mua <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-[#2d3345] text-white text-sm font-semibold focus:outline-none focus:border-[#3ddc97] transition-all cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#12151c] text-white py-1">
                        {p.name} — {p.options && p.options.length > 0 ? `Từ ${p.price.toLocaleString('vi-VN')}đ (${p.options.length} gói)` : `${p.price.toLocaleString('vi-VN')}đ`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1.5. Chọn Gói Tùy Chọn / Biến Thể */}
                {productOptions.length > 0 && (
                  <div className="space-y-2 p-4 rounded-2xl bg-[#171b25] border border-[#232834]">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Chọn Gói Thời Hạn / Tùy Chọn <span className="text-red-400">*</span></span>
                      {selectedOption && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${selectedOption.is_available ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>
                          {selectedOption.is_available ? '● Còn hàng' : '🔒 Hết hàng'}
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedOption?.id || ''}
                      onChange={(e) => setSelectedOptionId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#141824] border border-[#2d3345] text-white text-sm font-semibold focus:outline-none focus:border-[#3ddc97] transition-all cursor-pointer"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} disabled={!opt.is_available} className="bg-[#12151c] text-white py-1">
                          {opt.name} — {opt.display_price || `${opt.price.toLocaleString('vi-VN')}đ`} {opt.is_available ? '' : '(Tạm hết hàng 🔒)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. Số lượng & Tổng tiền */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#171b25] border border-[#232834]">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Số Lượng (Acc)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-xl bg-[#232834] hover:bg-[#2e3444] text-white font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-20 text-center py-2.5 rounded-xl bg-[#1a1f2b] border border-[#2d3345] text-white text-base font-black font-mono focus:outline-none focus:border-[#3ddc97]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-xl bg-[#232834] hover:bg-[#2e3444] text-white font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center sm:items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tổng Thanh Toán
                    </span>
                    {appliedCoupon ? (
                      <div className="sm:text-right">
                        <div className="text-xs text-slate-500 line-through font-mono">
                          {subtotal.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-xs text-emerald-400 font-mono font-bold">
                          - {discountAmount.toLocaleString('vi-VN')} đ ({appliedCoupon.code})
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-[#3ddc97] font-mono leading-none mt-1">
                          {totalAmount.toLocaleString('vi-VN')} <span className="text-base">đ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl sm:text-3xl font-black text-[#3ddc97] font-mono leading-none">
                        {totalAmount.toLocaleString('vi-VN')} <span className="text-base">đ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Mã Giảm Giá / Voucher Ưu Đãi */}
                <div className="p-4 rounded-2xl bg-[#171b25] border border-[#232834] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏷️</span> Mã Giảm Giá / Voucher
                    </label>
                  </div>

                  {!appliedCoupon ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1f2b] border border-[#2d3345] text-white text-sm font-mono font-bold uppercase placeholder:text-slate-500 focus:outline-none focus:border-[#3ddc97] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={checkingCoupon || !couponInput.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {checkingCoupon ? 'Đang kiểm tra...' : 'Áp Dụng'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎉</span>
                        <div>
                          <div className="text-xs font-black text-emerald-400 font-mono flex items-center gap-2">
                            <span>MÃ: {appliedCoupon.code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              {appliedCoupon.discount_type === 'percent'
                                ? `-${appliedCoupon.discount_value}%`
                                : `-${appliedCoupon.discount_amount.toLocaleString('vi-VN')}đ`}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300">
                            Đã tiết kiệm: <b className="text-emerald-300">{appliedCoupon.discount_amount.toLocaleString('vi-VN')}đ</b>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        ✕ Gỡ bỏ
                      </button>
                    </div>
                  )}

                  {couponSuccess && (
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <span>✓</span> {couponSuccess}
                    </p>
                  )}
                  {couponError && (
                    <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {couponError}
                    </p>
                  )}
                </div>

                {/* 3. Thông tin người nhận */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> {isCustomOrder ? 'Thông Tin Tài Khoản Bàn Giao / Kích Hoạt' : 'Thông Tin Liên Hệ (Tùy Chọn — Để Hỗ Trợ Sau Bán)'}
                  </div>

                  {isCustomOrder && (
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-3">
                      <span className="text-xl shrink-0">✍️</span>
                      <div>
                        <div className="font-bold text-sm text-sky-200 mb-0.5">Đơn Hàng Nâng Cấp Riêng / Bàn Giao Qua Email:</div>
                        <div className="text-slate-300 leading-relaxed">
                          Sản phẩm này cần nâng cấp trực tiếp vào tài khoản của bạn hoặc gửi lời mời kích hoạt.
                          Vui lòng điền chính xác <b>Email tài khoản cần nâng cấp</b> bên dưới.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Tên Của Bạn
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Tuấn Nguyễn"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1a1f2b] border border-[#2d3345] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3ddc97] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Số Điện Thoại / Zalo
                      </label>
                      <input
                        type="tel"
                        placeholder="0987xxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1a1f2b] border border-[#2d3345] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3ddc97] transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        {isCustomOrder ? (
                          <span className="text-sky-300 font-bold flex items-center gap-1">
                            <span>✉️</span> Email Cần Nâng Cấp / Kích Hoạt <span className="text-red-400">* (Bắt buộc)</span>
                          </span>
                        ) : (
                          'Email Nhận Thông Tin Đơn Hàng'
                        )}
                      </label>
                      <input
                        type="email"
                        placeholder={isCustomOrder ? "Nhập email tài khoản cần nâng cấp..." : "email@gmail.com"}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required={isCustomOrder}
                        className={`w-full px-4 py-2.5 rounded-xl bg-[#1a1f2b] border text-white text-sm placeholder:text-slate-500 focus:outline-none transition-all ${
                          isCustomOrder ? 'border-sky-500/60 focus:border-sky-400' : 'border-[#2d3345] focus:border-[#3ddc97]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Cổng thanh toán */}
                <div className="p-4 rounded-2xl bg-[#171b25] border border-[#232834] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg font-black">
                      🏦
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>Chuyển Khoản VietQR TPBank</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          Tự Động 24/7
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Quét mã trên app TPBank, MBBank, Vietcombank... Nhận acc ngay sau 3s
                      </div>
                    </div>
                  </div>
                  <span className="text-lg">⚡</span>
                </div>

                {/* 5. Nút submit */}
                {!user ? (
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="w-full py-4 px-6 rounded-2xl font-black text-base text-slate-950 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-98 transition-all duration-200 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <span>🔒</span>
                    <span>ĐĂNG NHẬP ĐỂ MUA HÀNG ({(quantity * (selectedProduct?.price || 10000)).toLocaleString('vi-VN')}đ)</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-2xl font-black text-base text-[#0b0d12] transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCustomOrder
                        ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 hover:brightness-110 shadow-sky-500/25'
                        : 'bg-gradient-to-r from-[#00e5a0] via-[#3ddc97] to-[#00c4ff] hover:brightness-110 shadow-[#00e5a0]/25'
                    }`}
                  >
                    {loading ? (
                      'Đang khởi tạo mã VietQR...'
                    ) : (
                      <>
                        <span>
                          {isCustomOrder ? '✍️ XÁC NHẬN ĐẶT HÀNG RIÊNG' : 'TẠO MÃ VIETQR THANH TOÁN'} ({(quantity * (selectedProduct?.price || 10000)).toLocaleString('vi-VN')}đ)
                        </span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════
             GIAO DIỆN QUÉT MÃ VIETQR ĐẲNG CẤP
             ═══════════════════════════════════════════ */
          <div className="max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 bg-[#12151c] border border-[#232834] shadow-2xl space-y-6">
            {/* Header mã đơn */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-[#232834] gap-3">
              <div>
                <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">Mã Đơn Hàng</span>
                <div className="text-2xl font-black text-[#00e5a0] font-mono tracking-tight">{order.order_code}</div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-bold">Thời gian chờ:</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {Math.floor(Math.max(0, countdown) / 60)}:{(Math.floor(Math.max(0, countdown)) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code Canvas */}
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl">
                <img
                  src={order.qr_url}
                  alt="VietQR Chuyển Khoản"
                  className="w-60 h-60 object-contain"
                />
                <span className="text-xs text-slate-600 mt-3 font-semibold text-center">
                  Mở App Ngân Hàng Quét Mã Tự Động Điền Tiền & Nội Dung
                </span>
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="space-y-3">
                {[
                  {
                    label: 'Ngân hàng',
                    value: order.bank_code === 'TPB' || order.bank_code === 'TPBANK'
                      ? 'TPBank (Ngân Hàng Tiên Phong)'
                      : order.bank_code || 'TPBank',
                    copyable: false,
                  },
                  {
                    label: 'Số tài khoản',
                    value: order.account_no,
                    copyable: true,
                    copyLabel: 'số tài khoản',
                  },
                  {
                    label: 'Chủ tài khoản',
                    value: order.account_name,
                    copyable: false,
                  },
                  {
                    label: 'Số tiền thanh toán',
                    value: `${order.total_amount.toLocaleString('vi-VN')} đ`,
                    copyable: true,
                    copyLabel: 'số tiền',
                    copyValue: order.total_amount.toString(),
                    highlight: true,
                  },
                  {
                    label: 'Nội dung chuyển khoản (bắt buộc)',
                    value: order.memo,
                    copyable: true,
                    copyLabel: 'nội dung CK',
                    highlight: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl flex justify-between items-center ${item.highlight
                        ? 'bg-[#00e5a0]/10 border border-[#00e5a0]/30'
                        : 'bg-[#171b25] border border-[#232834]'
                      }`}
                  >
                    <div>
                      <span className="text-[10px] block uppercase tracking-wider text-slate-400 font-bold">
                        {item.label}
                      </span>
                      <b className={`text-sm ${item.highlight ? 'text-[#3ddc97] font-black font-mono' : 'text-white'}`}>
                        {item.value}
                      </b>
                    </div>
                    {item.copyable && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.copyValue || item.value, item.copyLabel!)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#232834] hover:bg-[#2d3345] text-white transition-all cursor-pointer shadow-sm"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Waiting status ticker */}
            <div className="p-4 rounded-2xl bg-[#091020] border border-blue-500/30 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Hệ thống AI đang lắng nghe biến động số dư VietQR...</span>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
