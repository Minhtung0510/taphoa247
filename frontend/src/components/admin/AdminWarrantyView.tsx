'use client';

import React, { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ClaimItem {
  id: number;
  order_item?: {
    product?: {
      name: string;
    };
  };
  error_description?: string;
  evidence_path?: string;
  evidence_url?: string;
}

interface WarrantyClaim {
  id: number;
  order?: {
    order_code: string;
    customer_name?: string;
  };
  claim_items?: ClaimItem[];
  buyer_note?: string;
  state: string;
  admin_note?: string;
  created_at?: string;
}

interface AdminWarrantyViewProps {
  claims: WarrantyClaim[];
  handleApproveClaim: (claimId: number) => void;
  handleRejectClaim: (claimId: number) => void;
  onRefresh: () => void;
}

export function AdminWarrantyView({
  claims,
  handleApproveClaim,
  handleRejectClaim,
  onRefresh,
}: AdminWarrantyViewProps) {
  const [filterState, setFilterState] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // KPIs
  const totalClaims = claims.length;
  const pendingClaims = claims.filter((c) => c.state === 'waiting_admin' || c.state === 'pending' || c.state === 'waiting_stock');
  const approvedClaims = claims.filter((c) => c.state === 'approved');
  const rejectedClaims = claims.filter((c) => c.state === 'rejected');

  // Filter
  const filteredClaims = claims.filter((c) => {
    if (filterState !== 'all') {
      if (filterState === 'pending' && c.state !== 'waiting_admin' && c.state !== 'pending' && c.state !== 'waiting_stock') return false;
      if (filterState === 'approved' && c.state !== 'approved') return false;
      if (filterState === 'rejected' && c.state !== 'rejected') return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.order?.order_code?.toLowerCase().includes(q) ||
      c.order?.customer_name?.toLowerCase().includes(q) ||
      c.buyer_note?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER & KPI METRICS
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng Khiếu Nại */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TỔNG YÊU CẦU BẢO HÀNH
            </span>
            <span className="text-lg">🛡️</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {totalClaims}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Lịch sử bảo hành toàn shop
          </div>
        </div>

        {/* KPI 2: Chờ Duyệt Bù Acc */}
        <div className={`bg-[#0c1324] border rounded-2xl p-5 shadow-lg transition-all ${
          pendingClaims.length > 0 ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-[#1e293b]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
              <span>CHỜ DUYỆT CẤP BÙ</span>
              {pendingClaims.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {pendingClaims.length}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {pendingClaims.length > 0 ? 'Cần admin duyệt cấp bù 1 chạm' : 'Không có khiếu nại tồn đọng'}
          </div>
        </div>

        {/* KPI 3: Đã Cấp Bù Acc Mới */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00e5a0] font-bold">
              ĐÃ CẤP BÙ ACC MỚI
            </span>
            <span className="text-lg">✓</span>
          </div>
          <div className="text-2xl font-black text-[#00e5a0] font-mono mt-2">
            {approvedClaims.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Khách đã nhận tài khoản thay thế
          </div>
        </div>

        {/* KPI 4: Đã Từ Chối */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
              ĐÃ TỪ CHỐI
            </span>
            <span className="text-lg">✗</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-2">
            {rejectedClaims.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Vi phạm chính sách bảo hành
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. FILTER & SEARCH TOOLBAR
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center bg-[#050a14] p-1 rounded-xl border border-[#1e293b] overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterState === 'all'
                ? 'bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({totalClaims})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterState === 'pending'
                ? 'bg-amber-400 text-[#050a14] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Chờ duyệt</span>
            {pendingClaims.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filterState === 'pending' ? 'bg-black/20 text-[#050a14]' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {pendingClaims.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterState('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterState === 'approved'
                ? 'bg-[#00e5a0] text-[#050a14] font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã bù acc ({approvedClaims.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterState === 'rejected'
                ? 'bg-rose-500 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Từ chối ({rejectedClaims.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-md justify-end">
          <input
            type="text"
            placeholder="🔍 Tìm mã đơn, tên khách, nội dung lỗi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#050a14] border border-[#1e293b] text-white rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. WARRANTY CLAIMS TABLE
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#080d19] text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-4 px-4 font-bold">MÃ ĐƠN HÀNG</th>
                <th className="py-4 px-4 font-bold">SẢN PHẨM BẢO HÀNH</th>
                <th className="py-4 px-4 font-bold">LÝ DO BÁO LỖI TỪ KHÁCH</th>
                <th className="py-4 px-4 font-bold">ẢNH BẰNG CHỨNG</th>
                <th className="py-4 px-4 font-bold">TRẠNG THÁI</th>
                <th className="py-4 px-4 text-right font-bold">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🛡️</span>
                      <span className="font-bold text-slate-400 text-sm">
                        Không có yêu cầu bảo hành nào
                      </span>
                      <span className="text-xs text-slate-600">
                        Hệ thống hoạt động trơn tru, không có khiếu nại phát sinh
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((c) => {
                  const isPending = c.state === 'waiting_admin' || c.state === 'pending' || c.state === 'waiting_stock';
                  const isApproved = c.state === 'approved';
                  const isRejected = c.state === 'rejected';

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Order Code */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <a
                            href={`/don-hang/${c.order?.order_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#00e5a0] font-black hover:underline text-xs flex items-center gap-1"
                          >
                            <span>{c.order?.order_code || '—'}</span>
                            <span className="text-[10px] text-slate-500">↗</span>
                          </a>
                          <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                            {c.order?.customer_name || 'Khách hàng'}
                          </span>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-4 font-sans text-slate-200">
                        {c.claim_items && c.claim_items.length > 0 ? (
                          <div className="space-y-1">
                            {c.claim_items.map((ci) => (
                              <div key={ci.id} className="font-bold text-xs flex items-center gap-1.5">
                                <span className="text-amber-400">•</span>
                                <span>{ci.order_item?.product?.name || 'Tài khoản game/acc'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>Tài khoản đơn hàng</span>
                        )}
                      </td>

                      {/* Error Note */}
                      <td className="py-4 px-4 font-sans text-rose-300 max-w-xs break-words">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                          {c.claim_items?.map((ci) => ci.error_description).filter(Boolean).join(', ') ||
                            c.buyer_note ||
                            'Khách báo lỗi tài khoản không đăng nhập được'}
                        </div>
                      </td>

                      {/* Evidence Photo */}
                      <td className="py-4 px-4">
                        {c.claim_items?.map((ci) => {
                          if (ci.evidence_path && ci.evidence_path !== 'no_file') {
                            const imgUrl = ci.evidence_url || `${API_BASE_URL}/warranty/evidence/${ci.id}`;
                            return (
                              <button
                                key={ci.id}
                                type="button"
                                onClick={() => setPreviewImage(imgUrl)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00c4ff]/15 text-[#00c4ff] hover:bg-[#00c4ff]/25 rounded-xl text-xs font-bold border border-[#00c4ff]/30 transition-all cursor-pointer font-sans"
                              >
                                <span>📸</span>
                                <span>Xem ảnh lỗi</span>
                              </button>
                            );
                          }
                          return <span key={ci.id} className="text-slate-500 text-[11px] font-sans italic">Không gửi ảnh</span>;
                        }) || <span className="text-slate-500 text-[11px] font-sans italic">Không gửi ảnh</span>}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1.5 uppercase ${
                            isApproved
                              ? 'bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30'
                              : isRejected
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isApproved ? 'bg-[#00e5a0]' : isRejected ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'
                            }`}
                          />
                          <span>{isApproved ? 'ĐÃ CẤP BÙ' : isRejected ? 'TỪ CHỐI' : 'CHỜ DUYỆT'}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveClaim(c.id)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 text-[#050a14] rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer font-sans"
                            >
                              ✓ Bù Acc
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectClaim(c.id)}
                              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer font-sans"
                            >
                              ✗ Từ Chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-sans">
                            {c.admin_note || 'Đã hoàn tất'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Bằng chứng lỗi"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center border border-slate-600 shadow-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
