import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều Khoản Dịch Vụ | DTFF SHOP',
  description: 'Điều khoản và quy định sử dụng dịch vụ mua bán tài khoản game tại DTFF SHOP.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-300 text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
        Điều Khoản Dịch Vụ
      </h1>
      <p>
        Chào mừng bạn đến với DTFF SHOP. Khi thực hiện giao dịch mua tài khoản game trên website của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau:
      </p>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Hình Thức Thanh Toán</h2>
        <p>Mọi giao dịch thanh toán được xử lý qua hệ thống mã VietQR động của MBBank. Quý khách vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động nhận đơn.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Quyền Riêng Tư & Bảo Mật</h2>
        <p>Hệ thống không lưu trữ thông tin ngân hàng của khách hàng. Toàn bộ thông tin tài khoản game được mã hóa AES-256 an toàn trong cơ sở dữ liệu.</p>
      </section>
    </div>
  );
}
