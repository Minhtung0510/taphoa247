'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE_URL } from '@/lib/api';

import { useStoreSettings } from '@/lib/SettingsContext';

const navLinks = [
  { href: '/discord', label: 'Discord', icon: '💬' },
  { href: '/cs2', label: 'CS:GO 2', icon: '🔫' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal, logout } = useAuth();
  const storeSettings = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);

  if (pathname?.startsWith('/admin')) return null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userDropdownOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#050a14]/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20'
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      {/* Top promotional bar (VIP Cyber Ticker) */}
      <div className="bg-gradient-to-r from-[#030712] via-[#091322] to-[#030712] border-b border-[#00e5a0]/25 overflow-hidden py-1.5 select-none relative shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes dtffRunningMarquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .dtff-marquee-track {
            display: flex !important;
            width: max-content !important;
            animation: dtffRunningMarquee 26s linear infinite !important;
            will-change: transform;
          }
          .dtff-marquee-track:hover {
            animation-play-state: paused !important;
          }
        `}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs">
          {/* Running marquee */}
          <div className="flex-1 overflow-hidden relative">
            <div className="dtff-marquee-track items-center text-xs">
              {/* Loop Block 1 */}
              <div className="flex items-center gap-4 shrink-0 pr-8">
                {storeSettings?.banner_active && storeSettings?.banner_text ? (
                  <>
                    <span className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-red-600 border border-yellow-300 text-white font-mono text-[11px] shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping shrink-0" />
                      <span className="text-yellow-200 font-black uppercase tracking-wider">📢 THÔNG BÁO:</span>
                      <span className="text-white font-black drop-shadow-md">{storeSettings.banner_text}</span>
                    </span>
                    <span className="text-[#00e5a0] font-mono text-xs font-black">◆</span>
                  </>
                ) : null}
                <span className="text-[#00e5a0] font-black tracking-wide">⚡ GIAO ACC TỰ ĐỘNG 3 GIÂY</span>
                <span className="text-cyan-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#00c4ff] font-black tracking-wide">🛡️ BẢO HÀNH 1 ĐỔI 1 TỨC THÌ</span>
                <span className="text-amber-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#f59e0b] font-black tracking-wide">💎 CHỦ OFF BẢO HIỂM 5 TIẾNG</span>
                <span className="text-purple-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#c084fc] font-black tracking-wide">✨ CSKH 24/7 TRỰC TUYẾN</span>
                <span className="text-[#00e5a0] font-mono text-xs font-black">◆</span>
              </div>

              {/* Loop Block 2 (Duplicate for 100% seamless infinite loop without jump/cut) */}
              <div className="flex items-center gap-4 shrink-0 pr-8">
                {storeSettings?.banner_active && storeSettings?.banner_text ? (
                  <>
                    <span className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-red-600 border border-yellow-300 text-white font-mono text-[11px] shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping shrink-0" />
                      <span className="text-yellow-200 font-black uppercase tracking-wider">📢 THÔNG BÁO:</span>
                      <span className="text-white font-black drop-shadow-md">{storeSettings.banner_text}</span>
                    </span>
                    <span className="text-[#00e5a0] font-mono text-xs font-black">◆</span>
                  </>
                ) : null}
                <span className="text-[#00e5a0] font-black tracking-wide">⚡ GIAO ACC TỰ ĐỘNG 3 GIÂY</span>
                <span className="text-cyan-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#00c4ff] font-black tracking-wide">🛡️ BẢO HÀNH 1 ĐỔI 1 TỨC THÌ</span>
                <span className="text-amber-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#f59e0b] font-black tracking-wide">💎 CHỦ OFF BẢO HIỂM 5 TIẾNG</span>
                <span className="text-purple-400 font-mono text-xs font-black">◆</span>
                <span className="text-[#c084fc] font-black tracking-wide">✨ CSKH 24/7 TRỰC TUYẾN</span>
                <span className="text-[#00e5a0] font-mono text-xs font-black">◆</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Links on Top Bar */}
          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px] font-mono text-slate-400">
            <a
              href="https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold text-blue-300"
              title="Tham gia Cộng Đồng Zalo Tạp Hóa 247"
            >
              <span>💬</span>
              <span>Cộng Đồng Zalo</span>
            </a>
            {storeSettings?.store_telegram && (
              <a
                href={storeSettings.store_telegram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#00c4ff] transition-colors flex items-center gap-1 font-semibold"
                title="Kênh Telegram hỗ trợ"
              >
                <span>✈️</span>
                <span>Telegram</span>
              </a>
            )}
            {storeSettings?.store_facebook && (
              <a
                href={storeSettings.store_facebook}
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold"
                title="Fanpage Facebook hỗ trợ"
              >
                <span>📘</span>
                <span>Fanpage</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all border border-cyan-400/30 bg-[#050a14] p-0.5">
              <img src="/logo.png" alt="Tạp Hóa 247" className="w-full h-full object-cover rounded-lg" />
            </div>
            <span className="text-base font-black tracking-wide text-white">
              {storeSettings?.store_name || 'Tạp Hóa 247'}
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all"
            >
              Trang chủ
            </Link>

            {/* Sản phẩm dropdown trigger */}
            <button
              onClick={() => setProductsMenuOpen(!productsMenuOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${productsMenuOpen
                  ? 'bg-[#181d28] text-white border border-[#2d3748]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              <span>Sản phẩm</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${productsMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Link
              href="/bao-hanh"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-1"
            >
              Bảo Hành
            </Link>

            <Link
              href="/huong-dan"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all flex items-center gap-1"
            >
              Hướng Dẫn
            </Link>
          </nav>

          {/* Desktop Actions (Right Side) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Search Icon */}
            <button
              onClick={() => {
                const searchEl = document.getElementById('search-input') || document.querySelector('input[type="text"]');
                if (searchEl) (searchEl as HTMLElement).focus();
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
              title="Tìm kiếm sản phẩm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* User Profile Avatar */}
            {user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#00e5a0] flex items-center justify-center text-[#050a14] font-black text-xs ring-2 ring-[#00e5a0]/30 hover:ring-[#00e5a0] transition-all cursor-pointer overflow-hidden"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#050a14] font-black text-xs">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50 animate-fade-in-up border border-slate-700/50">
                    <div className="px-4 py-3 border-b border-slate-800/60">
                      <div className="font-bold text-white text-sm truncate">{user.name}</div>
                      <div className="text-slate-400 text-xs truncate mt-0.5">{user.email}</div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/lich-su-don-hang"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-[#00e5a0] transition-colors font-medium"
                      >
                        📦 Lịch Sử Đơn Hàng
                      </Link>
                      <Link
                        href="/bao-hanh"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-amber-400 transition-colors font-medium"
                      >
                        🛡️ Trung Tâm Bảo Hành
                      </Link>
                      {(user.is_admin || user.role === 'admin') && (
                        <a
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-800/50 font-medium"
                        >
                          ⚙️ Quản Trị Shop
                        </a>
                      )}
                    </div>
                    <div className="border-t border-slate-800/60 pt-1">
                      <button
                        onClick={() => { logout(); setUserDropdownOpen(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800/50 transition-colors font-medium cursor-pointer"
                      >
                        🚪 Đăng Xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-[#00e5a0]/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shadow-inner"
                title="Đăng nhập tài khoản"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            {/* Mua Ngay CTA Button */}
            <a
              href="/#products"
              onClick={(e) => {
                const el = document.getElementById('products') || document.getElementById('kho-hang');
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState(null, '', '/#products');
                }
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-[#00e5a0]/25 hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Mua Ngay</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mega Category Bar */}
      {productsMenuOpen && (
        <div className="border-t border-[#1a2233] bg-[#0a0e1a]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition-all animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xl">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[
              {
                slug: 'cursor-ai',
                name: 'Cursor AI Pro',
                sub: 'Gói Ngày & VIP Pool',
                logo: '/images/products/cursor-logo.jpg',
                color: '#00c4ff',
              },
              {
                slug: 'gemini-antigravity',
                name: 'Gemini Antigravity',
                sub: 'Pro, Ultra, Team Slot & Admin',
                logo: '/images/products/antigravity-logo.jpg',
                color: '#ec4899',
              },
              {
                slug: 'api-sub-credits',
                name: 'API Sub Credits',
                sub: 'Claude, Codex, DeepSeek, Grok',
                logo: '/images/products/apisub-logo.jpg',
                color: '#10b981',
              },
              {
                slug: 'google-one',
                name: 'Google One 5TB',
                sub: 'Nâng chính chủ Family 5TB',
                logo: '/images/products/google-one-logo.png',
                color: '#38bdf8',
              },
              {
                slug: 'muse-ai',
                name: 'Muse AI',
                sub: '1B Token bàn giao qua email',
                logo: '/images/products/muse-logo.jpg',
                color: '#f59e0b',
              },
              {
                slug: 'video-ai-tools',
                name: 'Video & AI Tools',
                sub: 'DigiVideo, Dev & Marketing Kit',
                logo: '/images/products/video-ai-tools-logo.jpg',
                color: '#8b5cf6',
              },
              {
                slug: 'valorant',
                name: 'Tài Khoản Valorant',
                sub: 'Acc Rank, Skin & Chủ Off',
                logo: '/images/products/valorant.png',
                color: '#ff4655',
              },
              {
                slug: 'discord',
                name: 'Discord',
                sub: 'Token Thô, Clone Phone, Cổ >3T',
                logo: '/logos/discord-logo.png',
                color: '#5865F2',
              },
              {
                slug: 'cs2',
                name: 'CS:GO 2 (CS2)',
                sub: 'Prime NFA, Sạch Không VAC',
                logo: '/logos/csgo2-logo.png',
                color: '#f59e0b',
              },
            ].map((cat) => (
              <a
                key={cat.slug}
                href={`/#products?cat=${cat.slug}`}
                onClick={(e) => {
                  const el = document.getElementById('products') || document.getElementById('kho-hang');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', `/#products?cat=${cat.slug}`);
                    window.dispatchEvent(new Event('popstate'));
                  }
                  setProductsMenuOpen(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#111624] hover:bg-[#161d30] border border-[#1d263b] hover:border-slate-500/50 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                  <img src={cat.logo} alt={cat.name} className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors truncate">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {cat.sub}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1020]/98 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-3 pb-6 space-y-1 animate-fade-in-up">
          <Link
            href="/bao-hanh"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-all"
          >
            🛡️ Bảo Hành 1 Đổi 1
          </Link>
          <Link
            href="/huong-dan"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800/40 transition-all"
          >
            📖 Hướng dẫn
          </Link>

          <div className="border-t border-slate-800/50 pt-4 mt-2 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-[#00e5a0]/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00e5a0] to-[#00c4ff] flex items-center justify-center text-[#050a14] font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/lich-su-don-hang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold text-[#00e5a0]"
                >
                  📦 Lịch Sử Đơn Hàng
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-left flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-semibold text-red-400"
                >
                  🚪 Đăng Xuất
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                className="w-full py-3 bg-gradient-to-r from-[#5865F2] to-[#7c3aed] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/20"
              >
                🔑 Đăng Nhập / Discord
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
