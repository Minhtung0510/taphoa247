import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hướng Dẫn Mua & Bảo Mật Acc Game | DTFF SHOP Blog',
  description:
    'Tổng hợp các bài viết hướng dẫn đổi mật khẩu Riot, kích hoạt Steam, kinh nghiệm chọn acc Valorant Chủ Off và mẹo leo rank an toàn.',
};

export default function GuidesPage() {
  const articles = [
    {
      title: 'Cách Đổi Mật Khẩu & Bảo Mật Tài Khoản Valorant Sau Khi Mua',
      slug: 'cach-doi-mat-khau-acc-valorant',
      excerpt:
        'Hướng dẫn chi tiết từng bước đăng nhập vào trang tài khoản Riot Games, thay đổi mật khẩu và cài đặt xác thực 2 lớp để bảo vệ tài khoản an toàn tuyệt đối.',
      date: '2026-10-25',
      category: 'Valorant',
    },
    {
      title: 'Kinh Nghiệm Chọn Mua Acc Valorant Chủ Off Để Không Bị Đè Trận',
      slug: 'kinh-nghiem-chon-acc-valorant-chu-off',
      excerpt:
        'Tại sao gói Chủ Off lại được đông đảo game thủ lựa chọn? Những dấu hiệu nhận biết một tài khoản đã ngừng hoạt động lâu năm và cách khai thác tối đa hạn bảo hành 5 giờ.',
      date: '2026-10-24',
      category: 'Kinh Nghiệm',
    },
    {
      title: 'Hướng Dẫn Tra Cứu & Trải Nghiệm File HTML 3D Kho Đồ Skin',
      slug: 'huong-dan-mo-file-html-3d-kho-do',
      excerpt:
        'Cách tải và mở file HTML 3D tương tác offline để kiểm tra toàn bộ danh sách skin súng, dao, thẻ người chơi và rank của tài khoản vừa mua tại DTFF SHOP.',
      date: '2026-10-22',
      category: 'Tiện Ích',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Cẩm Nang & Hướng Dẫn Game Thủ
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Chia sẻ kiến thức bảo mật tài khoản, mẹo leo rank và hướng dẫn sử dụng các tiện ích tại DTFF SHOP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((art, idx) => (
          <article
            key={idx}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
          >
            <div className="space-y-3">
              <span className="text-xs font-mono text-emerald-400 font-bold block">
                {art.category} • {art.date}
              </span>
              <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {art.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {art.excerpt}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>Đọc tiếp</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
