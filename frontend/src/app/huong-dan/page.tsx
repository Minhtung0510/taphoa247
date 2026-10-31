import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trung Tâm Hướng Dẫn - Cẩm Nang Sử Dụng Tài Khoản CS2, Discord, Cursor AI | Tạp Hóa 247',
  description:
    'Tổng hợp hướng dẫn kích hoạt CS2 Prime bằng SteamLoader, sử dụng Discord Token/Clone, Cursor AI Pro và các tài khoản số mua tại Tạp Hóa 247.',
  keywords: ['hướng dẫn cs2 prime', 'hướng dẫn discord token', 'cursor ai pro cách dùng', 'taphoa247 hướng dẫn'],
  alternates: {
    canonical: 'https://taphoa247.io.vn/huong-dan',
  },
  openGraph: {
    title: 'Hướng Dẫn Sử Dụng Tài Khoản CS2, Discord, Cursor AI | Tạp Hóa 247',
    description: 'Tổng hợp hướng dẫn kích hoạt tài khoản CS2 Prime, Discord, Cursor AI mua tại Tạp Hóa 247.',
    url: 'https://taphoa247.io.vn/huong-dan',
    type: 'website',
    siteName: 'Tạp Hóa 247',
  },
};


export default function GuidesPage() {
  const articles = [
    {
      title: 'Hướng Dẫn Sử Dụng Tool SteamLoader Đăng Nhập CS:GO 2 (CS2) Prime NFA',
      slug: 'cs2',
      isFeatured: true,
      excerpt:
        'Tải SteamLoader.exe, nhập Key nhận trong đơn hàng, tự động bypass Guard vào game không cần mật khẩu. An toàn 100%, bảo hành 1h.',
      date: '2026-10-31',
      category: 'CS:GO 2 Prime',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: '🎮',
      readTime: '2 phút đọc',
    },
    {
      title: 'Hướng Dẫn Cài Đặt & Kích Hoạt Bản Quyền Cursor AI Pro (Gói Key VSIX)',
      slug: 'cursor-ai',
      isFeatured: true,
      excerpt:
        'Tài liệu toàn tập: Tải Extension .vsix từ Google Drive, nhập Key Authorization JG-CF, chuyển đổi tài khoản 1 click, chế độ Master/Ease và sửa 100% lỗi Webview, Permission.',
      date: '2026-10-30',
      category: 'Cursor AI',
      tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: '🤖',
      readTime: '5 phút đọc',
    },
    {
      title: 'Cách Kích Hoạt & Nâng Cấp Canva Pro Chính Chủ Qua Link Mời Email',
      slug: '#',
      isFeatured: false,
      excerpt:
        'Hướng dẫn chấp nhận lời mời tham gia nhóm Edu/Pro từ mail Canva, cách chuyển đổi thiết kế giữa các đội và bảo quản tài nguyên vĩnh viễn.',
      date: '2026-10-28',
      category: 'Canva Pro',
      tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      icon: '🎨',
      readTime: '3 phút đọc',
    },
    {
      title: 'Kích Hoạt CapCut Pro VIP 4K Trên Cả Máy Tính (PC) Và Điện Thoại',
      slug: '#',
      isFeatured: false,
      excerpt:
        'Đăng nhập tài khoản CapCut VIP bằng Email / Mã QR, đồng bộ dự án Cloud và cách xuất video không dính watermark ở độ phân giải 4K 60FPS.',
      date: '2026-10-26',
      category: 'CapCut VIP',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: '🎬',
      readTime: '3 phút đọc',
    },
    {
      title: 'Hướng Dẫn Sử Dụng Profile Riêng Tư Netflix Ultra HD 4K Không Bị Trùng Màn',
      slug: '#',
      isFeatured: false,
      excerpt:
        'Cách đặt mã PIN cho Profile cá nhân, chọn server xem mượt không giật lag và cách gia hạn tài khoản mà không làm mất danh sách phim đang xem.',
      date: '2026-10-25',
      category: 'Netflix 4K',
      tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      icon: '🍿',
      readTime: '2 phút đọc',
    },
    {
      title: 'Quy Trình Quét VietQR Tự Động Nhận Bản Quyền / TK:MK Trong 3 Giây',
      slug: '#',
      isFeatured: false,
      excerpt:
        'Mẹo thanh toán nhanh: Quét mã QR bằng App TPBank, Vietcombank, MBBank... Hệ thống AI tự bắt biến động số dư và trả kết quả tức thì không cần duyệt tay.',
      date: '2026-10-24',
      category: 'Thanh Toán',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: '⚡',
      readTime: '2 phút đọc',
    },
    {
      title: 'Chính Sách 1 Đổi 1 Tự Động: Khi Nào Được Cấp Tài Khoản Bù Tức Thì?',
      slug: '#',
      isFeatured: false,
      excerpt:
        'Tổng hợp các trường hợp được đổi mới ngay lập tức: sai mật khẩu ban đầu, tài khoản bị lỗi phiên đăng nhập hoặc mất hạn mức trong thời hạn cam kết bảo hành.',
      date: '2026-10-22',
      category: 'Bảo Hành',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: '🛡️',
      readTime: '3 phút đọc',
    },
  ];

  return (
    <div className="min-h-screen bg-[#040812]">
      {/* Header */}
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs font-bold text-[#00e5a0]">
            <span>📚</span>
            <span>Kho Tri Thức & Kích Hoạt Bản Quyền Tạp Hóa 247</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Cẩm Nang & <span className="gradient-text">Hướng Dẫn Kích Hoạt</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Tất cả những gì bạn cần biết về cách cài đặt Extension Cursor AI, sử dụng mã Key bản quyền, nâng cấp Canva/CapCut và chính sách bảo hành 1 đổi 1.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* FEATURED HERO BANNER FOR CURSOR AI GUIDE */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#0c1326] via-[#101935] to-[#070b16] border border-cyan-500/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                ⭐ BÀI VIẾT NỔI BẬT NHẤT
              </span>
              <span className="text-xs text-slate-400 font-mono">Cập nhật: 30/10/2026</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
              Hướng Dẫn Kích Hoạt & Cài Đặt <span className="gradient-text">Cursor AI Pro</span> Bằng Mã Key VSIX
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Toàn bộ quy trình tải extension từ Google Drive, mở Cursor với quyền Administrator, chuyển đổi tài khoản 1 click và sửa triệt để 14+ lỗi thường gặp.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/huong-dan/cursor-ai"
                className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2"
              >
                <span>📖 Xem Hướng Dẫn Chi Tiết Ngay</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="https://drive.google.com/drive/folders/1UJ6OH9wMvOYwhRvxDB71FW36PW-uEk8x"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5"
              >
                <span>📦 Tải Gói Extension .VSIX</span>
              </a>
            </div>
          </div>

          <div className="shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-black/60 border border-cyan-500/30 p-4 flex items-center justify-center shadow-2xl relative group">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-3xl blur-xl group-hover:bg-cyan-500/20 transition-all" />
            <img
              src="/images/products/cursor.png"
              alt="Cursor AI"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(0,196,255,0.4)]"
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>📑</span>
            <span>Tất Cả Bài Viết Hướng Dẫn</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((art, idx) => {
              const linkHref =
                art.slug === 'cursor-ai'
                  ? '/huong-dan/cursor-ai'
                  : art.slug === 'cs2'
                  ? '/huong-dan/cs2'
                  : '#';
              return (
                <Link
                  key={idx}
                  href={linkHref}
                  className={`glass-card rounded-2xl flex flex-col justify-between hover:border-slate-600 transition-all duration-300 group relative overflow-hidden p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 ${
                    art.isFeatured ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${art.tagColor}`}>
                        {art.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span>⏱️</span> {art.readTime}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl filter drop-shadow mt-0.5 shrink-0">{art.icon}</span>
                      <h2 className="text-base font-bold text-white group-hover:text-[#00e5a0] transition-colors leading-snug">
                        {art.title}
                      </h2>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-[#00e5a0]">
                    <span className="text-[11px] text-slate-500 font-mono">{art.date}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Đọc chi tiết</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-6 rounded-2xl bg-[#090f1e]/90 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white">Cần kiểm tra trạng thái hoặc bảo hành tài khoản?</h3>
            <p className="text-xs text-slate-400">Hệ thống bảo hành 1 đổi 1 tự động 24/7 luôn sẵn sàng xử lý tức thì.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/bao-hanh" className="btn-secondary text-xs !py-2.5 !px-4">
              🛡️ Trung Tâm Bảo Hành 1 Đổi 1
            </Link>
            <Link href="/lich-su-don-hang" className="btn-primary text-xs !py-2.5 !px-4">
              📦 Xem Lịch Sử Đơn Hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
