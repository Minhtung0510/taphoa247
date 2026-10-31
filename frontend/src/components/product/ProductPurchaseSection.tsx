'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Product, ProductOption } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  product: Product;
  catSlug: string;
}

export function ProductPurchaseSection({ product, catSlug }: Props) {
  const { user, openAuthModal } = useAuth();

  const options = useMemo(() => product.options || [], [product.options]);

  // Default to first available option, or first option
  const initialOptionId = useMemo(() => {
    if (options.length === 0) return '';
    const firstAvailable = options.find((o) => o.is_available);
    return String(firstAvailable ? firstAvailable.id : options[0].id);
  }, [options]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(initialOptionId);

  const selectedOption: ProductOption | undefined = useMemo(() => {
    if (options.length === 0) return undefined;
    return options.find((o) => String(o.id) === selectedOptionId) || options[0];
  }, [options, selectedOptionId]);

  const currentPrice = selectedOption ? selectedOption.price : product.price;
  const isOptionOutOfStock = selectedOption ? !selectedOption.is_available : (product.available_stock ?? 0) <= 0;

  const isCustomOrder =
    Boolean(product.account_type?.includes('custom')) ||
    Boolean(product.badges?.includes('Đặt Hàng Riêng')) ||
    product.name.toLowerCase().includes('nâng cấp') ||
    product.name.toLowerCase().includes('chính chủ') ||
    product.name.toLowerCase().includes('bàn giao email');

  const checkoutUrl = `/checkout?product_id=${product.id}${selectedOption ? `&option_id=${selectedOption.id}` : ''}`;

  const warrantyDisplay = useMemo(() => {
    const pName = product.name.toLowerCase();
    const cSlug = (catSlug || product.category?.slug || '').toLowerCase();
    const hours = product.warranty_hours;

    if (cSlug === 'discord') {
      return '1 Giờ — 1 đổi 1 tức thì nếu lỗi Token/Login';
    }
    if (cSlug === 'cs2' || cSlug === 'csgo' || cSlug === 'csgo2') {
      return '1 Giờ — 1 đổi 1 tức thì nếu lỗi Key/Loader';
    }

    if (cSlug === 'api-sub-credits') {
      return 'Không giới hạn thời gian (BH mã nạp 100%)';
    }
    if (cSlug === 'video-ai-tools') {
      return 'Trọn đời (Link tải & Hỗ trợ setup)';
    }
    if (cSlug === 'muse-ai') {
      return '24 giờ — 1 đổi 1 lỗi ban đầu';
    }
    if (cSlug === 'google-one') {
      if (hours >= 8760) return '1 Năm Full — Nâng chính chủ 5TB';
      if (hours >= 4320) return '6 Tháng Full — Nâng chính chủ 5TB';
      if (hours >= 2880) return '4 Tháng Full — Nâng chính chủ 5TB';
      if (hours >= 2160) return '3 Tháng Full — Nâng chính chủ 5TB';
      return '1 Tháng Full — Nâng chính chủ 5TB';
    }
    if (cSlug === 'gemini-antigravity') {
      if (pName.includes('admin') || pName.includes('cấp')) {
        if (hours >= 1440) return '2 Tháng (Gói 18 tháng, TK:MK:2FA)';
        return '1 Tháng (Gói 12 tháng, TK:MK:2FA)';
      }
      if (hours >= 8760) return '1 Năm Full (Slot chính chủ Family)';
      if (hours >= 2880) return '4 Tháng Full (Slot chính chủ Family)';
      return '1 Tháng Full (Slot chính chủ Family)';
    }
    if (cSlug === 'cursor-ai') {
      if (hours >= 720) return '30 Ngày — Bảo hành theo hạn gói';
      if (hours >= 168) return '7 Ngày — Bảo hành theo hạn gói';
      if (hours >= 72) return '3 Ngày — Bảo hành theo hạn gói';
      if (hours >= 24) return '1 Ngày — Bảo hành theo hạn gói';
    }

    if (product.is_off_mode || pName.includes('chủ off')) {
      return '5 giờ — Bảo hiểm Chủ Off độc quyền';
    }
    return `${hours || 2} giờ — 1 đổi 1 tự động 24/7`;
  }, [product, catSlug]);

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-6 sticky top-24 border border-[#232834]">
      {/* Price Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">Giá thanh toán</span>
          {options.length > 0 && selectedOption && (
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                selectedOption.is_available
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {selectedOption.is_available ? '● Còn hàng' : '🔒 Hết hàng'}
            </span>
          )}
        </div>
        <div className="text-3xl sm:text-4xl font-black price-tag mt-1 text-[#3ddc97]">
          {currentPrice.toLocaleString('vi-VN')} VNĐ
        </div>
      </div>

      {/* Options Selector (KhoaHocGiaRe style) */}
      {options.length > 0 && (
        <div className="space-y-3 pt-2 pb-1 border-t border-slate-800/40">
          <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Chọn gói dịch vụ / thời hạn:</span>
            <span className="text-[11px] text-slate-400 font-normal">{options.length} tùy chọn</span>
          </label>

          {/* Native Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
              className="w-full appearance-none bg-[#141824] hover:bg-[#181d2c] text-white border border-[#2c3347] focus:border-[#3ddc97] rounded-xl px-4 py-3.5 pr-10 text-sm font-semibold transition-all cursor-pointer shadow-lg outline-none"
            >
              {options.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[#12151e] text-white py-2"
                >
                  {opt.name} — {opt.display_price || `${opt.price.toLocaleString('vi-VN')} đ`} {opt.is_available ? '' : '(Hết hàng 🔒)'}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Quick Click Option Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((opt) => {
              const isSelected = String(opt.id) === selectedOptionId;
              const disabled = !opt.is_available;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOptionId(String(opt.id))}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all text-left flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#3ddc97]/20 border-[#3ddc97] text-[#3ddc97] shadow-[0_0_15px_rgba(61,220,151,0.2)]'
                      : disabled
                      ? 'bg-slate-900/40 border-slate-800 text-slate-600 line-through opacity-70'
                      : 'bg-[#181c28] border-slate-700/60 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span>{opt.name}</span>
                  {disabled ? (
                    <span className="text-[10px] text-rose-400 font-normal no-underline">Hết</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {opt.price >= 1000000 ? `${(opt.price / 1000000).toFixed(1)}Tr` : `${Math.round(opt.price / 1000)}k`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-3 border-y border-slate-800/40 py-5">
        {[
          {
            label: 'Giao hàng',
            value: isCustomOrder ? 'Kích hoạt trực tiếp vào email' : 'Tự động qua VietQR TPBank',
            highlight: false,
          },
          {
            label: 'Thời gian nhận',
            value: isCustomOrder ? '5 - 15 phút sau thanh toán' : '3 giây sau thanh toán',
            highlight: true,
          },
          {
            label: 'Bảo hành',
            value: warrantyDisplay,
            highlight: true,
          },
          {
            label: 'Hình thức',
            value: isCustomOrder ? 'Chính chủ tài khoản' : 'Tài khoản bàn giao sẵn',
            highlight: false,
          },
        ].map((row, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{row.label}</span>
            <span className={`font-semibold ${row.highlight ? 'text-[#3ddc97]' : 'text-white'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link
        href={isOptionOutOfStock ? '#' : checkoutUrl}
        onClick={(e) => {
          if (isOptionOutOfStock) {
            e.preventDefault();
            return;
          }
          if (!user) {
            e.preventDefault();
            openAuthModal();
          }
        }}
        className={`w-full block py-4 text-center rounded-xl font-bold text-sm transition-all ${
          isOptionOutOfStock
            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed pointer-events-none border border-slate-700/40'
            : isCustomOrder
            ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 text-slate-950 font-black shadow-lg hover:scale-105 active:scale-95 text-base'
            : 'btn-primary !shadow-lg text-base'
        }`}
      >
        {isOptionOutOfStock
          ? '🔒 Tùy chọn này tạm hết hàng'
          : isCustomOrder
          ? '✍️ Đặt Hàng Riêng (Bàn Giao Email)'
          : '🛒 Tạo Mã QR Mua Ngay'}
      </Link>

      <p className="text-[12px] text-slate-400 text-center">
        {isCustomOrder
          ? 'Shop sẽ xử lý đơn hàng và bàn giao qua email của bạn.'
          : 'Khách có thể mua trực tiếp không cần đăng ký tài khoản.'}
      </p>
    </div>
  );
}
