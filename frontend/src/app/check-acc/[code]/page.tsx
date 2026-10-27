'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

interface Props {
  params: Promise<{ code: string }>;
}

export default function CheckAccPage({ params }: Props) {
  const { code } = use(params);
  const [position, setPosition] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/orders/${code}/check-acc/${position}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.message);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code, position]);

  const p = data?.parsed;

  const handleCopy = () => {
    if (!p) return;
    navigator.clipboard.writeText(`${p.username}:${p.password || ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold">DTFF SHOP • TRA CỨU KHO ĐỒ</span>
          <h1 className="text-2xl font-black text-white">Chi Tiết Tài Khoản Đơn: {code}</h1>
        </div>
        <Link href={`/don-hang/${code}`} className="text-xs text-slate-400 hover:text-white">
          ← Về đơn hàng
        </Link>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">Đang tra cứu dữ liệu tài khoản...</div>
      ) : error || !data ? (
        <div className="p-8 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl text-center">
          ⚠️ {error || 'Không tìm thấy dữ liệu'}
        </div>
      ) : (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400">TÀI KHOẢN HIỆN TẠI</span>
              <div className="text-lg font-bold text-white">
                #{position + 1} / {data.total_items} - {data.product_name}
              </div>
            </div>

            {/* Pagination between accounts in same order */}
            <div className="flex items-center gap-2">
              <button
                disabled={position <= 0}
                onClick={() => setPosition((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs"
              >
                ← Acc Trước
              </button>
              <button
                disabled={position >= data.total_items - 1}
                onClick={() => setPosition((p) => Math.min(data.total_items - 1, p + 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs"
              >
                Acc Sau →
              </button>
            </div>
          </div>

          {/* Account Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-5 rounded-xl text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TÀI KHOẢN (USER)</span>
              <b className="text-white text-base select-all">{p?.username || '—'}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MẬT KHẨU (PASS)</span>
              <b className="text-amber-400 text-base select-all">{p?.password || '—'}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RANK HIỆN TẠI</span>
              <b className="text-emerald-400 text-base">{p?.rank || 'Unranked'}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TỔNG SỐ SKIN</span>
              <b className="text-purple-400 text-base">{p?.skins_count || 0} Skins</b>
            </div>
          </div>

          {/* Knife / Skin details */}
          {p?.knives && p.knives.length > 0 && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Danh Sách Dao (Melee):</span>
              <div className="text-sm font-bold text-amber-400">{p.knives.join(', ')}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              {copied ? '✓ Đã Sao Chép!' : '📋 Sao Chép TK:MK'}
            </button>
            <a
              href={`${API_BASE_URL}/orders/${code}/download-html`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              📥 Tải File HTML 3D Kho Đồ
            </a>
          </div>

          {/* Raw Log Preview */}
          <details className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <summary className="cursor-pointer text-slate-300 font-medium">Xem Log Kiểm Tra Chi Tiết</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-slate-300 overflow-x-auto">
              {data.raw}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
