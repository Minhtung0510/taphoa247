'use client';

import React from 'react';

interface AdminDashboardViewProps {
  dashboardData: any;
  onNavigateTab: (tab: string) => void;
  recentOrders?: any[];
}

export function AdminDashboardView({
  dashboardData,
  onNavigateTab,
  recentOrders = [],
}: AdminDashboardViewProps) {
  if (!dashboardData) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ══════════════════════════════════════════════════════════
          HERO STATUS BANNER
         ══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1324] via-[#0f172a] to-[#0c1324] border border-[#1e293b] p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] via-[#00c4ff] to-[#7c3aed] opacity-80" />
        <div className="absolute -top-24 right-10 w-96 h-32 bg-[#00e5a0]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/25 text-[#00e5a0] text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-ping" />
              SYSTEM HEALTH 99.9% • SEPAY 3S ACTIVE
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tổng Quan Tình Trạng Kinh Doanh
            </h2>
            <p className="text-xs text-slate-400">
              Cập nhật tức thời biến động số dư, lượng tài khoản xuất kho và khiếu nại bảo hành
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('revenue')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black text-xs transition-all shadow-lg shadow-[#00e5a0]/20 hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>💰</span>
              <span>Xem Báo Cáo Doanh Thu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4 STAT CARDS (TASTE-DESIGN FINTECH)
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat 1: Doanh thu thực */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-[#00e5a0]/50 p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#00e5a0]/10 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] to-transparent opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              DOANH THU THỰC
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/25 text-[#00e5a0] flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              💰
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#00e5a0] font-mono tracking-tight">
              {dashboardData.total_revenue?.toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-slate-400 ml-1">đ</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0]" />
              <span>Khớp lệnh VietQR TPBank</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Đơn đã giao */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-[#00c4ff]/50 p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#00c4ff]/10 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00c4ff] to-transparent opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              ĐƠN HOÀN TẤT
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#00c4ff]/10 border border-[#00c4ff]/25 text-[#00c4ff] flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              📦
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {dashboardData.completed_orders}
              <span className="text-slate-500 text-sm font-medium ml-1">/ {dashboardData.total_orders}</span>
            </div>
            <div className="text-[11px] text-cyan-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Giao tức thì sau 3 giây</span>
            </div>
          </div>
        </div>

        {/* Stat 3: Tồn kho khả dụng */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-indigo-400/50 p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-400/10 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-transparent opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TỒN KHO KHẢ DỤNG
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              🔑
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono tracking-tight">
              {dashboardData.total_stock}
              <span className="text-slate-500 text-sm font-medium ml-1">acc</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Sẵn sàng bán tự động</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Khiếu nại bảo hành */}
        <div
          onClick={() => onNavigateTab('warranty')}
          className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-amber-400/50 p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-400/10 cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-transparent opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              BẢO HÀNH CHỜ XỬ LÝ
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              🛡️
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
              {dashboardData.pending_claims}
              <span className="text-slate-500 text-sm font-medium ml-1">khiếu nại</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-2 flex items-center gap-1.5 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 ${dashboardData.pending_claims > 0 ? 'animate-ping' : ''}`} />
              <span>{dashboardData.pending_claims > 0 ? 'Cần bù acc sớm' : 'Tất cả đã giải quyết'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════
          QUICK ACTIONS SHORTCUT GRID
         ══════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>⚡</span>
            <span>Thao Tác Quản Trị Thường Dùng</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Bấm để chuyển nhanh</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('stock')}
            className="p-4 rounded-2xl bg-[#080d1a] hover:bg-[#10182c] border border-[#1e293b] hover:border-[#00e5a0]/40 text-left transition-all duration-200 group cursor-pointer"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📦</span>
            <div className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors">
              Nạp Thêm Kho Acc
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dán tài khoản hàng loạt</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="p-4 rounded-2xl bg-[#080d1a] hover:bg-[#10182c] border border-[#1e293b] hover:border-[#00c4ff]/40 text-left transition-all duration-200 group cursor-pointer"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🏷️</span>
            <div className="text-xs font-bold text-white group-hover:text-[#00c4ff] transition-colors">
              Quản Lý Bảng Giá
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sửa giá & phân loại gói</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-2xl bg-[#080d1a] hover:bg-[#10182c] border border-[#1e293b] hover:border-purple-400/40 text-left transition-all duration-200 group cursor-pointer"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🛒</span>
            <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              Kiểm Tra Đơn Hàng
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tra cứu mã & đối soát</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="p-4 rounded-2xl bg-[#080d1a] hover:bg-[#10182c] border border-[#1e293b] hover:border-amber-400/40 text-left transition-all duration-200 group cursor-pointer"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">⚙️</span>
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Cài Đặt Cửa Hàng
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Hotline, Banner, Voucher</div>
          </button>


        </div>
      </div>

    </div>
  );
}
