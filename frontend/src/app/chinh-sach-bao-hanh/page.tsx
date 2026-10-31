import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Hành & Đổi Trả Chính Hãng | Tạp Hóa 247',
  description:
    'Chi tiết chính sách bảo hành chính thức cho Cursor AI Pro, Gemini Antigravity, Google One 5TB, SubAPI Credits, Muse AI, Tool AI và Tài Khoản Game tại Tạp Hóa 247.',
};

export default function WarrantyPolicyPage() {
  return (
    <div className="min-h-screen pb-16">
      {/* Hero Header */}
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#00e5a0] transition-colors">Trang Chủ</Link>
            <span className="text-slate-700">/</span>
            <span className="text-white font-semibold">Chính Sách Bảo Hành</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Chính Sách Bảo Hành & Cam Kết Dịch Vụ
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Áp dụng chuẩn quy định từ các đối tác cung cấp bản quyền quốc tế và chính sách bảo hành 1 đổi 1 tức thì của Tạp Hóa 247.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-slate-300 text-sm leading-relaxed">
        {/* Quick Highlights Alert */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border-[#00e5a0]/25 bg-[#00e5a0]/5 flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wide">Bảo Hành Tự Động 24/7</h4>
              <p className="text-slate-400 text-xs mt-1">Đổi mới tài khoản tức thì hoặc hỗ trợ kỹ thuật qua cổng bảo hành.</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border-sky-500/25 bg-sky-500/5 flex items-start gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wide">Chuẩn Đối Tác Bản Quyền</h4>
              <p className="text-slate-400 text-xs mt-1">Áp dụng đúng 100% thời hạn và điều khoản bảo hành từ nhà phát hành.</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border-amber-500/25 bg-amber-500/5 flex items-start gap-3">
            <span className="text-xl">🤝</span>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wide">Minh Bạch & Tận Tâm</h4>
              <p className="text-slate-400 text-xs mt-1">Quy định rõ ràng từng dòng sản phẩm trước và sau khi thanh toán.</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PHẦN 1: CHÍNH SÁCH BẢO HÀNH DỊCH VỤ AI & PHẦN MỀM BẢN QUYỀN
           ════════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded bg-gradient-to-b from-[#00c4ff] to-[#00e5a0]" />
              I. Chính Sách Dịch Vụ AI & Bản Quyền Phần Mềm
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Quy Định Bản Quyền
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Cursor AI */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/cursor-logo.jpg" alt="Cursor AI" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">1. Cursor AI Pro (Gói Ngày & VIP Request Pool)</h3>
                  <span className="text-[11px] text-sky-400 font-mono">Bảo hành theo thời hạn gói (1 - 30 ngày)</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Cam kết:</b> Key kích hoạt Extension <code className="text-sky-300">JG-CF-xxxx</code> hoạt động ổn định, đủ số lượng Request và thời gian của gói đăng ký.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                  <span><b>Quy định chống lạm dụng thiết bị:</b> Hệ thống tự động quét và <b>khóa (block)</b> nếu phát hiện sử dụng đồng thời trên nhiều thiết bị. Quý khách vui lòng đăng xuất (Logout) ở thiết bị cũ trước khi đăng nhập thiết bị mới.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5 font-bold">✕</span>
                  <span><b>Chính sách đổi trả:</b> Sản phẩm kỹ thuật số đặc thù, bàn giao key tự động, <b>không chấp nhận đổi trả hay hoàn tiền</b> sau khi thông tin bàn giao đã được cung cấp thành công.</span>
                </li>
              </ul>
            </div>

            {/* 2. Gemini Antigravity */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/antigravity-logo.jpg" alt="Gemini Antigravity" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">2. Gemini Antigravity (Slot & Tài Khoản Sẵn)</h3>
                  <span className="text-[11px] text-pink-400 font-mono">Bảo hành Full Slot / 1-2 tháng Admin</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Gói SLOT chính chủ (1 tháng, 4 tháng, 1 năm, Ultra):</b> Bảo hành <b>FULL 100% thời hạn gói</b> khi nâng vào Google Family chính chủ của khách.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Gói ADMIN cấp sẵn:</b> Bàn giao dạng <code className="text-pink-300">TK | MK | 2FA</code>. Gói 12 tháng bảo hành <b>1 tháng</b>; gói 18 tháng bảo hành <b>2 tháng</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                  <span><b>Quy định Family Group:</b> Nghiêm cấm dùng quá Credit hoặc gây ảnh hưởng nhóm gia đình. Vi phạm sẽ bị Admin xóa (kick) khỏi nhóm và <b>không được bảo hành hay hoàn tiền</b>. Sau khi kích hoạt xong, khách vui lòng xóa hồ sơ thanh toán trong Google Wallet để tránh bị tự gia hạn.</span>
                </li>
              </ul>
            </div>

            {/* 3. Google One 5TB */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/google-one-logo.png" alt="Google One" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">3. Google One 5TB (Slot Chính Chủ)</h3>
                  <span className="text-[11px] text-blue-400 font-mono">Bảo hành FULL trọn vẹn (1 - 12 tháng)</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Thời hạn bảo hành:</b> Bảo hành <b>FULL thời hạn đăng ký</b> (1 tháng, 3 tháng, 4 tháng, 6 tháng, 12 tháng). Cam kết chuẩn 5TB dung lượng lưu trữ Google Drive, Photos & Gmail.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                  <span><b>Điều kiện bảo hành:</b> Khách hàng không tự ý rời khỏi nhóm Google Family hoặc đổi vùng quốc gia tài khoản trong suốt chu kỳ sử dụng gói.</span>
                </li>
              </ul>
            </div>

            {/* 4. SubAPI Credits */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/apisub-logo.jpg" alt="API Sub Credits" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">4. API Sub Credits</h3>
                  <span className="text-[11px] text-emerald-400 font-mono">Không giới hạn thời gian (No Time Limit)</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Mã thẻ nạp ($20 - $1,000 Credits):</b> Dùng cho Claude, Codex, DeepSeek, Grok trên hệ thống cổng API Sub Credits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Cam kết nạp 100%:</b> Bảo hành mã nạp hợp lệ tại thời điểm giao. Số dư sau khi nạp vào tài khoản có giá trị sử dụng <b>không giới hạn thời gian</b> (dùng đến khi hết credit).</span>
                </li>
              </ul>
            </div>

            {/* 5. Muse AI */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/muse-logo.jpg" alt="Muse AI" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">5. Muse AI 1B Token (Tài Khoản Email)</h3>
                  <span className="text-[11px] text-amber-400 font-mono">Bảo hành 24 giờ ban đầu</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Hình thức:</b> Bàn giao tài khoản dạng email. Khách hàng nhận được 1 tỷ token tạo video/ảnh trên Muse AI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Bảo hành 24 giờ:</b> Hỗ trợ 1 đổi 1 ngay lập tức nếu tài khoản gặp lỗi sai thông tin đăng nhập hoặc lỗi cấp token trong vòng 24 giờ sau khi giao.</span>
                </li>
              </ul>
            </div>

            {/* 6. Video Automation & AI Tools */}
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0a0f1d] border border-white/10 p-1 flex items-center justify-center shrink-0">
                  <img src="/images/products/video-ai-tools-logo.jpg" alt="Video & AI Tools" className="w-full h-full object-contain rounded" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">6. DigiVideoViral, Engineer Kit & Marketing Kit</h3>
                  <span className="text-[11px] text-purple-400 font-mono">Bảo hành source link & cập nhật trọn đời</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Bàn giao trọn gói:</b> File mã nguồn ZIP, các agent chuyên biệt, tài liệu workflow và video hướng dẫn cài đặt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                  <span><b>Cam kết:</b> Bảo đảm link tải Google Drive vĩnh viễn không die, hỗ trợ kỹ thuật cài đặt ban đầu. Sản phẩm giao toàn bộ mã nguồn nên <b>không hỗ trợ hoàn tiền</b> sau khi đã gửi link tải.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PHẦN 2: CHÍNH SÁCH BẢO HÀNH TÀI KHOẢN GAME (VALORANT, CS2, STEAM...)
           ════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded bg-gradient-to-b from-[#ff4655] to-[#f59e0b]" />
              II. Chính Sách Bảo Hành Tài Khoản Game (Valorant, CS2, Steam...)
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              1 Đổi 1 Tự Động
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="text-[#00e5a0]">●</span> Thời Hạn & Điều Kiện Được Bảo Hành
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#00e5a0] mt-0.5">•</span>
                  <span><b>Gói thường:</b> Thời hạn bảo hành <b>2 giờ</b> kể từ khi đơn hàng thanh toán thành công.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c084fc] mt-0.5">•</span>
                  <span><b>Gói Chủ Off:</b> Bảo hiểm lên đến <b>5 giờ</b>, chủ cũ ngưng online thời gian dài, tỉ lệ đè cực thấp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00e5a0] mt-0.5">•</span>
                  <span>Được bảo hành khi: Tài khoản sai mật khẩu, tài khoản bị khóa/ban từ trước thời điểm mua, sai rank hoặc skin cam kết.</span>
                </li>
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-5 border-[#232834] space-y-3 bg-[#131722]/80">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="text-rose-400">✕</span> Trường Hợp Từ Chối Bảo Hành Game
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>Quá thời hạn bảo hành quy định (2 giờ hoặc 5 giờ tùy gói).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>Khách hàng sử dụng phần mềm thứ ba can thiệp (Hack/Cheat, Mod skin, tool tự động) dẫn đến acc bị cấm chơi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>Chia sẻ tài khoản cho bên thứ ba dẫn đến tranh chấp đăng nhập.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PHẦN 3: HƯỚNG DẪN GỬI YÊU CẦU BẢO HÀNH
           ════════════════════════════════════════════════════════════════ */}
        <section className="glass-card rounded-2xl p-6 sm:p-8 border-[#232834] bg-gradient-to-r from-[#151a26] to-[#0e121a] space-y-4">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>🛡️</span> Hướng Dẫn Yêu Cầu Bảo Hành Nhanh
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Nếu sản phẩm bạn nhận được gặp bất kỳ sự cố nào trong thời gian bảo hành, hãy thực hiện theo các bước sau:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[#00e5a0] font-mono font-bold text-xs">BƯỚC 1</div>
              <div className="text-white font-bold text-sm">Vào Trang Bảo Hành</div>
              <p className="text-[11px] text-slate-400">Truy cập trực tiếp mục <Link href="/bao-hanh" className="text-[#00e5a0] underline">Trung Tâm Bảo Hành</Link>.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[#00c4ff] font-mono font-bold text-xs">BƯỚC 2</div>
              <div className="text-white font-bold text-sm">Nhập Mã Đơn Hàng</div>
              <p className="text-[11px] text-slate-400">Điền mã đơn của bạn dạng <code className="text-white">ACC-XXXXXXXX</code> để hệ thống kiểm tra thời hạn.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-purple-400 font-mono font-bold text-xs">BƯỚC 3</div>
              <div className="text-white font-bold text-sm">Nhận Hỗ Trợ / Đổi Mới</div>
              <p className="text-[11px] text-slate-400">Hệ thống AI đối soát và hỗ trợ bạn trong vòng 3 - 15 phút.</p>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/bao-hanh"
              className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center gap-2"
            >
              <span>Gửi Yêu Cầu Bảo Hành Ngay</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/#products"
              className="btn-secondary text-xs !py-2.5 !px-5 inline-flex items-center gap-2"
            >
              <span>Xem Thêm Sản Phẩm Khác</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
