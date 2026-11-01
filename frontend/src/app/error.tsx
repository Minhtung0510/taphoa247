'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tự động reload trang nếu bị lệch hash phiên bản build (ChunkLoadError sau khi cập nhật mã)
    const msg = error?.message || '';
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Cannot find module');

    if (isChunkError) {
      const recoveryKey = `dtff_chunk_recovery:${window.location.pathname}`;
      if (!sessionStorage.getItem(recoveryKey)) {
        sessionStorage.setItem(recoveryKey, '1');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white flex flex-col items-center justify-center p-4">
      <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 text-center max-w-md shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
          🔄
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Đang Cập Nhật Phiên Bản Mới</h2>
        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
          Hệ thống vừa hoàn tất cập nhật mã nguồn mới. Vui lòng bấm tải lại trang để tiếp tục.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
        >
          Tải Lại Trang Ngay
        </button>
      </div>
    </div>
  );
}
