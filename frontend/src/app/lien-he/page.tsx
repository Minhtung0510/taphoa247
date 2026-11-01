import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên Hệ Hỗ Trợ Khách Hàng 24/7',
  description: 'Kênh liên hệ hỗ trợ kỹ thuật, xử lý bảo hành và khiếu nại tài khoản game tại Tạp Hóa 247.',
  alternates: { canonical: 'https://taphoa247.io.vn/lien-he' },
  openGraph: {
    title: 'Liên Hệ Hỗ Trợ Khách Hàng 24/7 | Tạp Hóa 247',
    description: 'Kênh liên hệ hỗ trợ kỹ thuật, xử lý bảo hành và khiếu nại tài khoản game tại Tạp Hóa 247.',
    url: 'https://taphoa247.io.vn/lien-he',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Liên Hệ <span className="gradient-text">Hỗ Trợ 24/7</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-lg">
            Gặp vấn đề khi mua hàng hoặc bảo hành? Liên hệ đội ngũ CSKH qua các kênh dưới đây.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="category-card group">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold text-white text-base group-hover:text-[#00e5a0] transition-colors">Discord Server</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Tham gia server Discord cộng đồng để tạo ticket hỗ trợ trực tiếp.</p>
            <span className="gradient-text text-xs font-mono font-bold block pt-3">discord.gg/taphoa247</span>
          </div>

          <div className="category-card group">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-white text-base group-hover:text-[#00c4ff] transition-colors">Telegram CSKH</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Hỗ trợ khẩn cấp 24/7 đối với các trường hợp lỗi thanh toán.</p>
            <span className="text-[#00c4ff] text-xs font-mono font-bold block pt-3">@taphoa247_support</span>
          </div>

          <div className="category-card group">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="font-bold text-white text-base group-hover:text-[#f59e0b] transition-colors">Email Khiếu Nại</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Gửi email khiếu nại hoặc hợp tác kinh doanh số lượng lớn.</p>
            <span className="text-[#f59e0b] text-xs font-mono font-bold block pt-3">support@taphoa247.io.vn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
