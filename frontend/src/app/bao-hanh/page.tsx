'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

function WarrantyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('order_code') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  const { token: userAuthToken } = useAuth();

  const [orderCode, setOrderCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Danh sách các account được chọn để bảo hành
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File>>({});

  const [submitting, setSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);

  const fetchEligibility = async (codeToFetch: string) => {
    if (!codeToFetch.trim()) return;
    setLoading(true);
    setError(null);
    setClaimResult(null);

    try {
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`order_token_${codeToFetch.trim()}`) : '';
      const activeToken = tokenFromUrl || storedToken || '';
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (activeToken) headers['X-Order-Token'] = activeToken;
      if (userAuthToken) headers['Authorization'] = `Bearer ${userAuthToken}`;
      const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';

      const res = await fetch(`${API_BASE_URL}/orders/${codeToFetch.trim()}/warranty-eligibility${query}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Không tìm thấy đơn hàng hoặc đơn chưa thanh toán.');
      }
      setOrderData(json.data);
    } catch (err: any) {
      setError(err.message);
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchEligibility(initialCode);
    }
  }, [initialCode]);

  const toggleSelect = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleFileChange = (itemId: number, file: File | undefined) => {
    if (!file) return;
    if (file.size > 26214400) {
      alert('Kích thước file vượt quá giới hạn 25MB.');
      return;
    }
    setFiles((prev) => ({ ...prev, [itemId]: file }));
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tài khoản cần bảo hành.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('order_code', orderCode.trim());

      const itemsPayload = selectedItemIds.map((id) => ({
        order_item_id: id,
        error_description: descriptions[id] || 'Sai mật khẩu / Không đăng nhập được',
      }));
      formData.append('items', JSON.stringify(itemsPayload));

      selectedItemIds.forEach((id) => {
        if (files[id]) {
          formData.append('files[]', files[id]);
        }
      });

      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`order_token_${orderCode.trim()}`) : '';
      const activeToken = tokenFromUrl || storedToken || '';
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (activeToken) headers['X-Order-Token'] = activeToken;
      if (userAuthToken) headers['Authorization'] = `Bearer ${userAuthToken}`;

      const res = await fetch(`${API_BASE_URL}/warranty/claims`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Lỗi khi gửi yêu cầu bảo hành.');
      }

      setClaimResult(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="hero-bg border-b border-slate-800/30 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f59e0b]/15 to-[#ef4444]/15 flex items-center justify-center text-2xl border border-[#f59e0b]/10">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Trung Tâm Bảo Hành
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Hỗ trợ đổi mới tài khoản từ 2 giờ đến 5 giờ (quy định cụ thể trên từng gói)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Tra cứu mã đơn */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🔍</span> Nhập Mã Đơn Hàng Cần Bảo Hành (Ví dụ: ACC-ABC12345)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="ACC-..."
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
            className="form-input font-mono flex-1 text-base py-3"
          />
          <button
            type="button"
            onClick={() => fetchEligibility(orderCode)}
            disabled={loading || !orderCode.trim()}
            className="btn-primary !px-8 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-black whitespace-nowrap shadow-lg shadow-[#00e5a0]/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Đang tra cứu...'
            ) : (
              <>
                <span>Tra Cứu Ngay</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          💡 Mã đơn hàng được cấp ngay khi bạn quét mã VietQR và gửi kèm trong nội dung thanh toán.
        </p>
      </div>

      {/* Guide & Policies displayed when no order loaded yet */}
      {!orderData && !loading && (
        <div className="space-y-6 pt-2">
          {/* 3 Step Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#090f1e]/90 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#00e5a0]/15 flex items-center justify-center text-lg text-[#00e5a0] font-black">
                1
              </div>
              <h3 className="font-bold text-white text-sm">Nhập Mã Đơn Hàng</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Điền mã đơn dạng <code className="text-[#00e5a0]">ACC-XXXXXX</code> để hệ thống kiểm tra thời hạn bảo hành tự động.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090f1e]/90 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#00c4ff]/15 flex items-center justify-center text-lg text-[#00c4ff] font-black">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Chọn Tài Khoản Bị Lỗi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tích chọn tài khoản gặp sự cố (sai pass, bị khóa) và mô tả ngắn gọn tình trạng lỗi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090f1e]/90 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-lg text-purple-400 font-black">
                3
              </div>
              <h3 className="font-bold text-white text-sm">Nhận Acc Mới Sau 3s</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống AI đối soát tức thì và tự động cắt tài khoản mới cùng loại bù cho bạn ngay trên màn hình.
              </p>
            </div>
          </div>

          {/* Warranty Matrix Table */}
          <div className="p-6 rounded-2xl bg-[#090f1e]/90 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-1 h-4 rounded bg-[#00e5a0]" />
              Quy Định Thời Hạn Bảo Hành 1 Đổi 1
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-3">Gói Tài Khoản</th>
                    <th className="py-2.5 px-3">Thời Hạn Bảo Hành</th>
                    <th className="py-2.5 px-3">Trường Hợp Hỗ Trợ</th>
                    <th className="py-2.5 px-3 text-right">Hình Thức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-sky-300">💻 Cursor AI Pro (Gói Ngày & VIP)</td>
                    <td className="py-3 px-3 text-sky-400 font-bold">1 - 30 Ngày (theo hạn gói)</td>
                    <td className="py-3 px-3 text-slate-400">Key không hoạt động, lỗi Extension</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Đổi Key Mới</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-pink-300">✨ Gemini Antigravity (Slot & Admin)</td>
                    <td className="py-3 px-3 text-pink-400 font-bold">1 - 12 Tháng (Full slot / 1-2th Admin)</td>
                    <td className="py-3 px-3 text-slate-400">Lỗi slot Google Family, sai pass ban đầu</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Bù Slot / Đổi Acc</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-blue-300">☁️ Google One 5TB (Slot Chính Chủ)</td>
                    <td className="py-3 px-3 text-blue-400 font-bold">1 - 12 Tháng FULL trọn vẹn</td>
                    <td className="py-3 px-3 text-slate-400">Lỗi mất dung lượng 5TB từ Google Family</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Cấp Lại Slot 5TB</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-emerald-300">⚡ API Sub Credits (Claude, Codex, DeepSeek)</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">Không giới hạn thời gian (Vĩnh viễn)</td>
                    <td className="py-3 px-3 text-slate-400">Mã thẻ nạp không hợp lệ lúc nhận</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Đổi Mã Nạp 100%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-amber-300">🎨 Muse AI 1B Token</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">24 Giờ kể từ khi giao</td>
                    <td className="py-3 px-3 text-slate-400">Sai mật khẩu, tài khoản không đăng nhập được</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Đổi Acc 1:1</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-purple-300">🎬 DigiVideoViral & AI Kit</td>
                    <td className="py-3 px-3 text-purple-400 font-bold">Trọn đời (Link tải & Source code)</td>
                    <td className="py-3 px-3 text-slate-400">Link tải Drive bị hỏng, lỗi giải nén</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Cập Nhật Link</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">🎯 Tài Khoản Valorant & Game</td>
                    <td className="py-3 px-3 text-[#00e5a0] font-bold">2 - 5 Giờ (theo niêm yết của từng gói)</td>
                    <td className="py-3 px-3 text-slate-400">Sai mật khẩu, tài khoản bị khóa trước khi mua</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Đổi 1:1 Tự Động</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-rose-300">🛡️ Gói Chủ Off (Valorant)</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">5 Giờ kể từ khi thanh toán</td>
                    <td className="py-3 px-3 text-slate-400">Sai mật khẩu, có người tranh online, bị đè trận</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">Đổi 1:1 Tự Động</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Emergency Support Hotline Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <span>📞</span> Kênh Cứu Trợ Khách Hàng 24/7
              </div>
              <p className="text-xs text-slate-300">
                Nếu đơn hàng đã quá hạn bảo hành tự động hoặc bạn cần hỗ trợ gấp, vui lòng liên hệ trực tiếp admin qua Hotline / Telegram.
              </p>
            </div>
            <a
              href="https://t.me/taphoa247_support"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-md"
            >
              Liên Hệ Hotline Admin
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {claimResult && (
        <div className="glass-card rounded-2xl p-6 space-y-3 border-[#f59e0b]/20">
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>✅</span> Đã Gửi Yêu Cầu Bảo Hành Thành Công!
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p>Mã khiếu nại: <b className="gradient-text-warm font-mono">{claimResult.claim_code}</b></p>
            <p>Trạng thái: <b className="text-[#f59e0b] font-bold uppercase font-mono">{claimResult.state === 'waiting_admin' ? 'Đang chờ Admin duyệt' : claimResult.state}</b></p>
          </div>
          <p className="text-xs text-slate-500">
            Yêu cầu của bạn đã được chuyển tới Quản Trị Viên Tạp Hóa 247. Shop sẽ kiểm tra và bấm duyệt cấp bù tài khoản mới sớm nhất!
          </p>
        </div>
      )}

      {/* Hiển thị danh sách acc đủ điều kiện bảo hành */}
      {orderData && (
        <form onSubmit={handleSubmitClaim} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              Tài Khoản Còn Trong Hạn Bảo Hành ({orderData.eligible_items?.length || 0} acc)
            </h2>

            {orderData.eligible_items?.length === 0 ? (
              <p className="text-xs text-slate-400">
                Tất cả tài khoản trong đơn này đã hết hạn bảo hành hoặc đã được đổi 1 lần trước đó.
              </p>
            ) : (
              <div className="space-y-4">
                {orderData.eligible_items.map((item: any) => {
                  const isChecked = selectedItemIds.includes(item.order_item_id);
                  return (
                    <div
                      key={item.order_item_id}
                      className={`p-4 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-[#050a14] border-[#00e5a0]/40'
                          : 'bg-[#050a14]/60 border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(item.order_item_id)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                          />
                          <span className="font-bold text-sm text-white">
                            Tài khoản #{item.position + 1}: {item.product_name}
                          </span>
                        </label>
                        <span className="text-xs font-mono text-amber-400">
                          Còn {Math.round(item.remaining_seconds / 60)} phút bảo hành
                        </span>
                      </div>

                      {/* Lý do báo lỗi và upload ảnh nếu có */}
                      {isChecked && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                              Chọn lý do lỗi nhanh hoặc tự nhập:
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {[
                                'Sai mật khẩu / không đăng nhập được',
                                'Tài khoản bị cấm (Banned / Khóa)',
                                'Tài khoản bị chủ cũ đổi mật khẩu',
                              ].map((reason) => (
                                <button
                                  type="button"
                                  key={reason}
                                  onClick={() =>
                                    setDescriptions({ ...descriptions, [item.order_item_id]: reason })
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    descriptions[item.order_item_id] === reason
                                      ? 'bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/30'
                                      : 'bg-[#0a1628] text-slate-400 border-slate-800/50 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              placeholder="Hoặc tự nhập mô tả lỗi chi tiết..."
                              value={descriptions[item.order_item_id] || ''}
                              onChange={(e) =>
                                setDescriptions({ ...descriptions, [item.order_item_id]: e.target.value })
                              }
                              className="form-input text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">
                              Ảnh chụp màn hình lỗi (Không bắt buộc):
                            </label>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/webp,video/mp4"
                              onChange={(e) => handleFileChange(item.order_item_id, e.target.files?.[0])}
                              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {orderData.eligible_items?.length > 0 && (
            <button
              type="submit"
              disabled={submitting || selectedItemIds.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-[#050a14] font-black rounded-xl text-base transition-all shadow-xl shadow-[#f59e0b]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[#f59e0b]/30"
            >
              {submitting
                ? 'Đang kiểm tra bằng chứng & cấp bù...'
                : `🛡️ Gửi Yêu Cầu Bảo Hành (${selectedItemIds.length} acc đã chọn)`}
            </button>
          )}
        </form>
      )}
      </div>
    </div>
  );
}

export default function WarrantyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Đang tải trung tâm bảo hành...</p>
        </div>
      </div>
    }>
      <WarrantyContent />
    </Suspense>
  );
}
