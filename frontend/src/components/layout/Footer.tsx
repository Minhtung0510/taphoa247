'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStoreSettings } from '@/lib/SettingsContext';

const aiLinks = [
  { href: '/#products?cat=cursor-ai', label: 'Cursor AI Pro (Key VSIX)' },
  { href: '/#products?cat=gemini-antigravity', label: 'Gemini Advanced & Antigravity' },
  { href: '/#products?cat=api-sub-credits', label: 'API Sub (Claude, Codex, DeepSeek)' },
  { href: '/#products?cat=google-one', label: 'Google One 5TB Cloud Family' },
  { href: '/#products?cat=video-ai-tools', label: 'Muse AI & Video Automation Kit' },
];

const gameLinks = [
  { href: '/cs2', label: 'Tài khoản CS:GO 2 (CS2) Prime' },
  { href: '/discord', label: 'Tài khoản Discord & Token' },
  { href: '/valorant', label: 'Tài khoản Valorant Rank & Skin' },
  { href: '/huong-dan/cs2', label: 'Tải Tool SteamLoader CS2' },
  { href: '/huong-dan', label: 'Cẩm Nang Cài Đặt Bản Quyền' },
];

const supportLinks = [
  { href: '/bao-hanh', label: 'Trung Tâm Bảo Hành 1 Đổi 1' },
  { href: '/huong-dan', label: 'Hướng Dẫn Mua & Kích Hoạt' },
  { href: '/lich-su-don-hang', label: 'Tra Cứu Lịch Sử Đơn Hàng' },
  { href: '/chinh-sach-bao-hanh', label: 'Chính Sách Bảo Hành & Đổi Trả' },
  { href: '/dieu-khoan', label: 'Điều Khoản Dịch Vụ' },
];

export function Footer() {
  const pathname = usePathname();
  const storeSettings = useStoreSettings();

  if (pathname?.startsWith('/admin')) return null;

  const storeName = storeSettings?.store_name || 'Tạp Hóa 247';
  const storeSlogan =
    storeSettings?.store_slogan ||
    'Hệ thống bán tài khoản AI, bản quyền lập trình, Discord & CS:GO 2 Prime tự động 24/7 uy tín số 1 Việt Nam. Thanh toán VietQR TPBank nhận hàng sau 3 giây, bảo hành 1 đổi 1.';
  const hotline = storeSettings?.store_hotline || '0937809305';
  const telegram = storeSettings?.store_telegram || 'https://t.me/taphoa247';
  const facebook = storeSettings?.store_facebook || 'https://www.facebook.com/bill300213/';

  return (
    <footer className="relative bg-[#030810] border-t border-slate-800/60">
      {/* Gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00e5a0]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Intro (spans 1 col on desktop or 2 on small screens) */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-cyan-400/30 bg-[#050a14] p-0.5">
                <img src="/logo.png" alt="Tạp Hóa 247" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                {storeName}
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              {storeSlogan}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="badge badge-stock text-[9px] !py-0.5 !px-2">✓ Auto 24/7</span>
              <span className="badge badge-warranty text-[9px] !py-0.5 !px-2">✓ BH 1 Đổi 1</span>
              <span className="badge badge-new text-[9px] !py-0.5 !px-2">✓ VietQR 3s</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              🔒 SSL 256-bit Encrypted
            </div>
          </div>

          {/* Col 2: AI & Cloud Categories */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1 h-3.5 rounded bg-gradient-to-b from-cyan-400 to-blue-500" />
              Tài Khoản AI & Cloud
            </h4>
            <ul className="space-y-2.5">
              {aiLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-cyan-300 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-px bg-cyan-400 group-hover:w-2 transition-all duration-200" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Game & Social Categories */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1 h-3.5 rounded bg-gradient-to-b from-[#00e5a0] to-[#00c4ff]" />
              Game & Mạng Xã Hội
            </h4>
            <ul className="space-y-2.5">
              {gameLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-[#00e5a0] transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-px bg-[#00e5a0] group-hover:w-2 transition-all duration-200" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Support & Policy */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1 h-3.5 rounded bg-gradient-to-b from-purple-400 to-indigo-500" />
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-px bg-indigo-400 group-hover:w-2 transition-all duration-200" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Contact & Official Channels */}
          <div className="space-y-3">
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1 h-3.5 rounded bg-gradient-to-b from-amber-400 to-rose-500" />
              Kênh Liên Hệ CSKH
            </h4>

            {/* Cộng Đồng Zalo */}
            <a
              href="https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                💬
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-blue-400 uppercase font-mono font-bold">Cộng Đồng Zalo</div>
                <div className="text-xs text-white font-bold group-hover:text-blue-300 transition-colors truncate">
                  Tham gia nhóm Zalo
                </div>
              </div>
            </a>

            {/* Telegram */}
            {telegram && (
              <a
                href={telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-[#00c4ff]/50 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#00c4ff]/10 text-[#00c4ff] flex items-center justify-center text-xs font-bold shrink-0">
                  ✈️
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Kênh Telegram</div>
                  <div className="text-xs text-white font-bold group-hover:text-[#00c4ff] transition-colors truncate">
                    Nhắn tin CSKH 24/7
                  </div>
                </div>
              </a>
            )}

            {/* Fanpage Facebook */}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  📘
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Fanpage Facebook</div>
                  <div className="text-xs text-white font-bold group-hover:text-blue-400 transition-colors truncate">
                    Ghé thăm Fanpage
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {storeName}. Bản quyền thuộc về hệ thống Tạp Hóa 247.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0]" />
              Hệ Thống Phân Phối Bản Quyền Số Tự Động 24/7
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
