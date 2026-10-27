import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span className="text-xl font-black text-white">
                DTFF<span className="text-emerald-400">SHOP</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Hệ thống bán tài khoản game tự động 24/7 uy tín hàng đầu. Tích hợp thanh toán mã VietQR TPBank nhận hàng tức thì trong 3 giây.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono">
              <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">✓ Auto 24/7</span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">✓ Bảo Hành 1 Đổi 1</span>
            </div>
          </div>

          {/* Col 2: Danh mục game */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Danh Mục Game</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/valorant" className="hover:text-emerald-400 transition-colors">
                  Tài khoản Valorant Thường & Chủ Off
                </Link>
              </li>
              <li>
                <Link href="/cs2" className="hover:text-emerald-400 transition-colors">
                  Tài khoản CS:GO 2 Prime Ranked
                </Link>
              </li>
              <li>
                <Link href="/steam" className="hover:text-emerald-400 transition-colors">
                  Tài khoản Steam Tier 1 / 2 / 3
                </Link>
              </li>
              <li>
                <Link href="/pubg" className="hover:text-emerald-400 transition-colors">
                  Tài khoản PUBG Plus
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ trợ & Chính sách */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Hỗ Trợ & Chính Sách</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/bao-hanh" className="hover:text-emerald-400 transition-colors">
                  Trung tâm bảo hành tự động
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-bao-hanh" className="hover:text-emerald-400 transition-colors">
                  Quy định & Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link href="/dieu-khoan" className="hover:text-emerald-400 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/huong-dan" className="hover:text-emerald-400 transition-colors">
                  Hướng dẫn đổi thông tin & bảo mật acc
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-emerald-400 transition-colors">
                  Liên hệ Admin / Khiếu nại
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Cổng thanh toán */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Thanh Toán An Toàn</h4>
            <p className="text-xs text-slate-400 mb-3">
              Chấp nhận mọi ứng dụng ngân hàng tại Việt Nam và ví điện tử qua cổng VietQR động.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
              <span className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800">MBBank</span>
              <span className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800">VietQR</span>
              <span className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800">Momo</span>
              <span className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800">Napas 247</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 DTFF SHOP. Bản quyền thuộc về hệ thống bán tài khoản game DTFF.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Được phát triển với Next.js 15 + Laravel 11</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
