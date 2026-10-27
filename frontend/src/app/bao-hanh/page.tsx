'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

function WarrantyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('order_code') || '';

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
      const res = await fetch(`${API_BASE_URL}/orders/${codeToFetch.trim()}/warranty-eligibility`);
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

    for (const id of selectedItemIds) {
      if (!files[id]) {
        alert('Bắt buộc phải tải lên file ảnh/video bằng chứng cho tất cả acc đã chọn.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('order_code', orderCode.trim());

      const itemsPayload = selectedItemIds.map((id) => ({
        order_item_id: id,
        error_description: descriptions[id] || 'Tài khoản sai mật khẩu / bị khóa',
      }));
      formData.append('items', JSON.stringify(itemsPayload));

      selectedItemIds.forEach((id) => {
        formData.append('files[]', files[id]);
      });

      const res = await fetch(`${API_BASE_URL}/warranty/claims`, {
        method: 'POST',
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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
          🛡️ HỆ THỐNG BẢO HÀNH 1 ĐỔI 1 TỰ ĐỘNG
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Trung Tâm Bảo Hành & Tra Cứu Đơn Hàng
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Hỗ trợ đổi mới tài khoản trong 2 giờ (gói Thường) hoặc 5 giờ (gói Chủ Off). Kiểm tra tự động 24/7.
        </p>
      </div>

      {/* Tra cứu mã đơn */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase">
          Nhập Mã Đơn Hàng (Ví dụ: ACC-ABC12345)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="ACC-..."
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-emerald-500 outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => fetchEligibility(orderCode)}
            disabled={loading || !orderCode.trim()}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Đang tra cứu...' : '🔍 Tra Cứu Đơn Hàng'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {claimResult && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎉</span> Yêu Cầu Bảo Hành Đã Được Xử Lý!
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p>Mã yêu cầu: <b className="text-emerald-400 font-mono">{claimResult.claim_code}</b></p>
            <p>Trạng thái: <b className="text-amber-400 uppercase font-mono">{claimResult.state}</b></p>
          </div>
          <p className="text-xs text-slate-400">
            {claimResult.state === 'approved'
              ? 'Hệ thống đã tự động duyệt và cấp bù acc mới thành công! Vui lòng tải lại trang Đơn Hàng để nhận acc.'
              : 'Yêu cầu của bạn đang được xử lý hoặc đang chờ Admin duyệt tay. Vui lòng quay lại sau ít phút.'}
          </p>
        </div>
      )}

      {/* Hiển thị danh sách acc đủ điều kiện bảo hành */}
      {orderData && (
        <form onSubmit={handleSubmitClaim} className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
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
                          ? 'bg-slate-950 border-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800'
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

                      {/* Input file và mô tả lỗi nếu được tick chọn */}
                      {isChecked && (
                        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Tải lên 1 ảnh/video bằng chứng lỗi (Bắt buộc)
                            </label>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                              onChange={(e) => handleFileChange(item.order_item_id, e.target.files?.[0])}
                              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700"
                              required
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Hỗ trợ PNG, JPG, WebP, MP4 (Tối đa 25MB)
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Mô tả lỗi cụ thể
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Bị sai mật khẩu khi đăng nhập Riot Client"
                              value={descriptions[item.order_item_id] || ''}
                              onChange={(e) =>
                                setDescriptions({ ...descriptions, [item.order_item_id]: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-emerald-500 outline-none"
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
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-base transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {submitting
                ? 'Đang kiểm tra bằng chứng & cấp bù...'
                : `🛡️ Gửi Yêu Cầu Bảo Hành (${selectedItemIds.length} acc đã chọn)`}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default function WarrantyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Đang tải trung tâm bảo hành...</div>}>
      <WarrantyContent />
    </Suspense>
  );
}
