import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SteamLoaderGuideCard } from '@/components/guide/SteamLoaderGuideCard';

export const metadata: Metadata = {
  title: 'Hướng Dẫn Sử Dụng Tool SteamLoader & Đăng Nhập CS:GO 2 (CS2) Prime | Tạp Hóa 247',
  description:
    'Hướng dẫn chi tiết cách tải SteamLoader.exe, nhập Key bản quyền đăng nhập tự động CS2 Prime NFA không cần mật khẩu hay Steam Guard, an toàn 100%.',
  keywords: [
    'hướng dẫn cs2 prime',
    'Steamloader',
    'đăng nhập cs2 bằng tool',
    'cs2 nfa cách dùng',
    'steamloader exe hướng dẫn',
    'kích hoạt acc cs2 prime',
  ],
  alternates: {
    canonical: 'https://taphoa247.io.vn/huong-dan/cs2',
  },
  openGraph: {
    title: 'Hướng Dẫn Dùng SteamLoader Đăng Nhập CS:GO 2 (CS2) Prime | Tạp Hóa 247',
    description:
      'Hướng dẫn chi tiết tải SteamLoader.exe, nhập Key đăng nhập tự động CS2 Prime NFA. Không cần mật khẩu, không cần Steam Guard.',
    url: 'https://taphoa247.io.vn/huong-dan/cs2',
    type: 'article',
    siteName: 'Tạp Hóa 247',
  },
};


export default function Cs2GuidePage() {
  return (
    <div className="min-h-screen bg-[#040812]">
      {/* Header Banner */}
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Trang Chủ
            </Link>
            <span>/</span>
            <Link href="/huong-dan" className="hover:text-white transition-colors">
              Hướng Dẫn
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">CS:GO 2 & SteamLoader</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
            <span>🎮</span>
            <span>CẨM NANG KÍCH HOẠT & SỬ DỤNG TÀI KHOẢN CS2 PRIME</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Hướng Dẫn Đăng Nhập CS:GO 2 Bằng <span className="text-amber-400">SteamLoader CS2</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Quy trình đăng nhập 1-click tự động bằng Key bản quyền hoặc Mã đơn hàng. Không cần biết mật khẩu gốc, không cần mã Steam Guard, tự động sao lưu cấu hình tài khoản cũ an toàn tuyệt đối.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Core SteamLoader Component (Screenshot 2 exact match) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>⚡</span>
              <span>Công Cụ Hỗ Trợ & Hướng Dẫn Từng Bước</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              Hỗ trợ Windows 10 & 11 (64-bit)
            </span>
          </div>

          <SteamLoaderGuideCard />
        </section>

        {/* Detailed Explanation / FAQ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: VAC & Status */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 border-amber-500/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-white">Kiểm Tra Tình Trạng VAC Ban & Bật CS2 Prime</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mọi tài khoản CS2 tại shop đều được hệ thống lọc tự động qua API Valve trước khi xuất kho, cam kết{' '}
              <b className="text-emerald-400">100% không VAC ban, không Game ban</b>. Sau khi Loader đăng nhập, bạn có thể vào ngay chế độ Premier hoặc Competitive để tìm trận mà không gặp bất kỳ giới hạn nào.
            </p>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400">
              💡 Lưu ý: Tránh sử dụng bất kỳ phần mềm hack/cheat/skin changer bên thứ 3 nào để giữ cho tài khoản và máy tính luôn sạch sẽ.
            </div>
          </div>

          {/* Box 2: Auto Switch & Safety */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 border-blue-500/20">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
              🔄
            </div>
            <h3 className="text-lg font-bold text-white">Cách Chuyển Lại Tài Khoản Steam Chính Của Bạn</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              SteamLoader được lập trình với cơ chế bảo vệ kép:{' '}
              <b className="text-white">Toàn bộ thông tin đăng nhập tài khoản chính trên máy của bạn đều được sao lưu tự động</b>.
              Khi muốn quay trở lại nick chính:
            </p>
            <ol className="text-xs sm:text-sm text-slate-300 space-y-1.5 pl-5 list-decimal">
              <li>Mở Steam ➔ Bấm vào tên tài khoản ở góc trên bên phải.</li>
              <li>Chọn <b>&ldquo;Change Account&rdquo; (Đổi tài khoản)</b> hoặc <b>&ldquo;Sign Out&rdquo;</b>.</li>
              <li>Chọn lại tài khoản cá nhân của bạn để đăng nhập bình thường!</li>
            </ol>
          </div>
        </section>

        {/* CTA Shop */}
        <section className="rounded-3xl p-8 bg-gradient-to-r from-amber-950/40 via-[#131a2e] to-blue-950/40 border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Chưa Có Tài Khoản CS:GO 2 Prime?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Mua ngay tài khoản CS2 Prime NFA & Sạch Không VAC giá chỉ từ 29.000đ, giao tự động trong 3 giây.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cs2"
              className="btn-primary !py-3 !px-6 text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2"
            >
              <span>🛒 Xem Kho Tài Khoản CS2 Ngay</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
