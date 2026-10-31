'use client';

import React from 'react';

interface CursorKeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activationKey?: string;
}

export function CursorKeyGuideModal({
  isOpen,
  onClose,
  activationKey,
}: CursorKeyGuideModalProps) {
  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (activationKey) {
      navigator.clipboard.writeText(activationKey);
      alert('Đã sao chép mã kích hoạt Key vào Clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0b0e14] border border-[#232834] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-lg shrink-0">
            🤖
          </div>
          <div>
            <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
              HƯỚNG DẪN KÍCH HOẠT CURSOR KEY
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Cài Đặt & Sử Dụng Cursor AI Pro
            </h2>
          </div>
        </div>

        {/* Mã kích hoạt hiện tại nếu có */}
        {activationKey && (
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
              <span>🔑 MÃ KÍCH HOẠT CỦA BẠN:</span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="text-[11px] bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                📋 Sao chép Key
              </button>
            </div>
            <div className="font-mono text-sm text-[#00e5a0] bg-black/50 p-2.5 rounded-xl border border-white/5 break-all select-all font-bold">
              {activationKey}
            </div>
          </div>
        )}

        {/* 4 Bước cài đặt */}
        <div className="space-y-4">
          {/* BƯỚC 1 */}
          <div className="p-4 rounded-2xl bg-[#121620] border border-[#1e2536] flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-sm text-white">
                Tải và cài đặt Cursor phiên bản mới nhất
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nếu máy bạn chưa có Cursor, hãy truy cập trang chủ tải bản chính thức cho Windows, macOS hoặc Linux.
              </p>
              <a
                href="https://cursor.com/download"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#00c4ff] hover:underline font-bold mt-1"
              >
                <span>📥 Tải Cursor tại cursor.com/download ➔</span>
              </a>
            </div>
          </div>

          {/* BƯỚC 2 */}
          <div className="p-4 rounded-2xl bg-[#121620] border border-[#1e2536] flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-sm text-white">
                Mở Cursor với quyền Quản Trị Viên (Admin)
              </h3>
              <ul className="text-xs text-slate-400 space-y-1 pt-1 list-disc list-inside">
                <li><b className="text-slate-200">Trên Windows:</b> Chuột phải vào biểu tượng Cursor ➔ chọn <span className="text-amber-300 font-bold">"Run as administrator"</span>.</li>
                <li><b className="text-slate-200">Trên macOS / Linux:</b> Khởi chạy với quyền <span className="text-amber-300 font-bold">sudo</span>.</li>
              </ul>
            </div>
          </div>

          {/* BƯỚC 3 */}
          <div className="p-4 rounded-2xl bg-[#121620] border border-[#1e2536] flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-sm text-white">
                Tải và cài đặt gói Extension kích hoạt (Cursor Tool Extension)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải gói extension từ Google Drive lưu trữ của shop, sau đó cài đặt vào Cursor (kéo thả file vào mục Extensions).
              </p>
              <a
                href="https://drive.google.com/drive/folders/1UJ6OH9wMvOYwhRvxDB71FW36PW-uEk8x"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#00e5a0] text-xs font-bold hover:bg-emerald-500/25 transition-all mt-1"
              >
                <span>📦 Tải Gói Extension (Google Drive) ➔</span>
              </a>
            </div>
          </div>

          {/* BƯỚC 4 */}
          <div className="p-4 rounded-2xl bg-[#121620] border border-[#1e2536] flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-sm text-white">
                Dán mã Key và bấm "Activate"
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mở tab Extension vừa cài đặt trong Cursor, dán mã Key (ví dụ <code className="text-amber-300 font-mono">JG-CF-...</code>) vào ô nhập, rồi bấm <b className="text-white">Activate</b> để bắt đầu sử dụng gói Cursor Pro VIP.
              </p>
            </div>
          </div>
        </div>

        {/* Các lưu ý quan trọng */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs">
          <h4 className="font-bold text-amber-300 uppercase flex items-center gap-1.5 text-[11px] font-mono">
            <span>⚠️</span> LƯU Ý QUAN TRỌNG KHI SỬ DỤNG:
          </h4>
          <ul className="text-slate-300 space-y-1.5 leading-relaxed list-disc list-inside">
            <li>
              <b>Giới hạn thiết bị:</b> Mỗi Key chỉ được đăng nhập trên <b>1 máy duy nhất</b> cùng thời điểm. Nếu muốn chuyển máy khác, hãy bấm <span className="text-amber-400 font-bold">Unbind</span> trên máy cũ.
            </li>
            <li>
              <b>Khi chạm giới hạn request:</b> Bấm nút màu xanh <span className="text-cyan-400 font-bold">"Switch account"</span> trong extension để chuyển pool, sau đó mở cửa sổ chat mới.
            </li>
            <li>
              <b>Nếu gặp lỗi:</b> Bấm lại nút <b>Activate</b> một lần nữa để làm mới token.
            </li>
          </ul>
        </div>

        {/* Link tài liệu chi tiết */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <a
            href="https://docs.google.com/document/d/1IDYWyBj4_cVrY95vDvmS1WFcHWVgAK2p/edit"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white underline"
          >
            📄 Xem tài liệu Google Docs chi tiết từ nhà phát triển ➔
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Đã hiểu, đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
