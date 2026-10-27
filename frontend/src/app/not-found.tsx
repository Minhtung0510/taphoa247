import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="text-6xl font-black text-emerald-400 font-mono">404</div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Trang Không Tồn Tại</h1>
      <p className="text-sm text-slate-400">
        Liên kết bạn vừa truy cập không tồn tại hoặc tài khoản game này đã được chuyển sang danh mục khác.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all inline-block shadow-lg shadow-emerald-500/20"
        >
          ← Quay Lại Trang Chủ
        </Link>
      </div>
    </div>
  );
}
