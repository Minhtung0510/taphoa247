import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Hành Tài Khoản Game 1 Đổi 1',
  description:
    'Chi tiết chính sách bảo hành 1 đổi 1 cho tài khoản Valorant, CS2, Steam tại DTFF SHOP. Quy định về hạn bảo hành 2h và 5h.',
};

export default function WarrantyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-300 text-sm leading-relaxed">
      <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
        Chính Sách Bảo Hành Tài Khoản Tại DTFF SHOP
      </h1>

      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold text-xs">
        ✓ Cam kết 1 đổi 1 tự động 24/7 đối với tất cả các tài khoản gặp sự cố lỗi đăng nhập trong thời hạn quy định.
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Thời Hạn Bảo Hành Quy Định</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-400">
          <li>
            <b className="text-white">Gói Thường (Standard):</b> Thời gian bảo hành là <b>2 giờ</b> tính từ thời điểm đơn hàng được thanh toán thành công và cấp thông tin đăng nhập.
          </li>
          <li>
            <b className="text-white">Gói Chủ Off (Inactivity):</b> Thời gian bảo hành kéo dài <b>5 giờ</b> (gấp 2.5 lần gói thường), dành riêng cho các tài khoản chủ cũ đã ngừng hoạt động lâu ngày.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Các Trường Hợp Được Bảo Hành</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-400">
          <li>Tài khoản nhận về bị sai mật khẩu (Wrong Password) hoặc sai tên đăng nhập.</li>
          <li>Tài khoản bị cấm chơi (Ban/Lock) từ trước thời điểm mua hàng.</li>
          <li>Tài khoản không đúng bậc rank hoặc mô tả cam kết.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Các Trường Hợp Từ Chối Bảo Hành</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-400">
          <li>Quá thời hạn bảo hành (2 giờ hoặc 5 giờ tùy gói).</li>
          <li>Khách hàng sử dụng phần mềm thứ ba can thiệp (Hack/Cheat, Tool mod skin) dẫn đến tài khoản bị khóa sau khi nhận.</li>
          <li>Khách hàng chia sẻ tài khoản cho người khác dẫn đến tranh chấp.</li>
          <li>Tài khoản bù (acc thay thế) không có thêm lượt đổi mới.</li>
        </ul>
      </section>
    </div>
  );
}
