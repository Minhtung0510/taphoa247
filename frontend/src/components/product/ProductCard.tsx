'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

interface ProductCardProps {
  product: Product;
  categorySlug?: string;
  isCheckoutPreview?: boolean;
}

export function ProductCard({ product, categorySlug, isCheckoutPreview }: ProductCardProps) {
  const { user, openAuthModal } = useAuth();
  const [imageError, setImageError] = React.useState(false);
  const isOutOfStock = (product.available_stock ?? 0) <= 0;
  const hasOptions = Boolean(product.options && product.options.length > 0);
  const targetCategorySlug = (categorySlug || product.category?.slug || 'valorant').toLowerCase();
  const detailUrl = `/${targetCategorySlug}/${product.slug}`;
  const checkoutUrl = hasOptions ? detailUrl : `/checkout?product_id=${product.id}`;

  const type = (product.account_type || '').toLowerCase();
  const name = product.name.toLowerCase();

  const isCustomOrder =
    Boolean(product.account_type?.includes('custom')) ||
    Boolean(product.badges?.includes('Đặt Hàng Riêng')) ||
    name.includes('nâng cấp') ||
    name.includes('chính chủ') ||
    name.includes('bàn giao email') ||
    name.includes('slot');

  // Determine category
  const isDiscord = targetCategorySlug === 'discord' || name.includes('discord');
  const isCs2 = targetCategorySlug === 'cs2' || targetCategorySlug === 'csgo2' || name.includes('cs2') || name.includes('cs:go') || name.includes('csgo') || type.includes('cs2');
  const isCursor = targetCategorySlug === 'cursor-ai' || name.includes('cursor');
  const isAntigravity = targetCategorySlug === 'gemini-antigravity' || name.includes('antigravity');
  const isSubApi = targetCategorySlug === 'api-sub-credits' || name.includes('api sub') || name.includes('sub card');
  const isGoogleOne = targetCategorySlug === 'google-one' || name.includes('google one');
  const isMuse = targetCategorySlug === 'muse-ai' || name.includes('muse');
  const isVideoAi = targetCategorySlug === 'video-ai-tools' || name.includes('digivideo') || name.includes('engineer kit') || name.includes('marketing kit');
  const isValorant = targetCategorySlug === 'valorant' || name.includes('valorant');
  const isAi = targetCategorySlug === 'tai-khoan-ai' || isCursor || isAntigravity || isSubApi || isMuse || isVideoAi || type.includes('ai') || name.includes('gpt') || name.includes('gemini') || name.includes('cursor') || name.includes('claude') || name.includes('kling');
  const isCanva = targetCategorySlug === 'canva' || name.includes('canva');
  const isCapCut = targetCategorySlug === 'capcut' || name.includes('capcut');
  const isNetflix = targetCategorySlug === 'netflix' || name.includes('netflix');
  const isVpn = targetCategorySlug === 'vpn' || name.includes('vpn') || name.includes('hma');

  // Title
  const categoryTitle = isDiscord
    ? 'DISCORD'
    : isCs2
    ? 'CS:GO 2 PRIME'
    : isCursor
    ? 'CURSOR AI'
    : isAntigravity
    ? 'GEMINI ANTIGRAVITY'
    : isSubApi
    ? 'API SUB CREDITS'
    : isGoogleOne
    ? 'GOOGLE ONE 5TB'
    : isMuse
    ? 'MUSE AI'
    : isVideoAi
    ? 'VIDEO & AI TOOLS'
    : isValorant
    ? 'VALORANT'
    : isAi
    ? 'TÀI KHOẢN AI'
    : isCanva
    ? 'CANVA PRO'
    : isCapCut
    ? 'CAPCUT PRO'
    : isNetflix
    ? 'NETFLIX 4K'
    : isVpn
    ? 'VPN BẢN QUYỀN'
    : 'DỊCH VỤ SỐ';

  // Accent color
  const categoryAccentColor = isDiscord
    ? '#5865F2'
    : isCs2
    ? '#f59e0b'
    : isCursor
    ? '#00c4ff'
    : isAntigravity
    ? '#ec4899'
    : isSubApi
    ? '#10b981'
    : isGoogleOne
    ? '#38bdf8'
    : isMuse
    ? '#f59e0b'
    : isVideoAi
    ? '#8b5cf6'
    : isValorant
    ? '#ff4655'
    : isAi
    ? '#a855f7'
    : isCanva
    ? '#06b6d4'
    : isCapCut
    ? '#f43f5e'
    : isNetflix
    ? '#e50914'
    : isVpn
    ? '#10b981'
    : '#3ddc97';

  // Category Icon
  const categoryIcon = isDiscord
    ? '💬'
    : isCs2
    ? '🔫'
    : isCursor
    ? '💻'
    : isAntigravity
    ? '✨'
    : isSubApi
    ? '⚡'
    : isGoogleOne
    ? '☁️'
    : isMuse
    ? '🎨'
    : isVideoAi
    ? '🎬'
    : isValorant
    ? '🎯'
    : isAi
    ? '🤖'
    : isCanva
    ? '🎨'
    : isCapCut
    ? '🎬'
    : isNetflix
    ? '🍿'
    : isVpn
    ? '🛡️'
    : '⚡';

  // Rank / Badge Info
  const getRankMeta = () => {
    if (isCustomOrder) {
      return { label: 'ĐẶT RIÊNG', file: '', color: '#38bdf8', btnGrad: 'linear-gradient(135deg, #0284c7, #06b6d4)' };
    }
    if (isDiscord) {
      if (name.includes('token')) return { label: 'TOKEN BOT', file: '', color: '#5865F2', btnGrad: 'linear-gradient(135deg, #5865F2, #8b5cf6)' };
      if (name.includes('cổ')) return { label: 'ACC CỔ >3T', file: '', color: '#8b5cf6', btnGrad: 'linear-gradient(135deg, #7c3aed, #a855f7)' };
      return { label: 'CLONE VERIFY', file: '', color: '#06b6d4', btnGrad: 'linear-gradient(135deg, #0284c7, #38bdf8)' };
    }
    if (isCs2) {
      if (name.includes('clean') || name.includes('no vac')) return { label: 'NO VAC SẠCH', file: '', color: '#10b981', btnGrad: 'linear-gradient(135deg, #059669, #10b981)' };
      return { label: 'CS2 PRIME', file: '', color: '#f59e0b', btnGrad: 'linear-gradient(135deg, #d97706, #f59e0b)' };
    }
    if (isCursor) {
      if (name.includes('vip')) return { label: 'VIP POOL', file: '', color: '#00c4ff', btnGrad: 'linear-gradient(135deg, #0284c7, #00c4ff)' };
      return { label: '400 CHAT/NGÀY', file: '', color: '#38bdf8', btnGrad: 'linear-gradient(135deg, #0284c7, #38bdf8)' };
    }
    if (isAntigravity) {
      if (name.includes('ultra')) return { label: 'ULTRA', file: '', color: '#ec4899', btnGrad: 'linear-gradient(135deg, #ec4899, #f43f5e)' };
      if (name.includes('team')) return { label: 'TEAM 1 NĂM', file: '', color: '#a855f7', btnGrad: 'linear-gradient(135deg, #a855f7, #6366f1)' };
      return { label: 'PRO SLOT', file: '', color: '#c084fc', btnGrad: 'linear-gradient(135deg, #a855f7, #c084fc)' };
    }
    if (isSubApi) {
      return { label: 'SUB CREDITS', file: '', color: '#10b981', btnGrad: 'linear-gradient(135deg, #059669, #10b981)' };
    }
    if (isGoogleOne) {
      return { label: 'CHÍNH CHỦ 5TB', file: '', color: '#38bdf8', btnGrad: 'linear-gradient(135deg, #0284c7, #38bdf8)' };
    }
    if (isVideoAi) {
      return { label: 'AI TOOLKIT', file: '', color: '#8b5cf6', btnGrad: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' };
    }
    if (isMuse) {
      return { label: 'TOKEN 1B', file: '', color: '#f59e0b', btnGrad: 'linear-gradient(135deg, #d97706, #f59e0b)' };
    }
    if (isAi) {
      if (name.includes('ultra')) return { label: 'ULTRA', file: '', color: '#ec4899', btnGrad: 'linear-gradient(135deg, #ec4899, #a855f7)' };
      if (name.includes('pro') || name.includes('vip')) return { label: 'PRO VIP', file: '', color: '#a855f7', btnGrad: 'linear-gradient(135deg, #a855f7, #6366f1)' };
      return { label: 'AI TOOL', file: '', color: '#8b5cf6', btnGrad: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' };
    }
    if (isCanva) return { label: 'CHÍNH CHỦ', file: '', color: '#06b6d4', btnGrad: 'linear-gradient(135deg, #06b6d4, #3b82f6)' };
    if (isCapCut) return { label: 'PRO 4K', file: '', color: '#f43f5e', btnGrad: 'linear-gradient(135deg, #f43f5e, #fb7185)' };
    if (isNetflix) return { label: 'ULTRA HD', file: '', color: '#e50914', btnGrad: 'linear-gradient(135deg, #e50914, #b91c1c)' };
    if (isVpn) return { label: 'BẢN QUYỀN', file: '', color: '#10b981', btnGrad: 'linear-gradient(135deg, #10b981, #059669)' };

    return { label: 'CHÍNH HÃNG', file: '', color: '#3ddc97', btnGrad: 'linear-gradient(135deg, #3ddc97, #00c4ff)' };
  };

  const rank = getRankMeta();

  // Price calculations
  const originalPrice = Math.round((product.price * 1.35) / 1000) * 1000;
  const discountPercent = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <article
      className="group relative rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between border"
      style={
        {
          background: 'linear-gradient(180deg, #171b25 0%, #12151c 55%)',
          borderColor: '#232834',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          '--hover-border': `${rank.color}88`,
          '--hover-shadow': `0 18px 40px -12px ${rank.color}55`,
        } as React.CSSProperties
      }
    >
      {/* ═════ PHẦN ẢNH / HERO (CHÍNH XÁC THEO CARD.HTML) ═════ */}
      <div
        className="relative h-[170px] grid place-items-center overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 50% 120%, ${categoryAccentColor}45, transparent 60%),
            linear-gradient(135deg, #1a1f2b, #0f121a)
          `,
          filter: isOutOfStock ? 'grayscale(0.55) brightness(0.8)' : 'none',
        }}
      >
        {/* Repeating Stripes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(115deg, transparent 0 14px, rgba(255, 255, 255, 0.025) 14px 15px)',
          }}
        />

        {/* 1. Warranty Badge (Góc Trên Bên Trái) */}
        <span
          className="absolute z-10 top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md"
          style={
            isCustomOrder
              ? { color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)' }
              : { color: '#3ddc97', background: 'rgba(61, 220, 151, 0.12)', border: '1px solid rgba(61, 220, 151, 0.35)' }
          }
        >
          {(() => {
            if (isCustomOrder) return '✍️ Bàn giao email';
            const hours = product.warranty_hours;
            if (!hours || hours === 0) {
              if (isSubApi) return '⚡ Không hạn dùng';
              if (isVideoAi) return '⚡ Bàn giao Full';
              return '⚡ BH Trọn gói';
            }
            if (hours >= 8760) return '⚡ BH 1 Năm Full';
            if (hours >= 4320) return '⚡ BH 6 Tháng';
            if (hours >= 2880) return '⚡ BH 4 Tháng';
            if (hours >= 2160) return '⚡ BH 3 Tháng';
            if (hours >= 1440) return '⚡ BH 2 Tháng';
            if (hours >= 720) return '⚡ BH 30 Ngày';
            if (hours >= 168) return '⚡ BH 7 Ngày';
            if (hours >= 72) return '⚡ BH 3 Ngày';
            if (hours >= 24) return '⚡ BH 24 Giờ';
            return `⚡ BH ${hours} Giờ`;
          })()}
        </span>

        {/* 2. Rank / Badge (Góc Trên Bên Phải) */}
        <span
          className="absolute z-10 top-3 right-3 flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-extrabold tracking-wider backdrop-blur-md shadow-md"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: `1px solid ${rank.color}70`,
            color: rank.color,
          }}
        >
          <span className="text-xs">{categoryIcon}</span>
          <span>{rank.label}</span>
        </span>

        {/* 3. Tồn Kho / Trạng Thái (Góc Dưới Bên Trái) */}
        {isOutOfStock ? (
          <span
            className="absolute z-10 left-3 bottom-3 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm"
            style={{
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.15)',
              border: '1px solid rgba(255, 107, 107, 0.4)',
            }}
          >
            🔒 Tạm hết hàng
          </span>
        ) : (
          <span
            className="absolute z-10 left-3 bottom-3 px-2.5 py-1 rounded-lg text-[11px] font-extrabold backdrop-blur-md flex items-center gap-1.5 shadow-sm"
            style={{
              color: '#3ddc97',
              background: 'rgba(10, 12, 18, 0.85)',
              border: '1px solid rgba(61, 220, 151, 0.45)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#3ddc97] animate-pulse" />
            <span>
              {hasOptions
                ? `${product.options?.filter((o) => o.is_available).length} gói có sẵn`
                : targetCategorySlug === 'valorant'
                ? `Còn ${product.available_stock ?? 0} acc`
                : isCustomOrder
                ? 'Nhận đơn ngay'
                : 'Giao ngay 3s'}
            </span>
          </span>
        )}

        {/* Radial ambient glow behind central logo slot */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${categoryAccentColor}28 0%, transparent 68%)`,
          }}
        />

        {/* 4. Category Center Slot / Product Logo */}
        <div
          className="relative z-[1] w-[94px] h-[94px] rounded-[22px] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-2xl p-2.5"
          style={{
            background: `linear-gradient(145deg, #181d2a 0%, #0d1017 100%)`,
            border: `1.5px solid ${categoryAccentColor}70`,
            boxShadow: `0 10px 25px -5px ${categoryAccentColor}45, inset 0 1px 1px rgba(255,255,255,0.12)`,
          }}
        >
          {product.image_url && !imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105 rounded-xl"
            />
          ) : (
            <img
              src={isDiscord ? '/logos/discord-logo.png' : isCs2 ? '/logos/csgo2-logo.png' : '/logos/discord-logo.png'}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105 rounded-xl"
            />
          )}
        </div>
      </div>

      {/* ═════ PHẦN NỘI DUNG ═════ */}
      <div className="p-[18px] pb-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên danh mục */}
          <div
            className="text-[11px] font-extrabold tracking-[0.18em] uppercase mb-1.5 flex items-center gap-1.5"
            style={{ color: categoryAccentColor }}
          >
            <span>{categoryIcon}</span>
            <span>{categoryTitle}</span>
          </div>

          {/* Tiêu đề sản phẩm */}
          <Link href={detailUrl} className="block group/link">
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#eef1f7] leading-snug mb-2 group-hover/link:text-[#3ddc97] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Mô tả ngắn */}
          <p className="text-[13px] text-[#8a93a6] leading-relaxed mb-3.5 line-clamp-2">
            {product.short_description || `Dịch vụ tài khoản chính hãng bảo hành ${product.warranty_hours || 720} giờ.`}
          </p>

          {/* Perks (Các tính năng) */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
            {isCustomOrder ? (
              <>
                <span className="text-[10.5px] py-0.5 px-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 font-semibold">
                  ✍️ Bàn giao email
                </span>
                <span className="text-[10.5px] py-0.5 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold">
                  🌟 Nâng cấp chính chủ
                </span>
              </>
            ) : (
              <>
                <span className="text-[10.5px] py-0.5 px-2.5 rounded-lg bg-[#1b2030] border border-[#232834] text-[#c9d0e0]">
                  ⚡ Giao ngay 3s
                </span>
                <span className="text-[10.5px] py-0.5 px-2.5 rounded-lg bg-[#1b2030] border border-[#232834] text-[#c9d0e0]">
                  🔁 1 đổi 1
                </span>
                <span className="text-[10.5px] py-0.5 px-2.5 rounded-lg bg-[#1b2030] border border-[#232834] text-[#c9d0e0]">
                  🔒 Bản quyền
                </span>
              </>
            )}
            <span
              className={`text-[10.5px] py-0.5 px-2 rounded-lg font-bold flex items-center gap-1 ${
                isOutOfStock
                  ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                  : 'bg-[#3ddc97]/10 border border-[#3ddc97]/30 text-[#3ddc97]'
              }`}
            >
              <span>📦</span>
              <span>
                {isOutOfStock
                  ? 'Hết hàng'
                  : hasOptions
                  ? `${product.options?.filter((o) => o.is_available).length} gói sẵn`
                  : targetCategorySlug === 'valorant'
                  ? `Kho: ${product.available_stock ?? 0}`
                  : isCustomOrder
                  ? 'Có sẵn slot'
                  : 'Sẵn sàng giao'}
              </span>
            </span>
          </div>
        </div>

        {/* Foot: Giá và Nút Mua / Đặt hàng riêng */}
        <div className="flex items-end justify-between gap-2 pt-3 sm:pt-3.5 border-t border-dashed border-[#232834]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs text-[#8a93a6] line-through font-mono">
                {originalPrice.toLocaleString('vi-VN')}đ
              </span>
              {discountPercent > 0 && !isOutOfStock && (
                <span
                  className="text-[9.5px] sm:text-[10px] font-black text-[#0b0d12] px-1.5 py-0.5 rounded-[4px] leading-none"
                  style={{ background: rank.color }}
                >
                  -{discountPercent}%
                </span>
              )}
            </div>
            <div className="text-[18px] sm:text-[22px] font-black text-[#3ddc97] leading-tight flex items-baseline gap-0.5 mt-0.5 font-mono tracking-tight">
              {hasOptions && <span className="text-[11px] sm:text-xs font-semibold text-slate-400 mr-0.5 font-sans">Từ</span>}
              <span>{product.price.toLocaleString('vi-VN')}</span>
              <small className="text-[12px] sm:text-[13px] font-bold">đ</small>
            </div>
          </div>

          {isCheckoutPreview ? (
            <span className="font-extrabold text-xs px-3.5 py-2 rounded-xl bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30 inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Đang chọn</span>
            </span>
          ) : (
            <Link
              href={isOutOfStock ? '#' : checkoutUrl}
              onClick={(e) => {
                if (isOutOfStock) {
                  e.preventDefault();
                  return;
                }
                if (!hasOptions && !user) {
                  e.preventDefault();
                  openAuthModal();
                }
              }}
              className={`font-black text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 inline-flex items-center justify-center shrink-0 whitespace-nowrap shadow-md ${
                isOutOfStock
                  ? 'bg-[#1f2431] text-[#6b7386] cursor-not-allowed pointer-events-none'
                  : 'text-[#0b0d12] hover:scale-105 active:scale-95'
              }`}
              style={
                isOutOfStock
                  ? {}
                  : {
                      background: hasOptions
                        ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                        : isCustomOrder
                        ? 'linear-gradient(135deg, #38bdf8, #00e5a0)'
                        : rank.btnGrad,
                      boxShadow: `0 4px 14px -3px ${rank.color}66`,
                    }
              }
            >
              {isOutOfStock
                ? 'Hết hàng'
                : hasOptions
                ? 'Tùy chọn gói ➔'
                : isCustomOrder
                ? '✍️ Đặt hàng riêng'
                : '🛒 Mua ngay'}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
