'use client';

import React, { useState } from 'react';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    account_type?: string;
  };
}

interface Order {
  id: number;
  order_code: string;
  memo?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  original_amount?: number;
  discount_amount?: number;
  status: string;
  payment_gateway?: string;
  created_at?: string;
  paid_at?: string;
  items?: OrderItem[];
}

interface AdminOrdersViewProps {
  orders: Order[];
  orderStatusFilter: string;
  setOrderStatusFilter: (filter: string) => void;
  orderSearch: string;
  setOrderSearch: (search: string) => void;
  onForceComplete: (orderCode: string) => void;
  onRejectOrder: (orderCode: string, reason?: string) => void;
  onRefresh: () => void;
}

export function AdminOrdersView({
  orders,
  orderStatusFilter,
  setOrderStatusFilter,
  orderSearch,
  setOrderSearch,
  onForceComplete,
  onRejectOrder,
  onRefresh,
}: AdminOrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedMemo, setCopiedMemo] = useState<string | null>(null);
  
  // Duyệt đơn modal
  const [approvingOrder, setApprovingOrder] = useState<Order | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Từ chối đơn modal
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Đơn hàng trùng lặp hoặc khách không thanh toán');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Copy memo function
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(id);
    setTimeout(() => setCopiedMemo(null), 2000);
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'paid');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.status === 'timeout');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Filter & Search
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'completed' && o.status !== 'completed' && o.status !== 'paid') return false;
      if (orderStatusFilter === 'pending' && o.status !== 'pending') return false;
      if (orderStatusFilter === 'cancelled' && o.status !== 'cancelled' && o.status !== 'timeout') return false;
    }
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.order_code?.toLowerCase().includes(q) ||
      (o.memo && o.memo.toLowerCase().includes(q)) ||
      o.customer_name?.toLowerCase().includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q))
    );
  });

  const confirmApprove = async () => {
    if (!approvingOrder) return;
    setIsSubmittingApproval(true);
    try {
      await onForceComplete(approvingOrder.order_code);
      setApprovingOrder(null);
      if (selectedOrder?.order_code === approvingOrder.order_code) {
        setSelectedOrder(null);
      }
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectingOrder) return;
    setIsSubmittingReject(true);
    try {
      await onRejectOrder(rejectingOrder.order_code, rejectReason);
      setRejectingOrder(null);
      if (selectedOrder?.order_code === rejectingOrder.order_code) {
        setSelectedOrder(null);
      }
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER & KPI METRICS (TASTE-DESIGN FINTECH)
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng Đơn */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TỔNG ĐƠN HÀNG
            </span>
            <span className="text-lg">🛒</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {totalOrders}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <span>Toàn bộ đơn phát sinh</span>
          </div>
        </div>

        {/* KPI 2: Chờ Duyệt (Pending) */}
        <div className={`bg-[#0c1324] border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
          pendingOrders.length > 0
            ? 'border-amber-500/40 bg-amber-500/[0.03]'
            : 'border-[#1e293b]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
              <span>CHỜ DUYỆT / CHUYỂN KHOẢN</span>
              {pendingOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {pendingOrders.length > 0 ? 'Cần kiểm tra đối soát memo' : 'Không có đơn tồn đọng'}
          </div>
        </div>

        {/* KPI 3: Đã Giao Thành Công */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00e5a0] font-bold">
              ĐÃ GIAO THÀNH CÔNG
            </span>
            <span className="text-lg">✓</span>
          </div>
          <div className="text-2xl font-black text-[#00e5a0] font-mono mt-2">
            {completedOrders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Tỷ lệ hoàn tất: {totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0}%
          </div>
        </div>

        {/* KPI 4: Doanh Thu Thực Nhận */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00c4ff] font-bold">
              DOANH THU ĐƠN
            </span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {totalRevenue.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-sans font-normal">đ</span>
          </div>
          <div className="text-[11px] text-[#00c4ff]/80 mt-1 font-medium">
            Từ {completedOrders.length} đơn thành công
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. FILTER & SEARCH TOOLBAR
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Filter Buttons */}
        <div className="flex items-center bg-[#050a14] p-1 rounded-xl border border-[#1e293b] overflow-x-auto">
          <button
            type="button"
            onClick={() => setOrderStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              orderStatusFilter === 'all'
                ? 'bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({totalOrders})
          </button>

          <button
            type="button"
            onClick={() => setOrderStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              orderStatusFilter === 'pending'
                ? 'bg-amber-400 text-[#050a14] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Chờ duyệt</span>
            {pendingOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                orderStatusFilter === 'pending' ? 'bg-black/20 text-[#050a14]' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOrderStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              orderStatusFilter === 'completed'
                ? 'bg-[#00e5a0] text-[#050a14] shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã giao ({completedOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setOrderStatusFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              orderStatusFilter === 'cancelled'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Đã hủy / Từ chối ({cancelledOrders.length})
          </button>
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm mã đơn, mã duyệt (memo), tên khách..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#050a14] border border-[#1e293b] text-white rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors placeholder:text-slate-500"
            />
            {orderSearch && (
              <button
                type="button"
                onClick={() => setOrderSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Làm mới danh sách"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. ORDERS TABLE WITH PROMINENT MEMO & ACTION BUTTONS
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#080d19] text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-4 px-4 font-bold">MÃ ĐƠN & THỜI GIAN</th>
                <th className="py-4 px-4 font-bold text-[#00c4ff]">
                  MÃ DUYỆT ĐƠN (MEMO CHUYỂN KHOẢN)
                </th>
                <th className="py-4 px-4 font-bold">KHÁCH HÀNG</th>
                <th className="py-4 px-4 font-bold">SẢN PHẨM MUA</th>
                <th className="py-4 px-4 font-bold">TỔNG TIỀN</th>
                <th className="py-4 px-4 font-bold">TRẠNG THÁI</th>
                <th className="py-4 px-4 text-right font-bold">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📭</span>
                      <span className="font-bold text-slate-400 text-sm">
                        Không tìm thấy đơn hàng nào phù hợp
                      </span>
                      <span className="text-xs text-slate-600">
                        Thử xóa bộ lọc hoặc tìm kiếm theo từ khóa khác
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const memoText = o.memo || o.order_code;
                  const isPending = o.status === 'pending';
                  const isCompleted = o.status === 'completed' || o.status === 'paid';
                  const isCancelled = o.status === 'cancelled' || o.status === 'timeout';

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Column 1: Mã Đơn & Thời Gian */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="text-[#00e5a0] font-black hover:underline text-left text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{o.order_code}</span>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">↗</span>
                          </button>
                          <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                            {o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: MÃ DUYỆT ĐƠN / MEMO */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 bg-[#050a14] border border-[#1e293b] group-hover:border-[#00c4ff]/50 px-2.5 py-1.5 rounded-xl transition-all">
                          <span className="font-black text-[#00c4ff] text-xs font-mono tracking-wider">
                            {memoText}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(memoText, `memo-${o.id}`)}
                            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Sao chép mã duyệt / memo chuyển khoản"
                          >
                            {copiedMemo === `memo-${o.id}` ? '✓ Đã chép' : '📋 Chép'}
                          </button>
                        </div>
                      </td>

                      {/* Column 3: Khách Hàng */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold font-sans text-xs">
                            {o.customer_name || 'Khách vãng lai'}
                          </span>
                          {o.customer_email && (
                            <span className="text-[11px] text-slate-400 font-sans truncate max-w-[160px]">
                              {o.customer_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Sản Phẩm Mua */}
                      <td className="py-4 px-4 font-sans text-slate-300">
                        {o.items && o.items.length > 0 ? (
                          <div className="space-y-1">
                            {o.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="text-xs truncate max-w-[200px] flex items-center gap-1.5">
                                <span className="text-[#00e5a0] font-bold font-mono">x{item.quantity}</span>
                                <span className="truncate">{item.product?.name || 'Sản phẩm'}</span>
                              </div>
                            ))}
                            {o.items.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                + {o.items.length - 2} món khác
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">1 gói tài khoản</span>
                        )}
                      </td>

                      {/* Column 5: Tổng Tiền */}
                      <td className="py-4 px-4">
                        <div className="font-black text-amber-400 font-mono text-sm">
                          {o.total_amount.toLocaleString('vi-VN')} <span className="text-[10px] font-sans">đ</span>
                        </div>
                      </td>

                      {/* Column 6: Trạng Thái */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1.5 uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : isCancelled
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCompleted
                                ? 'bg-[#00e5a0]'
                                : isPending
                                ? 'bg-amber-400 animate-pulse'
                                : isCancelled
                                ? 'bg-rose-500'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span>{isCompleted ? 'ĐÃ GIAO' : isPending ? 'CHỜ DUYỆT' : isCancelled ? 'ĐÃ HỦY' : o.status}</span>
                        </span>
                      </td>

                      {/* Column 7: Thao Tác (Chi tiết, Duyệt đơn, Từ chối) */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all cursor-pointer font-sans"
                            title="Xem chi tiết đơn hàng"
                          >
                            👁️ Chi tiết
                          </button>

                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setApprovingOrder(o)}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 text-[#050a14] rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1 font-sans"
                                title="Duyệt đơn thanh toán thủ công"
                              >
                                <span>⚡</span>
                                <span>Duyệt đơn</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingOrder(o);
                                  setRejectReason('Đơn hàng trùng lặp hoặc khách không thanh toán');
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 font-sans"
                                title="Từ chối / Hủy đơn trùng lặp"
                              >
                                <span>✗</span>
                                <span>Từ chối</span>
                              </button>
                            </>
                          ) : isCancelled ? (
                            <span className="text-rose-400/80 text-[11px] px-2 font-sans font-bold">
                              Đã hủy
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] px-2 font-sans">
                              Đã xử lý
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. MODAL XEM CHI TIẾT ĐƠN HÀNG (ORDER DETAILS DRAWER)
         ══════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1e293b]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] text-[10px] font-mono font-bold uppercase mb-1">
                  CHI TIẾT ĐƠN HÀNG HỆ THỐNG
                </div>
                <h3 className="text-xl font-black text-white font-mono flex items-center gap-2">
                  <span>{selectedOrder.order_code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedOrder.order_code, 'modal-code')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {copiedMemo === 'modal-code' ? '✓' : '📋'}
                  </button>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Thời gian tạo: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('vi-VN') : '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MÃ DUYỆT ĐƠN / MEMO SPOTLIGHT BOX */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00c4ff]/10 via-[#00e5a0]/10 to-[#0c1324] border border-[#00c4ff]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#00c4ff] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔑</span> MÃ DUYỆT ĐƠN (NỘI DUNG CHUYỂN KHOẢN MEMO)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Dùng để so khớp SMS/App Ngân Hàng
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-[#050a14] p-3 rounded-xl border border-[#1e293b]">
                <span className="text-base font-black text-white font-mono tracking-wider">
                  {selectedOrder.memo || selectedOrder.order_code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedOrder.memo || selectedOrder.order_code, 'modal-memo')}
                  className="px-3 py-1.5 bg-[#00e5a0] hover:bg-[#00c4ff] text-[#050a14] rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  {copiedMemo === 'modal-memo' ? '✓ Đã sao chép' : '📋 Sao chép Memo'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                💡 Khi khách thanh toán qua VietQR/SePay, hệ thống đối soát theo nội dung này. Nếu ngân hàng không tự động kích hoạt, admin có thể nhấn Duyệt Đơn ngay bên dưới.
              </p>
            </div>

            {/* Thông tin khách hàng & Giao dịch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#050a14] border border-[#1e293b] space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  THÔNG TIN KHÁCH HÀNG
                </span>
                <div className="text-xs text-slate-300 space-y-1 font-sans">
                  <div>Họ tên: <b className="text-white">{selectedOrder.customer_name || 'Khách vãng lai'}</b></div>
                  <div>Email: <b className="text-[#00c4ff]">{selectedOrder.customer_email || 'Chưa cung cấp'}</b></div>
                  {selectedOrder.customer_phone && (
                    <div>SĐT: <b className="text-white">{selectedOrder.customer_phone}</b></div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#050a14] border border-[#1e293b] space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  THANH TOÁN & TRẠNG THÁI
                </span>
                <div className="text-xs text-slate-300 space-y-1 font-sans">
                  <div>Tổng tiền: <b className="text-amber-400 font-mono text-sm">{selectedOrder.total_amount.toLocaleString('vi-VN')} đ</b></div>
                  <div className="flex items-center gap-2">
                    Trạng thái:
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      selectedOrder.status === 'completed' || selectedOrder.status === 'paid'
                        ? 'bg-[#00e5a0]/20 text-[#00e5a0]'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>Cổng: <b className="text-slate-200">{selectedOrder.payment_gateway || 'VietQR / SePay'}</b></div>
                </div>
              </div>
            </div>

            {/* Sản phẩm trong đơn */}
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                DANH SÁCH MÓN HÀNG
              </span>
              <div className="rounded-xl border border-[#1e293b] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#050a14] text-slate-400 border-b border-[#1e293b] font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Sản phẩm</th>
                      <th className="py-2.5 px-3 text-center">SL</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] font-mono">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-sans text-white font-medium">
                            {it.product?.name || `Sản phẩm #${it.product_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#00e5a0] font-bold">
                            x{it.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {it.unit_price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                            {it.subtotal.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 font-sans">
                          Gói tài khoản đơn lẻ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1e293b]">
              <a
                href={`/don-hang/${selectedOrder.order_code}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer font-sans"
              >
                <span>🔗</span>
                <span>Xem Trang Nhận Hàng Của Khách ↗</span>
              </a>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs font-bold transition-colors cursor-pointer font-sans"
                >
                  Đóng
                </button>

                {selectedOrder.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingOrder(selectedOrder);
                        setRejectReason('Đơn hàng trùng lặp hoặc khách không thanh toán');
                      }}
                      className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                    >
                      ✗ Từ Chối Đơn
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApprovingOrder(selectedOrder);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00e5a0]/20 hover:brightness-110 active:scale-95 cursor-pointer font-sans"
                    >
                      ⚡ Duyệt Đơn Này
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. MODAL XÁC NHẬN DUYỆT ĐƠN (MANUAL CONFIRMATION DIALOG)
         ══════════════════════════════════════════════════════════ */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shrink-0">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-black text-white">Xác Nhận Duyệt Đơn Hàng</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hệ thống sẽ lập tức giao tài khoản cho khách</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#050a14] border border-[#1e293b] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#00e5a0]">{approvingOrder.order_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã duyệt (Memo):</span>
                <span className="font-mono font-bold text-[#00c4ff]">{approvingOrder.memo || approvingOrder.order_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-bold text-white">{approvingOrder.customer_name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#1e293b]">
                <span className="text-slate-400">Số tiền cần nhận:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {approvingOrder.total_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              ⚠️ Lưu ý: Chỉ bấm duyệt khi bạn đã kiểm tra và xác nhận tiền đã vào tài khoản ngân hàng tương ứng với <b>Mã duyệt memo</b> trên.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                disabled={isSubmittingApproval}
                className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs font-bold transition-colors cursor-pointer font-sans"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                disabled={isSubmittingApproval}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00e5a0]/25 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer font-sans"
              >
                {isSubmittingApproval ? 'Đang xử lý...' : '✓ Xác Nhận Đã Nhận Tiền & Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          6. MODAL XÁC NHẬN TỪ CHỐI / HỦY ĐƠN (REJECT DIALOG)
         ══════════════════════════════════════════════════════════ */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c1324] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl shrink-0">
                ✗
              </div>
              <div>
                <h3 className="text-base font-black text-white">Từ Chối / Hủy Đơn Hàng</h3>
                <p className="text-xs text-slate-400 mt-0.5">Áp dụng cho đơn trùng lặp, spam hoặc không thanh toán</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#050a14] border border-[#1e293b] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-rose-400">{rejectingOrder.order_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã duyệt (Memo):</span>
                <span className="font-mono font-bold text-slate-300">{rejectingOrder.memo || rejectingOrder.order_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-bold text-white">{rejectingOrder.customer_name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#1e293b]">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-mono font-bold text-slate-300">
                  {rejectingOrder.total_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Lý do hủy đơn */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block font-sans">
                Lý Do Từ Chối / Hủy Đơn:
              </label>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Đơn hàng trùng lặp',
                  'Khách không chuyển tiền',
                  'Sai nội dung memo đối soát',
                  'Khách yêu cầu hủy đơn',
                ].map((reasonText) => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setRejectReason(reasonText)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium transition-all cursor-pointer ${
                      rejectReason === reasonText
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {reasonText}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-rose-500 transition-colors font-sans"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              ℹ️ Khi bấm xác nhận, đơn sẽ chuyển trạng thái sang <b>ĐÃ HỦY</b> và hoàn trả tồn kho sản phẩm (nếu có).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                disabled={isSubmittingReject}
                className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs font-bold transition-colors cursor-pointer font-sans"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={isSubmittingReject}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-50 cursor-pointer font-sans flex items-center gap-1.5"
              >
                <span>✗</span>
                <span>{isSubmittingReject ? 'Đang hủy...' : 'Xác Nhận Hủy Đơn Hàng Này'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
