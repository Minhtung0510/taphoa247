import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-7xl sm:text-8xl font-black gradient-text font-mono">404</div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Trang Không Tồn Tại
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/" className="btn-primary text-sm">
            ← Về Trang Chủ
          </Link>
          <Link href="/valorant" className="btn-secondary text-sm">
            Xem Kho Acc
          </Link>
        </div>
      </div>
    </div>
  );
}
