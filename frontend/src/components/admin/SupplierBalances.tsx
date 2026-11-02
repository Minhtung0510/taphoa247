'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface Source { id: string; name: string; description: string; balance: number | null }
export function SupplierBalances() {
  const { token } = useAuth();
  const [sources, setSources] = useState<Source[]>([
    { id: 'a', name: 'Nguồn A', description: 'AI, phần mềm và dịch vụ số', balance: null },
    { id: 'b', name: 'Nguồn B', description: 'Tài khoản game và mạng xã hội', balance: null },
    { id: 'c', name: 'Nguồn C', description: 'Tài khoản Muse AI', balance: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const activeToken = token || localStorage.getItem('dtff_auth_token') || localStorage.getItem('admin_token');
    if (!activeToken) return;
    setLoading(true); setError('');
    fetch(`${API_BASE_URL}/admin/supplier-balances`, { headers: { Authorization: `Bearer ${activeToken}`, Accept: 'application/json' }, signal: controller.signal })
      .then(async (res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((json) => { setSources(json.data.sources); setChecked(json.data.checked_at); })
      .catch(() => { if (!controller.signal.aborted) setError('Chưa tải được số dư. Vui lòng thử lại.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, revision]);
  return <section className="rounded-2xl border border-slate-800 bg-[#0c1320] p-5 space-y-4">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">Số dư nguồn hàng</h2><p className="text-xs text-slate-400 mt-1">{checked ? `Kiểm tra lúc ${new Date(checked).toLocaleTimeString('vi-VN')} · Lưu tạm 30 giây` : 'Số dư khả dụng để nhập hàng'}</p></div><button type="button" disabled={loading} onClick={() => setRevision((v) => v + 1)} className="text-sm text-cyan-300 disabled:opacity-50">{loading ? 'Đang tải…' : 'Làm mới số dư'}</button></div>
    {error && <p className="text-sm text-amber-300">{error}</p>}
    <div className="grid gap-3 md:grid-cols-3">{sources.map((source) => <div key={source.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-4"><div className="text-sm text-slate-200">{source.name}</div><div className="mt-2 font-mono text-xl font-bold text-emerald-300">{source.balance === null ? 'Chưa lấy được số dư' : `${source.balance.toLocaleString('vi-VN')} đ`}</div><p className="mt-2 text-xs text-slate-400">{source.description}</p></div>)}</div>
  </section>;
}
