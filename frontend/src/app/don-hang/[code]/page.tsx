'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { OrderDetails } from '@/lib/types';

interface Props {
  params: Promise<{ code: string }>;
}

export default function OrderPage({ params }: Props) {
  const { code } = use(params);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/orders/${code}/details`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setOrder(json.data);
        } else {
          setError(json.message || 'Không thể xem chi tiết đơn hàng.');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  const copyCreds = (item: any, idx: number) => {
    const text = item.parsed?.username
      ? `${item.parsed.username}:${item.parsed.password || ''}`
      : item.raw_credentials || '';
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <span className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin inline-block mb-4" />
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">Không Thể Mở Đơn Hàng</h1>
        <p className="text-sm text-slate-400">{error || 'Đơn hàng chưa hoàn tất thanh toán hoặc không tồn tại.'}</p>
        <Link href="/" className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold">
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            ✓ ĐÃ THANH TOÁN THÀNH CÔNG
          </span>
          <h1 className="text-2xl font-black text-white">Đơn Hàng: {order.order_code}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Khách hàng: <b>{order.customer_name}</b> | Tổng tiền: <b>{order.total_amount.toLocaleString('vi-VN')} VNĐ</b>
          </p>
        </div>

        {/* Action Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`${API_BASE_URL}/orders/${order.order_code}/download`}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            📥 Tải File TXT
          </a>
          <a
            href={`${API_BASE_URL}/orders/${order.order_code}/download-html`}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            🎨 Tải HTML 3D Kho Đồ
          </a>
        </div>
      </div>

      {/* Account Items List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span>Danh Sách Tài Khoản Bàn Giao ({order.items_count} acc)</span>
          <Link
            href={`/bao-hanh?order_code=${order.order_code}`}
            className="text-xs text-amber-400 hover:underline font-normal"
          >
            🛡️ Báo lỗi / Yêu cầu bảo hành →
          </Link>
        </h2>

        {order.items.map((item, idx) => {
          const d = item.parsed;
          return (
            <div
              key={item.order_item_id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                    #{idx + 1}
                  </span>
                  <h3 className="font-bold text-white text-base">{item.product_name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    Hạn BH: {item.warranty_expires_at ? new Date(item.warranty_expires_at).toLocaleString('vi-VN') : '—'}
                  </span>
                  <button
                    onClick={() => copyCreds(item, idx)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {copiedIndex === idx ? '✓ Đã Chép!' : 'Sao Chép TK:MK'}
                  </button>
                </div>
              </div>

              {/* Parsed Info Box */}
              {d && (d.username || d.rank) ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TÀI KHOẢN (USER)</span>
                    <b className="text-white text-sm select-all">{d.username || '—'}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MẬT KHẨU (PASS)</span>
                    <b className="text-amber-400 text-sm select-all">{d.password || '—'}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">RANK HIỆN TẠI</span>
                    <b className="text-emerald-400 text-sm">{d.rank || 'Unranked'}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TỔNG SỐ SKIN</span>
                    <b className="text-purple-400 text-sm">{d.skins_count || 0} Skins</b>
                  </div>
                </div>
              ) : null}

              {/* Raw Log Preview */}
              <details className="text-xs text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <summary className="cursor-pointer text-slate-300 font-medium">
                  Xem chi tiết chuỗi dữ liệu gốc (Log check acc)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] select-all overflow-x-auto text-slate-300">
                  {item.raw_credentials}
                </pre>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
