import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều Khoản Dịch Vụ | Tạp Hóa 247',
  description: 'Điều khoản và quy định sử dụng dịch vụ tài khoản số & game tại Tạp Hóa 247.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Điều Khoản Dịch Vụ
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-400 text-sm leading-relaxed">
        <p>
          Chào mừng quý khách đến với <b className="text-white">TẠP HÓA 247</b>. Khi thực hiện giao dịch mua tài khoản, gói phần mềm hoặc tiện ích số trên hệ thống, quý khách đồng ý tuân thủ toàn bộ các quy định và điều khoản dưới đây:
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-gradient-to-b from-[#00e5a0] to-[#00c4ff]" />
            1. Hình Thức Thanh Toán
          </h2>
          <p>Mọi giao dịch thanh toán được xử lý qua hệ thống mã VietQR động của TPBank. Quý khách vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động nhận đơn.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-gradient-to-b from-[#00c4ff] to-[#7c3aed]" />
            2. Quyền Riêng Tư & Bảo Mật
          </h2>
          <p>Hệ thống không lưu trữ thông tin ngân hàng của khách hàng. Toàn bộ thông tin tài khoản game được mã hóa AES-256 an toàn trong cơ sở dữ liệu.</p>
        </section>
      </div>
    </div>
  );
}
