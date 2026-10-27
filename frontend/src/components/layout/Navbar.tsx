'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🎮</span>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-wider text-white group-hover:text-emerald-400 transition-colors">
              DTFF<span className="text-emerald-400">SHOP</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono -mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              ONLINE 24/7
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link href="/valorant" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>🎯</span> Valorant
          </Link>
          <Link href="/cs2" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>⚡</span> CS:GO 2
          </Link>
          <Link href="/steam" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>🕹️</span> Steam
          </Link>
          <Link href="/pubg" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>🪂</span> PUBG
          </Link>
          <Link href="/bao-hanh" className="hover:text-amber-400 transition-colors flex items-center gap-1 text-amber-300/90">
            <span>🛡️</span> Bảo Hành
          </Link>
          <Link href="/huong-dan" className="hover:text-slate-100 transition-colors">
            Hướng Dẫn
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/bao-hanh"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
          >
            Tra cứu đơn
          </Link>
          <Link
            href="/valorant"
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            🛒 Mua Ngay
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
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

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/valorant"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-200 hover:text-emerald-400"
          >
            🎯 Acc Valorant
          </Link>
          <Link
            href="/cs2"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-200 hover:text-emerald-400"
          >
            ⚡ Acc CS:GO 2 Prime
          </Link>
          <Link
            href="/steam"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-200 hover:text-emerald-400"
          >
            🕹️ Acc Steam Random Game
          </Link>
          <Link
            href="/pubg"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-200 hover:text-emerald-400"
          >
            🪂 Acc PUBG Plus
          </Link>
          <Link
            href="/bao-hanh"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-amber-400"
          >
            🛡️ Trung Tâm Bảo Hành 1 Đổi 1
          </Link>
          <Link
            href="/huong-dan"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-300"
          >
            📖 Hướng dẫn đổi mật khẩu & bảo mật
          </Link>
        </div>
      )}
    </header>
  );
}
