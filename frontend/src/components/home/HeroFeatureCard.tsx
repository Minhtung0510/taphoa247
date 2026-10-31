'use client';

import React from 'react';
import Link from 'next/link';

export function HeroFeatureCard({
  totalOrders,
}: {
  totalOrders?: number;
}) {
  const handleOpenChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-ai-chat'));
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-br from-[#00e5a0]/15 via-[#00c4ff]/10 to-[#7c3aed]/15 rounded-3xl blur-2xl pointer-events-none" />
      
      <div className="relative rounded-3xl bg-[#090e1a]/90 border border-[#1e293b] p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00e5a0] to-[#00c4ff] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#050a14] rounded-full flex items-center justify-center text-xs">
                ⚡
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Hệ Thống Giao Dịch Số 24/7</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Khớp lệnh SePay • Tự động 100%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00e5a0] bg-[#00e5a0]/10 px-2.5 py-1 rounded-full border border-[#00e5a0]/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-ping" />
            <span>Auto 3s</span>
          </div>
        </div>

        {/* 3 Step Features */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-2xl bg-[#0e1628]/80 border border-[#1b263b] flex items-start gap-3 hover:border-slate-700 transition-colors">
            <span className="text-lg mt-0.5">📱</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Quét VietQR Tự Động</span>
                <span className="text-[10px] text-[#00e5a0] font-mono">Chính xác 100%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                App ngân hàng quét mã QR động — Không cần nhập tay số tài khoản hay nội dung.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0e1628]/80 border border-[#1b263b] flex items-start gap-3 hover:border-slate-700 transition-colors">
            <span className="text-lg mt-0.5">⚡</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Xuất Tài Khoản Sau 3 Giây</span>
                <span className="text-[10px] text-cyan-400 font-mono">Tức thì</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Hệ thống tự động cấp TK:MK trên màn hình & gửi bản sao qua email của bạn.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0e1628]/80 border border-[#1b263b] flex items-start gap-3 hover:border-slate-700 transition-colors">
            <span className="text-lg mt-0.5">🛡️</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Bảo Hành Tự Động 1 Đổi 1</span>
                <span className="text-[10px] text-amber-400 font-mono">2h - 5h</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Acc lỗi sai pass/khóa được đổi bù ngay tức thì tại Trung Tâm Bảo Hành.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Chat CTA */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleOpenChat}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00e5a0]/15 via-[#00c4ff]/15 to-[#7c3aed]/15 hover:from-[#00e5a0]/25 hover:via-[#00c4ff]/25 hover:to-[#7c3aed]/25 border border-[#00e5a0]/30 hover:border-[#00e5a0]/60 text-white font-bold text-xs flex items-center justify-between gap-2 transition-all duration-300 shadow-lg shadow-[#00e5a0]/5 hover:shadow-[#00e5a0]/15 active:scale-[0.99] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#00e5a0]/40 shrink-0 group-hover:scale-110 transition-transform">
                <img src="/images/chatbot-avatar.png" alt="Em Yến Tư Vấn" className="w-full h-full object-cover" />
              </div>
              <span className="text-slate-200 group-hover:text-white font-semibold">
                Hỏi Em Yến Về Sản Phẩm & Giá
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#00e5a0] font-bold group-hover:translate-x-0.5 transition-transform">
              Mở Chat 💬
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
