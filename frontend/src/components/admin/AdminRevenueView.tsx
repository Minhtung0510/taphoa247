'use client';

import React, { useState } from 'react';

export interface RevenueCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  total_revenue: number;
  total_sold: number;
  percentage: number;
}

export interface TopProduct {
  product_id: number;
  name: string;
  category: string;
  total_sold: number;
  total_revenue: number;
}

export interface DailyBreakdown {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface RevenueData {
  all_time_revenue: number;
  all_time_orders: number;
  total_orders_created: number;
  conversion_rate: number;
  today_revenue: number;
  today_orders: number;
  last_7_days_revenue: number;
  last_7_days_orders: number;
  last_30_days_revenue: number;
  last_30_days_orders: number;
  revenue_by_category: RevenueCategory[];
  top_products: TopProduct[];
  daily_breakdown: DailyBreakdown[];
}

export function AdminRevenueView({ revenueData }: { revenueData: RevenueData }) {
  const [selectedDay, setSelectedDay] = useState<DailyBreakdown | null>(null);

  // Financial calculations
  const allTimeRevenue = revenueData.all_time_revenue || 0;
  const allTimeOrders = revenueData.all_time_orders || 0;
  const totalOrdersCreated = revenueData.total_orders_created || 0;
  const aov = allTimeOrders > 0 ? Math.round(allTimeRevenue / allTimeOrders) : 0;
  const dailyAverage7 = Math.round((revenueData.last_7_days_revenue || 0) / 7);
  const maxDailyRev = Math.max(
    ...(revenueData.daily_breakdown?.map((d) => d.revenue) || [1]),
    10000
  );
  const maxProductSold = Math.max(
    ...(revenueData.top_products?.map((p) => p.total_sold) || [1]),
    1
  );

  // Export CSV Handler
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // BOM for Vietnamese Excel support
    csv += 'BAO CAO DOANH THU TAP HOA 247\n';
    csv += `Ngay xuat: ${new Date().toLocaleString('vi-VN')}\n`;
    csv += `Tong doanh thu: ${allTimeRevenue.toLocaleString('vi-VN')} VND\n`;
    csv += `Tong don hoan tat: ${allTimeOrders}\n`;
    csv += `Ty le thanh toan: ${revenueData.conversion_rate}%\n\n`;

    csv += '--- DOANH THU 7 NGAY QUA ---\n';
    csv += 'Ngay,Doanh Thu (VND),So Don\n';
    revenueData.daily_breakdown?.forEach((d) => {
      csv += `"${d.date}",${d.revenue},${d.orders}\n`;
    });

    csv += '\n--- TOP SAN PHAM BAN CHAY ---\n';
    csv += 'Hang,Ten San Pham,Danh Muc,So Luong Ban,Tong Doanh Thu (VND)\n';
    revenueData.top_products?.forEach((tp, idx) => {
      csv += `${idx + 1},"${tp.name}","${tp.category}",${tp.total_sold},${tp.total_revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BaoCaoDoanhThu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ══════════════════════════════════════════════════════════
          1. EXECUTIVE HEADER & CONTROLS
         ══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1324] via-[#0f172a] to-[#0c1324] border border-[#1e293b] p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] via-[#00c4ff] to-[#a855f7] opacity-80" />
        <div className="absolute -top-24 right-1/4 w-96 h-32 bg-[#00e5a0]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/25 text-[#00e5a0] text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-ping" />
              FINANCIAL AUDIT • REALTIME SYNC
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Báo Cáo Phân Tích & Đối Soát Doanh Thu</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Dữ liệu tài chính minh bạch được đối soát tự động theo thời gian thực từ các giao dịch VietQR TPBank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Conversion Rate Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-[#090f1d] border border-[#1e293b] flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#00e5a0] animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-mono">Tỷ lệ thanh toán</span>
                <span className="text-xs font-black text-[#00e5a0] font-mono">
                  {revenueData.conversion_rate}%
                </span>
              </div>
            </div>

            {/* AOV Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-[#090f1d] border border-[#1e293b] flex items-center gap-2 shadow-sm">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-mono">Giá trị TB / đơn (AOV)</span>
                <span className="text-xs font-black text-[#00c4ff] font-mono">
                  {aov.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* CSV Export Action Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border border-slate-600/60 hover:border-slate-500 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
              title="Tải file CSV báo cáo tài chính"
            >
              <svg className="w-4 h-4 text-[#00e5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Xuất File CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. THE 4 FINANCIAL KPI CARDS (FINTECH STYLE)
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: HÔM NAY */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-[#00e5a0]/40 p-5 sm:p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#00e5a0]/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] to-transparent opacity-80" />
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              HÔM NAY
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00e5a0]/15 text-[#00e5a0] text-[10px] font-mono font-bold border border-[#00e5a0]/25">
              {revenueData.today_orders} đơn
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight group-hover:text-[#00e5a0] transition-colors">
              {revenueData.today_revenue.toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-slate-400 ml-1">đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>TB 7 ngày:</span>
              <span className="text-slate-300 font-semibold">{dailyAverage7.toLocaleString('vi-VN')} đ/ngày</span>
            </div>
          </div>

          {/* Micro Progress Track */}
          <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Tiến độ ngày</span>
            <span className="text-[#00e5a0] font-bold">
              {dailyAverage7 > 0 ? `${Math.round((revenueData.today_revenue / dailyAverage7) * 100)}% mục tiêu` : 'Đang cập nhật'}
            </span>
          </div>
        </div>

        {/* KPI 2: 7 NGÀY GẦN NHẤT */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-[#00c4ff]/40 p-5 sm:p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#00c4ff]/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00c4ff] to-transparent opacity-80" />
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              7 NGÀY GẦN NHẤT
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00c4ff]/15 text-[#00c4ff] text-[10px] font-mono font-bold border border-[#00c4ff]/25">
              {revenueData.last_7_days_orders} đơn
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight group-hover:text-[#00c4ff] transition-colors">
              {revenueData.last_7_days_revenue.toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-slate-400 ml-1">đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>Khối lượng:</span>
              <span className="text-slate-300 font-semibold">1 tuần giao dịch</span>
            </div>
          </div>

          {/* Micro Details */}
          <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Tốc độ</span>
            <span className="text-[#00c4ff] font-bold">
              {Math.round((revenueData.last_7_days_orders / 7) * 10) / 10} đơn / ngày
            </span>
          </div>
        </div>

        {/* KPI 3: 30 NGÀY GẦN NHẤT */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-amber-400/40 p-5 sm:p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-400/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-transparent opacity-80" />
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              30 NGÀY GẦN NHẤT
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/25">
              {revenueData.last_30_days_orders} đơn
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight group-hover:text-amber-300 transition-colors">
              {revenueData.last_30_days_revenue.toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-slate-400 ml-1">đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>Tỷ trọng tháng:</span>
              <span className="text-slate-300 font-semibold">
                {allTimeRevenue > 0 ? Math.round((revenueData.last_30_days_revenue / allTimeRevenue) * 100) : 0}% tổng DT
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Hiệu suất tháng</span>
            <span className="text-amber-300 font-bold">100% tự động</span>
          </div>
        </div>

        {/* KPI 4: TỔNG TOÀN THỜI GIAN */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] hover:border-purple-400/40 p-5 sm:p-6 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-400/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-transparent opacity-80" />
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOÀN THỜI GIAN
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-300 text-[10px] font-mono font-bold border border-purple-400/25">
              {allTimeOrders} hoàn tất
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight group-hover:text-purple-300 transition-colors">
              {allTimeRevenue.toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-slate-400 ml-1">đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>Tổng số đơn tạo:</span>
              <span className="text-slate-300 font-semibold">{totalOrdersCreated} đơn</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Cổng thanh toán</span>
            <span className="text-purple-300 font-bold">VietQR TPBank</span>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════
          3. VISUAL CHARTS & CATEGORY DISTRIBUTION
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: 7-DAY REVENUE BAR CHART */}
        <div className="lg:col-span-7 rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1e293b]/80">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>📊</span>
                  <span>Xu Hướng Doanh Thu 7 Ngày Gần Nhất</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Biểu đồ trực quan doanh thu theo từng ngày
                </p>
              </div>

              {selectedDay ? (
                <div className="px-3 py-1 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[11px] font-mono text-[#00e5a0] font-bold">
                  {selectedDay.label}: {selectedDay.revenue.toLocaleString('vi-VN')} đ ({selectedDay.orders} đơn)
                </div>
              ) : (
                <span className="text-[11px] font-mono text-slate-500">
                  Rê chuột vào cột để xem chi tiết
                </span>
              )}
            </div>

            {/* Vertical Bar Chart Container */}
            <div className="pt-8 pb-3 px-2">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 border-b border-[#1e293b]/80 pb-2 relative">
                
                {/* Background Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-slate-600 w-full" />
                  <div className="border-b border-dashed border-slate-600 w-full" />
                  <div className="border-b border-dashed border-slate-600 w-full" />
                </div>

                {revenueData.daily_breakdown?.map((d, idx) => {
                  const heightPercent = d.revenue > 0 ? Math.max(12, Math.round((d.revenue / maxDailyRev) * 100)) : 4;
                  const isHovered = selectedDay?.date === d.date;
                  const isToday = idx === revenueData.daily_breakdown.length - 1;

                  return (
                    <div
                      key={d.date}
                      onMouseEnter={() => setSelectedDay(d)}
                      onMouseLeave={() => setSelectedDay(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                    >
                      {/* Bar Floating Tooltip on Hover */}
                      <div
                        className={`absolute -top-10 px-2.5 py-1 rounded-xl bg-[#050a14] border border-[#00e5a0]/40 text-[#00e5a0] text-[10px] font-mono font-bold whitespace-nowrap shadow-xl transition-all duration-200 pointer-events-none ${
                          isHovered ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-1'
                        }`}
                      >
                        {d.revenue.toLocaleString('vi-VN')} đ
                      </div>

                      {/* Bar Column */}
                      <div className="w-full max-w-[40px] flex items-end justify-center h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-2xl transition-all duration-300 relative overflow-hidden ${
                            isToday
                              ? 'bg-gradient-to-t from-[#00e5a0] to-[#00c4ff] shadow-lg shadow-[#00e5a0]/30'
                              : d.revenue > 0
                              ? 'bg-gradient-to-t from-slate-700 to-[#00c4ff] group-hover:from-[#00e5a0] group-hover:to-[#00c4ff]'
                              : 'bg-slate-800/40 border border-slate-800'
                          } ${isHovered ? 'brightness-125 scale-[1.05]' : ''}`}
                        >
                          {/* Glossy Top Highlight */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/40 rounded-t-2xl" />
                        </div>
                      </div>

                      {/* Date Label */}
                      <div className="mt-3 text-center">
                        <span
                          className={`text-[11px] font-mono block ${
                            isToday
                              ? 'text-[#00e5a0] font-black'
                              : isHovered
                              ? 'text-white font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {d.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          {d.orders} đơn
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Summary Footer */}
          <div className="pt-3 border-t border-[#1e293b]/70 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Tổng cộng 7 ngày: <b className="text-white">{revenueData.last_7_days_revenue.toLocaleString('vi-VN')} đ</b>
            </span>
            <span className="text-[#00e5a0] font-semibold">
              ✓ Hoàn tất {revenueData.last_7_days_orders} đơn hàng
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: REVENUE BY GAME / CATEGORY */}
        <div className="lg:col-span-5 rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] p-6 sm:p-7 space-y-5 shadow-xl backdrop-blur-xl">
          <div className="pb-3 border-b border-[#1e293b]/80">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <span>🎯</span>
              <span>Tỷ Trọng Doanh Thu Theo Game</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Phân bổ dòng tiền theo từng danh mục sản phẩm
            </p>
          </div>

          <div className="space-y-3.5">
            {revenueData.revenue_by_category?.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-[#080d1a] border border-[#1e293b] hover:border-slate-700 transition-all space-y-2.5 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base group-hover:scale-125 transition-transform">{c.icon || '🎮'}</span>
                    <span className="font-bold text-white group-hover:text-[#00c4ff] transition-colors">
                      {c.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-[#00e5a0] text-xs">
                      {c.total_revenue.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                      ({c.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#11192e] rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${Math.max(c.percentage, 3)}%` }}
                    className="h-full bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] rounded-full transition-all duration-500 shadow-sm shadow-[#00e5a0]/30"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  <span>Số lượng xuất kho</span>
                  <span className="text-slate-200 font-semibold">{c.total_sold} tài khoản</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════
          4. TOP PRODUCTS LEADERBOARD (EXECUTIVE TABLE)
         ══════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-[#0c1222]/90 border border-[#1e293b] p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e293b]/80">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <span>🏆</span>
              <span>Top Sản Phẩm Mang Lại Doanh Thu Cao Nhất</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Xếp hạng theo tổng doanh số thực tế đã khớp lệnh thành công
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Hiển thị 5 sản phẩm bán chạy nhất
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16">Hạng</th>
                <th className="py-3 px-4">Tên Sản Phẩm</th>
                <th className="py-3 px-4">Danh Mục</th>
                <th className="py-3 px-4">Đã Bán</th>
                <th className="py-3 px-4 text-right">Tổng Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60 font-mono">
              {revenueData.top_products?.map((tp, idx) => {
                const soldMeterPercent = Math.max(10, Math.round((tp.total_sold / maxProductSold) * 100));

                return (
                  <tr
                    key={tp.product_id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4">
                      {idx === 0 ? (
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25">
                          🥇 1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xs shadow-md shadow-slate-300/20">
                          🥈 2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs shadow-md shadow-amber-700/20">
                          🥉 3
                        </span>
                      ) : (
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-[#131b2e] text-slate-400 font-bold text-xs border border-slate-700/50">
                          #{idx + 1}
                        </span>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="py-3.5 px-4 font-sans font-bold text-white group-hover:text-[#00e5a0] transition-colors">
                      {tp.name}
                    </td>

                    {/* Category Chip */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[10px] font-sans font-semibold">
                        {tp.category}
                      </span>
                    </td>

                    {/* Sold Progress */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <span className="text-[#00c4ff] font-bold shrink-0">{tp.total_sold} acc</span>
                        <div className="flex-1 bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${soldMeterPercent}%` }}
                            className="h-full bg-gradient-to-r from-[#00c4ff] to-[#00e5a0] rounded-full"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-black text-[#00e5a0] font-mono">
                        {tp.total_revenue.toLocaleString('vi-VN')}
                        <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
