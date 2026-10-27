import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên Hệ Hỗ Trợ Khách Hàng 24/7 | DTFF SHOP',
  description: 'Kênh liên hệ hỗ trợ kỹ thuật, xử lý bảo hành và khiếu nại tài khoản game tại DTFF SHOP.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-300 text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
        Liên Hệ Hỗ Trợ 24/7
      </h1>
      <p>
        Nếu bạn gặp bất kỳ vấn đề nào trong quá trình mua hàng hoặc bảo hành tài khoản, vui lòng liên hệ với đội ngũ CSKH của chúng tôi qua các kênh sau:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-bold text-white text-base">Discord Server</h3>
          <p className="text-xs text-slate-400">Tham gia server Discord cộng đồng để tạo ticket hỗ trợ trực tiếp.</p>
          <span className="text-emerald-400 text-xs font-mono font-bold block pt-2">discord.gg/dtffshop</span>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-3xl mb-2">📱</div>
          <h3 className="font-bold text-white text-base">Telegram CSKH</h3>
          <p className="text-xs text-slate-400">Hỗ trợ khẩn cấp 24/7 đối với các trường hợp lỗi thanh toán.</p>
          <span className="text-cyan-400 text-xs font-mono font-bold block pt-2">@dtff_support</span>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-3xl mb-2">✉️</div>
          <h3 className="font-bold text-white text-base">Email Khiếu Nại</h3>
          <p className="text-xs text-slate-400">Gửi email khiếu nại hoặc hợp tác kinh doanh số lượng lớn.</p>
          <span className="text-amber-400 text-xs font-mono font-bold block pt-2">support@dtffshop.com</span>
        </div>
      </div>
    </div>
  );
}
