'use client';
import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export function ImageImport({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('image', file);
      const token = localStorage.getItem('dtff_auth_token') || localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/admin/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Không tải được ảnh.');
      onChange(json.data.url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được ảnh.'); }
    finally { setBusy(false); }
  };
  return <div className="rounded-xl border border-slate-700 p-4 space-y-3"><div className="text-sm font-semibold text-slate-200">{label}</div>
    {value && /^https?:\/\//i.test(value) && <img src={value} alt="Xem trước ảnh" className="h-24 w-24 rounded-xl bg-slate-900 object-contain" />}
    <input aria-label={`${label} URL`} type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Dán URL ảnh https://…" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
    <div className="flex flex-wrap items-center gap-3"><label className="cursor-pointer rounded-lg bg-cyan-400/15 px-3 py-2 text-sm text-cyan-300">{busy ? 'Đang tải…' : 'Tải ảnh từ máy'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label><button type="button" onClick={() => onChange('')} className="text-sm text-slate-400">Bỏ ảnh</button><span className="text-xs text-slate-500">JPG, PNG, WebP · tối đa 5 MB</span></div>
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
  </div>;
}
