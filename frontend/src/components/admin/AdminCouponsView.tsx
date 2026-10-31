'use client';

import React, { useState } from 'react';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string;
  is_active: boolean;
}

interface AdminCouponsViewProps {
  coupons: Coupon[];
  handleOpenCreateCouponModal: () => void;
  handleOpenEditCouponModal: (c: Coupon) => void;
  handleDeleteCoupon: (id: number, code: string) => void;
  handleToggleCoupon: (id: number) => void;
  onRefresh: () => void;
}

export function AdminCouponsView({
  coupons,
  handleOpenCreateCouponModal,
  handleOpenEditCouponModal,
  handleDeleteCoupon,
  handleToggleCoupon,
  onRefresh,
}: AdminCouponsViewProps) {
  const [search, setSearch] = useState('');

  const activeCoupons = coupons.filter((c) => c.is_active);
  const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);

  const filteredCoupons = coupons.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER & KPI METRICS
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TỔNG SỐ MÃ KHUYẾN MÃI
            </span>
            <span className="text-lg">🎁</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {coupons.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Bao gồm cả mã hoạt động và tạm tắt
          </div>
        </div>

        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00e5a0] font-bold">
              ĐANG KÍCH HOẠT SẴN SÀNG
            </span>
            <span className="text-lg">🟢</span>
          </div>
          <div className="text-2xl font-black text-[#00e5a0] font-mono mt-2">
            {activeCoupons.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Khách có thể áp dụng khi thanh toán
          </div>
        </div>

        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00c4ff] font-bold">
              LƯỢT ĐÃ ÁP DỤNG THÀNH CÔNG
            </span>
            <span className="text-lg">🔥</span>
          </div>
          <div className="text-2xl font-black text-[#00c4ff] font-mono mt-2">
            {totalUses}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Số lần khách hàng được giảm giá
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. ACTION TOOLBAR
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">Quản Lý Mã Giảm Giá & Voucher</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu hình % giảm giá hoặc số tiền cố định, giới hạn lượt dùng và đơn tối thiểu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="🔍 Tìm mã code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-[#050a14] border border-[#1e293b] text-white rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors w-40 sm:w-48"
          />
          <button
            type="button"
            onClick={handleOpenCreateCouponModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#050a14] font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Tạo Mã Giảm Giá Mới</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. COUPONS TABLE
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#080d19] text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-4 px-4 font-bold">MÃ CODE VOUCHER</th>
                <th className="py-4 px-4 font-bold">MỨC GIẢM GIÁ</th>
                <th className="py-4 px-4 font-bold">ĐƠN TỐI THIỂU</th>
                <th className="py-4 px-4 font-bold">LƯỢT SỬ DỤNG</th>
                <th className="py-4 px-4 font-bold">HẠN DÙNG</th>
                <th className="py-4 px-4 font-bold text-center">TRẠNG THÁI</th>
                <th className="py-4 px-4 text-right font-bold">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500 font-sans">
                    Chưa có mã giảm giá nào. Hãy nhấn "+ Tạo Mã Giảm Giá Mới" để bắt đầu!
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const used = c.used_count || 0;
                  const limit = c.usage_limit || null;
                  const percentUsed = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Code */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs shadow-sm w-fit">
                            🏷️ {c.code}
                          </span>
                          {c.description && (
                            <span className="text-[11px] text-slate-400 font-sans mt-1 max-w-[200px] truncate">
                              {c.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4">
                        {c.discount_type === 'percent' ? (
                          <div className="flex flex-col">
                            <span className="font-black text-[#00e5a0] text-sm">
                              Giảm {c.discount_value}%
                            </span>
                            {c.max_discount_amount && c.max_discount_amount > 0 && (
                              <span className="text-[10px] text-slate-400 font-sans">
                                Tối đa: {c.max_discount_amount.toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-black text-[#00c4ff] text-sm">
                            Giảm {c.discount_value.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4 text-slate-300">
                        {c.min_order_amount && c.min_order_amount > 0 ? (
                          <span>{c.min_order_amount.toLocaleString('vi-VN')} đ</span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-sans">Không giới hạn</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-white font-bold">{used}</span>
                            <span className="text-slate-500">/ {limit ? limit : '∞'}</span>
                          </div>
                          {limit && (
                            <div className="w-full h-1.5 bg-[#050a14] rounded-full overflow-hidden border border-[#1e293b]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percentUsed >= 90 ? 'bg-rose-500' : 'bg-[#00e5a0]'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiration */}
                      <td className="py-4 px-4 text-slate-400 text-xs">
                        {c.expires_at ? c.expires_at.substring(0, 10) : 'Vĩnh viễn'}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            c.is_active
                              ? 'bg-[#00e5a0]/15 text-[#00e5a0] hover:bg-[#00e5a0]/25 border border-[#00e5a0]/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {c.is_active ? '✓ Kích hoạt' : 'Tạm tắt'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCouponModal(c)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
