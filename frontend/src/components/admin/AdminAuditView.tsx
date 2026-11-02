'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface AuditRecord {
  id: number;
  action: string;
  ip_address: string | null;
  details: { targets?: Record<string, unknown>; status?: number } | null;
  created_at: string;
  user?: { name: string; email: string } | null;
}

export function AdminAuditView({ token }: { token: string | null }) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Không tải được nhật ký thao tác.');
      const json = await response.json();
      setRecords(json.data?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi khi tải nhật ký.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <section className="rounded-2xl border border-slate-800 bg-[#0c1320] p-5 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="font-bold text-white">Nhật ký thao tác quản trị</h2><p className="mt-1 text-xs text-slate-400">Ghi các thao tác thay đổi dữ liệu; không lưu nội dung form hay thông tin bí mật.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-50">{loading ? 'Đang tải…' : 'Làm mới'}</button>
    </div>
    {error && <p className="text-sm text-amber-300">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full min-w-[700px] text-left text-xs">
        <thead className="bg-slate-950 text-slate-400"><tr><th className="p-3">Thời gian</th><th className="p-3">Quản trị viên</th><th className="p-3">Thao tác</th><th className="p-3">Mã phản hồi</th><th className="p-3">IP</th></tr></thead>
        <tbody className="divide-y divide-slate-800 text-slate-200">
          {records.map((record) => <tr key={record.id}><td className="p-3">{new Date(record.created_at).toLocaleString('vi-VN')}</td><td className="p-3">{record.user?.email ?? 'Tài khoản đã xóa'}</td><td className="p-3 font-mono">{record.action}</td><td className="p-3">{record.details?.status ?? '—'}</td><td className="p-3 font-mono">{record.ip_address ?? '—'}</td></tr>)}
          {!loading && records.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Chưa có thao tác nào được ghi nhận.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
