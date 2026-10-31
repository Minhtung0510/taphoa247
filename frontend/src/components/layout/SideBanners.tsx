'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

import { useStoreSettings } from '@/lib/SettingsContext';

export function SideBanners() {
  const pathname = usePathname();
  const storeSettings = useStoreSettings();

  const [dismissedLeft, setDismissedLeft] = useState(false);
  const [dismissedRight, setDismissedRight] = useState(false);
  const [minimizedLeft, setMinimizedLeft] = useState(false);
  const [minimizedRight, setMinimizedRight] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  const giftVoucherCode = (storeSettings?.banner_gift_code || 'TAPHOA247').trim().toUpperCase();
  const giftDiscountText = storeSettings?.banner_gift_discount_text || 'Ưu đãi dành cho bạn';
  const giftCoupon = storeSettings?.banner_gift_coupon;
  const giftDiscountHeadline = giftCoupon
    ? giftCoupon.discount_type === 'percent'
      ? `🔥 GIẢM ${giftCoupon.discount_value}% ĐƠN HÀNG`
      : `🔥 GIẢM ${Number(giftCoupon.discount_value).toLocaleString('vi-VN')}Đ`
    : giftDiscountText;

  const handleGiftClick = () => {
    if (!giftOpened) {
      setGiftOpened(true);
    } else {
      navigator.clipboard.writeText(giftVoucherCode).then(() => {
        setCopiedVoucher(true);
        setTimeout(() => setCopiedVoucher(false), 2000);
      });
    }
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    });
  };

  // Chỉ hiển thị khi banner_active được bật trong Cấu hình Admin
  if (!storeSettings?.banner_active) {
    return null;
  }

  const bannerText =
    storeSettings.banner_text ||
    'Ưu đãi đặc biệt: Tặng bảo hiểm tài khoản 5 tiếng cho toàn bộ đơn hàng hôm nay!';
  const hotline = storeSettings.store_hotline || '0937809305';
  const telegram = storeSettings.store_telegram || 'https://t.me/taphoa247_support';

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* ─── BANNER BÊN TRÁI (LEFT VIP ANNOUNCEMENT HUD - SIÊU NỔI BẬT) ─ */}
      {/* ──────────────────────────────────────────────────────────── */}
      {!dismissedLeft && (
        <>
          {minimizedLeft ? (
            /* Khi thu gọn: hiển thị nút dock nhỏ gọn bên mép trái */
            <aside
              aria-label="Mở lại bảng tin thông báo"
              className="fixed left-0 top-36 z-40 hidden min-[1200px]:block animate-in fade-in slide-in-from-left duration-300"
            >
              <button
                onClick={() => setMinimizedLeft(false)}
                className="group flex items-center gap-2 pl-3.5 pr-4 py-3 bg-gradient-to-r from-[#00e5a0] via-[#00c4ff] to-[#00e5a0] text-[#050a14] rounded-r-2xl font-black text-xs shadow-[0_0_25px_rgba(0,229,160,0.6)] hover:pl-5 transition-all duration-200 cursor-pointer"
                title="Bấm để mở lại Bảng tin Thông Báo"
              >
                <span className="text-base animate-bounce">📢</span>
                <span className="font-mono tracking-wider uppercase font-black">BẢNG TIN VIP</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping ml-1" />
              </button>
            </aside>
          ) : (
            /* Giao diện đầy đủ: Holographic Cyber HUD Siêu Nổi Bật */
            <aside
              aria-label="Thông báo cửa hàng"
              className="fixed left-3 xl:left-5 top-28 xl:top-32 z-40 w-56 xl:w-64 max-w-[260px] hidden min-[1200px]:block animate-in fade-in slide-in-from-left duration-300 pointer-events-auto"
            >
              <div className="cyber-hud-left rounded-3xl relative overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-[#0f1d3a]/98 via-[#0b1428]/98 to-[#050a14]/99 border-2 p-4 space-y-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                {/* Vệt sáng quét ngang (Shimmer light sweep) */}
                <div className="cyber-shimmer-sweep" />

                {/* Góc trang trí công nghệ Cyberpunk neon */}
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#00e5a0] pointer-events-none drop-shadow-[0_0_6px_#00e5a0]" />
                <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#00e5a0] pointer-events-none drop-shadow-[0_0_6px_#00e5a0]" />
                <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#00e5a0] pointer-events-none drop-shadow-[0_0_6px_#00e5a0]" />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#00e5a0] pointer-events-none drop-shadow-[0_0_6px_#00e5a0]" />

                {/* Top Header Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(245,158,11,0.6)] shrink-0">
                      📢
                    </div>
                    <div>
                      <div className="text-xs font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 bg-clip-text text-transparent tracking-wider uppercase font-mono drop-shadow-sm">
                        BẢNG TIN SHOP
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00e5a0] font-black">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                        <span className="text-emerald-400 tracking-wide uppercase">LIVE UPDATE</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Thu gọn / Đóng */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMinimizedLeft(true)}
                      className="w-6 h-6 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
                      title="Thu gọn bảng tin vào mép màn hình"
                    >
                      —
                    </button>
                    <button
                      onClick={() => setDismissedLeft(true)}
                      className="w-6 h-6 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/15 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
                      title="Tắt thông báo này"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Khung nội dung thông báo chính (Glow Quote Card - SIÊU NỔI BẬT) */}
                <div className="relative rounded-2xl border-2 fire-glow-box bg-gradient-to-br from-amber-500/25 via-red-500/20 to-slate-950/90 p-3.5 shadow-[0_0_25px_rgba(245,158,11,0.35)] overflow-hidden">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[9px] tracking-wider uppercase shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      <span className="animate-spin text-[8px]">⚡</span> THÔNG BÁO TỪ SHOP
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300/80">HOT 🔥</span>
                  </div>
                  <p className="text-sm text-yellow-100 font-black leading-snug tracking-wide break-words drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {bannerText}
                  </p>
                </div>

                {/* ─── HỘP QUÀ MAY MẮN CHUYỂN ĐỘNG (ANIMATED 3D MYSTERY GIFT BOX) ─── */}
                <div
                  onClick={handleGiftClick}
                  className="relative rounded-2xl p-3 border-2 border-amber-400/50 hover:border-amber-300 bg-gradient-to-b from-purple-950/60 via-amber-950/40 to-slate-950/95 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] transition-all duration-300 cursor-pointer group select-none overflow-hidden text-center"
                  title={giftOpened ? 'Bấm để sao chép mã giảm giá' : 'Bấm để mở hộp quà may mắn'}
                >
                  {/* Hào quang phát sáng tỏa tròn phía sau */}
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-purple-500/25 blur-xl animate-gift-aura pointer-events-none absolute left-1/2 -translate-x-1/2 top-1" />

                  {/* Tia sáng sao lấp lánh xoay tròn */}
                  <div className="animate-sparkle-spin pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 text-amber-300 text-xs">
                    ✦ ✧ ✦ ✧
                  </div>

                  {!giftOpened ? (
                    /* Trạng thái chưa mở: Hộp quà 3D nhấp nhô chuyển động liên tục */
                    <div className="relative z-10 py-1">
                      <div className="relative inline-block">
                        <span className="text-4xl inline-block animate-gift-float filter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] group-hover:scale-125 transition-transform duration-300">
                          🎁
                        </span>
                        {/* Ngôi sao lấp lánh xung quanh hộp quà */}
                        <span className="absolute -top-1 -right-2 text-xs text-yellow-300 animate-ping">✨</span>
                        <span className="absolute bottom-0 -left-2 text-[10px] text-amber-400 animate-pulse">⭐</span>
                      </div>

                      <div className="text-xs font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-rose-300 bg-clip-text text-transparent uppercase tracking-wider mt-1 drop-shadow-sm font-mono">
                        HỘP QUÀ TÂN THỦ
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-400/50 text-[10px] text-amber-300 font-bold mt-1.5 shadow-sm group-hover:border-amber-300 group-hover:bg-amber-500/40 transition-colors">
                        <span className="animate-bounce text-xs">👆</span>
                        <span>Chạm để mở quà</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      </div>
                    </div>
                  ) : (
                    /* Trạng thái đã mở: Bung quà tặng mã giảm giá */
                    <div className="relative z-10 py-1 animate-in zoom-in-95 duration-200 text-left space-y-2">
                      {/* Header: Chúc mừng + Nút đóng X ở góc */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg animate-gift-wiggle">🎉</span>
                          <span className="text-[11px] font-black text-emerald-300 font-mono tracking-wide uppercase">
                            QUÀ TẶNG CHO BẠN!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGiftOpened(false);
                          }}
                          className="w-5 h-5 rounded-md text-slate-400 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          title="Đóng hộp quà"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Huy hiệu Mức giảm giá To & Rực Rỡ */}
                      <div className="text-center">
                        <div className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse">
                          {giftDiscountHeadline}
                        </div>
                        {/* Mô tả coupon hiển thị to rõ nếu có */}
                        {storeSettings?.banner_gift_coupon?.description && (
                          <div className="text-[11px] font-bold text-yellow-200 mt-1 leading-snug break-words">
                            {storeSettings.banner_gift_coupon.description}
                          </div>
                        )}
                      </div>

                      {/* Khung Mã Giảm Giá + Nút Sao Chép */}
                      <div className="p-2 rounded-xl bg-black/60 border border-amber-400/60 flex items-center justify-between gap-1.5 shadow-inner">
                        <div className="min-w-0 pr-1">
                          <div className="text-[9px] text-amber-300/80 font-mono uppercase tracking-wider">MÃ VOUCHER:</div>
                          <div className="font-mono font-black text-yellow-300 text-sm tracking-wider break-all">
                            {giftVoucherCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(giftVoucherCode).then(() => {
                              setCopiedVoucher(true);
                              setTimeout(() => setCopiedVoucher(false), 2000);
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-mono font-black text-[10px] uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow ${
                            copiedVoucher
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {copiedVoucher ? '✓ ĐÃ CHÉP' : 'SAO CHÉP'}
                        </button>
                      </div>

                      {/* Các điều kiện áp dụng rõ ràng từng dòng */}
                      <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5 text-[10px]">
                        {storeSettings?.banner_gift_coupon?.max_discount_amount && Number(storeSettings.banner_gift_coupon.max_discount_amount) > 0 ? (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Giảm tối đa:</span>
                            <span className="font-mono font-bold text-amber-300">
                              {Number(storeSettings.banner_gift_coupon.max_discount_amount).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ) : null}

                        {storeSettings?.banner_gift_coupon?.min_order_amount && Number(storeSettings.banner_gift_coupon.min_order_amount) > 0 ? (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Đơn tối thiểu:</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {Number(storeSettings.banner_gift_coupon.min_order_amount).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ) : null}

                        {/* Nếu không có coupon object nhưng có text tùy biến */}
                        {!storeSettings?.banner_gift_coupon && giftDiscountText && (
                          <div className="text-yellow-100 font-semibold leading-relaxed break-words">
                            {giftDiscountText}
                          </div>
                        )}
                      </div>

                      {/* Footer: Hướng dẫn & Đóng */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-slate-400">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                          Dán mã khi thanh toán
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGiftOpened(false);
                          }}
                          className="text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Thu lại
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút bấm hành động (Glowing 3D Cyber Button) */}
                <a
                  href="/#kho-acc"
                  className="group relative flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00e5a0] via-[#38bdf8] to-[#00e5a0] bg-[length:200%_auto] hover:bg-right text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,160,0.6)] hover:shadow-[0_0_35px_rgba(0,229,160,0.9)] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <span className="animate-bounce">🛒</span>
                  <span className="font-black tracking-widest">MUA ACC NGAY</span>
                  <span className="group-hover:translate-x-1.5 transition-transform font-black">→</span>
                </a>
              </div>
            </aside>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ─── BANNER BÊN PHẢI (RIGHT VIP SUPPORT & CSKH HUD - SIÊU NỔI BẬT) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {!dismissedRight && (
        <>
          {minimizedRight ? (
            /* Khi thu gọn: hiển thị nút dock nhỏ gọn bên mép phải */
            <aside
              aria-label="Mở lại trung tâm hỗ trợ"
              className="fixed right-0 top-36 z-40 hidden min-[1200px]:block animate-in fade-in slide-in-from-right duration-300"
            >
              <button
                onClick={() => setMinimizedRight(false)}
                className="group flex items-center gap-2 pr-3.5 pl-4 py-3 bg-gradient-to-r from-[#00c4ff] via-[#818cf8] to-[#a855f7] text-white rounded-l-2xl font-black text-xs shadow-[0_0_25px_rgba(0,196,255,0.6)] hover:pr-5 transition-all duration-200 cursor-pointer"
                title="Bấm để mở lại Hỗ trợ CSKH"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span className="font-mono tracking-wider uppercase font-black">HỖ TRỢ 24/7</span>
                <span className="text-base animate-bounce">🎧</span>
              </button>
            </aside>
          ) : (
            /* Giao diện đầy đủ: Holographic Cyber HUD */
            <aside
              aria-label="Hỗ trợ khách hàng 24/7"
              className="fixed right-3 xl:right-5 top-28 xl:top-32 z-40 w-56 xl:w-64 max-w-[260px] hidden min-[1200px]:block animate-in fade-in slide-in-from-right duration-300 pointer-events-auto"
            >
              <div className="cyber-hud-right rounded-3xl relative overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-[#0f1d3a]/98 via-[#0b1428]/98 to-[#050a14]/99 border-2 p-4 space-y-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                {/* Vệt sáng quét ngang (Shimmer light sweep) */}
                <div className="cyber-shimmer-sweep" />

                {/* Góc trang trí công nghệ Cyberpunk neon */}
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#00c4ff] pointer-events-none drop-shadow-[0_0_6px_#00c4ff]" />
                <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#00c4ff] pointer-events-none drop-shadow-[0_0_6px_#00c4ff]" />
                <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#00c4ff] pointer-events-none drop-shadow-[0_0_6px_#00c4ff]" />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#00c4ff] pointer-events-none drop-shadow-[0_0_6px_#00c4ff]" />

                {/* Top Header Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(6,182,212,0.6)] shrink-0">
                      🎧
                    </div>
                    <div>
                      <div className="text-xs font-black bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent tracking-wider uppercase font-mono drop-shadow-sm">
                        CSKH TRỰC TUYẾN
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00c4ff] font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span className="text-emerald-400 tracking-wide uppercase">ONLINE 24/7</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Thu gọn / Đóng */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMinimizedRight(true)}
                      className="w-6 h-6 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
                      title="Thu gọn trung tâm hỗ trợ"
                    >
                      —
                    </button>
                    <button
                      onClick={() => setDismissedRight(true)}
                      className="w-6 h-6 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/15 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
                      title="Tắt hỗ trợ này"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Các kênh liên hệ trực tiếp VIP - Đậm nét, Rực rỡ */}
                <div className="space-y-2">
                  {/* Cộng Đồng Zalo Card */}
                  <a
                    href="https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb"
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900/80 border-2 border-blue-400/60 hover:border-blue-300 hover:bg-blue-950/90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-200 cursor-pointer overflow-hidden"
                    title="Bấm để tham gia Cộng Đồng Zalo Tạp Hóa 247"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/25 border border-blue-400/50 text-blue-300 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                      💬
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono font-bold">
                        <span>Cộng Đồng Zalo</span>
                        <span className="text-[10px] text-blue-300 font-black px-1.5 py-0.2 rounded bg-blue-500/20">
                          VÀO NHÓM
                        </span>
                      </div>
                      <div className="font-sans font-black text-blue-300 text-sm tracking-wide group-hover:text-blue-100 truncate drop-shadow">
                        Nhóm Zalo Tạp Hóa 247
                      </div>
                    </div>
                  </a>

                  {/* Telegram Card */}
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-sky-950/70 to-slate-900/80 border-2 border-sky-400/60 hover:border-sky-300 hover:bg-sky-950/90 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-500/25 border border-sky-400/50 text-sky-300 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                      ✈️
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono font-bold">
                        <span>Telegram Admin</span>
                        <span className="text-[9px] text-cyan-300 font-black">24/7 ↗</span>
                      </div>
                      <div className="font-mono font-black text-cyan-300 text-xs truncate group-hover:text-cyan-100 drop-shadow">
                        @taphoa247_support
                      </div>
                    </div>
                  </a>
                </div>

                {/* Tra cứu bảo hành Button */}
                <Link
                  href="/bao-hanh"
                  className="group flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-base">🛡️</span>
                  <span className="font-black tracking-wider">TRA CỨU BẢO HÀNH</span>
                </Link>
              </div>
            </aside>
          )}
        </>
      )}
    </>
  );
}
