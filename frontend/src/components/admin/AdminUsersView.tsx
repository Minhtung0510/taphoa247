'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

type UserRow = { id: number; name: string; email: string; role: string; discord_id: string | null; created_at: string; email_verified_at: string | null; orders_count: number; has_password?: boolean | number; is_placeholder_email?: boolean | number; last_login_at?: string | null; last_login_method?: string | null; completed_orders_count?: number; total_spent?: number | string | null; claims_count?: number; orders_max_created_at?: string | null };
type UserPage = { data: UserRow[]; total: number; current_page: number; last_page: number };
type UserSummary = { total: number; admins: number; discord: number; unverified: number };

export function AdminUsersView({ token }: { token: string | null }) {
  const [editing, setEditing] = useState<number | null | undefined>(undefined);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [method, setMethod] = useState('');
  const [verified, setVerified] = useState('');
  const [sort, setSort] = useState('newest');
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<UserPage | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(null);
    const params = new URLSearchParams({ search: query, role, method, verified, sort, page: String(page) });
    fetch(`${API_BASE_URL}/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error('Không thể tải danh sách người dùng. Vui lòng thử lại.'); return res.json(); })
      .then(json => { setResult(json.data); setSummary(json.summary ?? null); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, query, role, method, verified, sort, page, revision]);
  const openEditor = (user?: UserRow) => {
    setEditing(user?.id ?? null); setEditingUser(user ?? null); setActionError(''); setNotice('');
    setForm({ name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'customer' });
  };
  const mutate = async (method: string, id?: number, body?: typeof form) => {
    setSaving(true); setActionError(''); setNotice('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users${id ? `/${id}` : ''}`, {
        method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors ? Object.values(json.errors).flat().join(' ') : json.message || 'Thao tác thất bại.');
      setEditing(undefined); setEditingUser(null); setForm({ name: '', email: '', password: '', role: 'customer' });
      setNotice(method === 'DELETE' ? 'Đã xóa người dùng.' : 'Đã lưu người dùng.');
      if (method === 'DELETE' && result?.data.length === 1 && page > 1) setPage(page - 1);
      setRevision(v => v + 1);
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Lỗi kết nối.'); }
    finally { setSaving(false); }
  };
  const exportCsv = async () => {
    setExporting(true); setActionError('');
    try {
      const params = new URLSearchParams({ search: query, role, method, verified, sort });
      const res = await fetch(`${API_BASE_URL}/admin/users/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Không thể xuất danh sách người dùng.');
      const url = URL.createObjectURL(await res.blob());
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'danh-sach-nguoi-dung.csv'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Lỗi xuất dữ liệu.'); }
    finally { setExporting(false); }
  };
  const resetFilters = () => { setSearch(''); setQuery(''); setRole(''); setMethod(''); setVerified(''); setSort('newest'); setPage(1); };
  const loginMethods = (u: UserRow) => [u.has_password ? 'Email / Mật khẩu' : '', u.discord_id ? 'Discord' : ''].filter(Boolean).join(' + ') || 'Chưa thiết lập';
  const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';
  const money = (value?: number | string | null) => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
  const control = 'rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white';
  return <section className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1725] via-[#0d1322] to-[#101a27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />CRM · Tài khoản cửa hàng</div><h2 className="text-2xl font-black tracking-tight text-white">Khách hàng & người dùng</h2><p className="mt-1 text-sm text-slate-400">Theo dõi đăng nhập, xác minh và giá trị mua hàng trên cùng một màn hình.</p></div>
      <div className="flex flex-wrap gap-2"><button className={`${control} transition-colors hover:border-slate-500`} onClick={() => setRevision(v => v + 1)}>↻ Làm mới</button><button className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50" disabled={exporting} onClick={() => void exportCsv()}>{exporting ? 'Đang xuất…' : '↓ Xuất CSV'}</button><button className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/10 transition-transform hover:-translate-y-0.5 active:scale-[0.98]" onClick={() => openEditor()}>＋ Thêm người dùng</button></div>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Khách hàng', value: summary?.total, detail: 'Tài khoản trong hệ thống', icon: '♙', tone: 'text-cyan-300' },
        { label: 'Quản trị viên', value: summary?.admins, detail: 'Có quyền quản lý cửa hàng', icon: '⚙', tone: 'text-amber-300' },
        { label: 'Đã liên kết Discord', value: summary?.discord, detail: 'Có thể đăng nhập Discord', icon: '◉', tone: 'text-indigo-300' },
        { label: 'Chưa xác minh email', value: summary?.unverified, detail: 'Khách hàng cần xác minh', icon: '✉', tone: 'text-rose-300' },
      ].map(card => <article key={card.label} className="group rounded-2xl border border-slate-800 bg-[#0c1320] p-4 transition-colors hover:border-slate-700"><div className="flex items-start justify-between"><div className="text-sm text-slate-400">{card.label}</div><span className={`grid h-9 w-9 place-items-center rounded-xl bg-slate-800/80 ${card.tone}`}>{card.icon}</span></div><div className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">{loading && card.value === undefined ? '—' : (card.value ?? 0).toLocaleString('vi-VN')}</div><div className="mt-1 text-xs text-slate-500">{card.detail}</div></article>)}
    </div>
    {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">✓ {notice}</p>}
    {actionError && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">{actionError}</p>}
    {editing !== undefined && <form className="space-y-4 rounded-2xl border border-emerald-500/20 bg-[#0c151d] p-5 shadow-xl shadow-black/10" onSubmit={e => { e.preventDefault(); void mutate(editing === null ? 'POST' : 'PUT', editing ?? undefined, form); }}>
      <div className="flex items-center justify-between"><div><div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Hồ sơ tài khoản</div><h3 className="mt-1 text-lg font-bold text-white">{editing === null ? 'Thêm người dùng' : `Sửa người dùng #${editing}`}</h3></div><button type="button" aria-label="Đóng biểu mẫu" className="rounded-lg px-3 py-1 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => { setEditing(undefined); setEditingUser(null); }}>✕</button></div>
      {editingUser && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><span className="text-xs text-slate-500">Đăng nhập được bằng</span>{editingUser.has_password ? <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">Email / Mật khẩu</span> : null}{editingUser.discord_id ? <span className="rounded-md bg-indigo-400/10 px-2 py-1 text-xs text-indigo-300">Discord</span> : null}{!editingUser.has_password && !editingUser.discord_id ? <span className="text-xs text-slate-500">Chưa thiết lập</span> : null}{editingUser.is_placeholder_email && <span className="text-xs text-slate-500">Email đang lưu là địa chỉ nội bộ</span>}</div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-slate-400">Tên<input required maxLength={255} className={`${control} mt-1 block w-full`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-400">Email<input required type="email" maxLength={255} className={`${control} mt-1 block w-full`} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        {(!editingUser?.discord_id || editingUser.has_password) && <label className="text-xs font-semibold text-slate-400">{editing === null ? 'Mật khẩu mới' : editingUser?.discord_id ? 'Mật khẩu đăng nhập email' : 'Mật khẩu mới'}<input required={editing === null} type="password" autoComplete="new-password" minLength={8} maxLength={128} className={`${control} mt-1 block w-full`} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing === null ? 'Ít nhất 8 ký tự' : 'Để trống để giữ mật khẩu hiện tại'} /></label>}
        <label className="text-xs font-semibold text-slate-400">Vai trò<select className={`${control} mt-1 block w-full`} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{editingUser?.discord_id && !editingUser.has_password ? 'Tài khoản này đăng nhập bằng Discord, không có mật khẩu website để thay đổi.' : editingUser?.discord_id ? 'Tài khoản có cả Discord và mật khẩu email. Thay đổi mật khẩu chỉ ảnh hưởng cách đăng nhập bằng email.' : 'Thay đổi email, mật khẩu hoặc quyền sẽ kết thúc các phiên đăng nhập hiện tại.'}</p><div className="flex gap-2"><button type="button" className={control} onClick={() => { setEditing(undefined); setEditingUser(null); }}>Hủy</button><button disabled={saving} className="rounded-xl bg-emerald-400 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu tài khoản'}</button></div></div>
    </form>}
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1320] shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="border-b border-slate-800 p-4 sm:p-5"><form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(145px,auto))_auto_auto]" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search.trim()); setRevision(v => v + 1); }}>
        <div className="relative"><span className="pointer-events-none absolute left-3 top-2.5 text-slate-500">⌕</span><input aria-label="Tìm người dùng" maxLength={150} className={`${control} w-full pl-9`} placeholder="Tên, email, ID hoặc Discord ID" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select aria-label="Lọc vai trò" className={control} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">Tất cả vai trò</option><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select>
        <select aria-label="Lọc cách đăng nhập" className={control} value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}><option value="">Mọi cách đăng nhập</option><option value="password">Email / Mật khẩu</option><option value="discord">Discord</option><option value="both">Có cả hai</option></select>
        <select aria-label="Lọc xác minh email" className={control} value={verified} onChange={e => { setVerified(e.target.value); setPage(1); }}><option value="">Mọi trạng thái email</option><option value="yes">Đã xác minh email</option><option value="no">Chưa xác minh email</option></select>
        <select aria-label="Sắp xếp người dùng" className={control} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="newest">Mới tham gia</option><option value="oldest">Cũ nhất</option><option value="spend">Chi tiêu cao</option><option value="orders">Nhiều đơn</option><option value="login">Đăng nhập gần đây</option></select>
        <button className="rounded-xl bg-emerald-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300">Lọc</button><button type="button" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white" onClick={resetFilters}>Xóa lọc</button>
      </form></div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><div className="text-sm font-semibold text-slate-200">Danh sách tài khoản <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">{result?.total ?? 0}</span></div><div className="text-xs text-slate-500">Chi tiêu gồm đơn đã thanh toán, đang xử lý hoặc hoàn tất</div></div>
      {error ? <p role="alert" className="m-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300">{error}</p> : loading ? <div role="status" className="space-y-3 p-5"><div className="h-10 animate-pulse rounded-xl bg-slate-800/70"/><div className="h-14 animate-pulse rounded-xl bg-slate-800/50"/><div className="h-14 animate-pulse rounded-xl bg-slate-800/50"/></div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Tài khoản', 'Vai trò', 'Đăng nhập', 'Hoạt động mua', 'Lần đăng nhập', 'Ngày tạo', ''].map((h, i) => <th key={i} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{result?.data.map((u, index) => <tr key={u.id} className="border-t border-slate-800/80 text-slate-200 transition-colors hover:bg-white/[0.025]"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black ${u.role === 'admin' ? 'bg-amber-400/10 text-amber-300' : 'bg-cyan-400/10 text-cyan-300'}`}>{(u.name || u.email).slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="font-bold text-white">{u.name || 'Chưa đặt tên'} <span className="font-mono text-[10px] font-normal text-slate-600">#{u.id}</span></div><div className="max-w-[240px] truncate text-xs text-slate-400" title={u.email}>{u.email}{u.is_placeholder_email ? <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">email nội bộ</span> : null}</div></div></div></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${u.role === 'admin' ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20' : 'bg-slate-800 text-slate-300'}`}>{u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</span></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.has_password ? <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">Email</span> : null}{u.discord_id ? <span className="rounded-md bg-indigo-400/10 px-2 py-1 text-[10px] font-semibold text-indigo-300">Discord</span> : null}{!u.has_password && !u.discord_id ? <span className="text-xs text-slate-500">Chưa thiết lập</span> : null}</div><div className={`mt-1 text-[10px] ${u.email_verified_at ? 'text-emerald-400' : 'text-amber-400'}`}>{u.is_placeholder_email && u.discord_id ? '● Discord-only · không cần mật khẩu' : u.email_verified_at ? '● Email xác minh' : '○ Chưa xác minh'}</div></td><td className="px-4 py-3"><div className="font-mono text-xs text-white">{u.orders_count} đơn <span className="text-slate-500">/ {u.completed_orders_count ?? 0} xong</span></div><div className="mt-1 font-mono text-xs text-emerald-300">{money(u.total_spent)}</div></td><td className="px-4 py-3 whitespace-nowrap"><div className="text-xs text-slate-300">{dateTime(u.last_login_at)}</div><div className="mt-1 text-[10px] text-slate-500">{u.last_login_method === 'discord' ? 'Discord' : u.last_login_method === 'password' ? 'Email / Mật khẩu' : 'Chưa có lịch sử'}</div></td><td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button className="rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white" onClick={() => setSelected(u)}>Chi tiết</button><button disabled={saving} className="rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 transition-colors hover:bg-cyan-400/10 disabled:opacity-40" onClick={() => openEditor(u)}>Sửa</button><button disabled={saving || u.role === 'admin' || u.orders_count > 0} title="Chỉ xóa tài khoản khách chưa có giao dịch" className="rounded-lg px-2.5 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-40" onClick={() => { if (window.confirm(`Xóa tài khoản ${u.email}? Thao tác này không thể hoàn tác.`)) void mutate('DELETE', u.id); }}>Xóa</button></div></td></tr>)}</tbody></table></div>
        {!result?.data.length && <div className="px-5 py-14 text-center"><div className="text-3xl text-slate-700">⌕</div><p className="mt-2 font-semibold text-slate-300">Không tìm thấy người dùng</p><p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa hoặc xóa bớt bộ lọc.</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-4"><span className="text-xs text-slate-500">Trang {page} / {result?.last_page ?? 1}</span><div className="flex items-center gap-2"><button className={control} disabled={page <= 1} onClick={() => setPage(v => v - 1)}>← Trước</button><button className={control} disabled={page >= (result?.last_page ?? 1)} onClick={() => setPage(v => v + 1)}>Sau →</button></div></div>
      </>}
    </div>
    {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-label={`Thông tin tài khoản ${selected.email}`} className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-700 bg-[#0d1522] p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between"><div><div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Hồ sơ khách hàng · #{selected.id}</div><h3 className="mt-1 text-xl font-bold text-white">{selected.name}</h3><p className="text-sm text-slate-400">{selected.email}</p>{selected.is_placeholder_email && selected.discord_id ? <span className="mt-2 inline-flex rounded-full bg-indigo-400/10 px-2.5 py-1 text-xs font-semibold text-indigo-300">Discord-only · không có mật khẩu website</span> : null}</div><button aria-label="Đóng chi tiết" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setSelected(null)}>✕</button></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="text-xs text-slate-500">Đơn hàng</div><div className="mt-1 font-mono text-lg text-white">{selected.orders_count} <span className="text-xs text-slate-500">({selected.completed_orders_count ?? 0} hoàn tất)</span></div></div><div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="text-xs text-slate-500">Tổng chi tiêu</div><div className="mt-1 font-mono text-lg text-emerald-300">{money(selected.total_spent)}</div></div></div><div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Phương thức đăng nhập</span><span className="text-right text-slate-200">{loginMethods(selected)}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Email</span><span className={selected.is_placeholder_email && selected.discord_id ? 'text-indigo-300' : selected.email_verified_at ? 'text-emerald-300' : 'text-amber-300'}>{selected.is_placeholder_email && selected.discord_id ? 'Địa chỉ nội bộ, không nhận thư' : selected.email_verified_at ? 'Đã xác minh' : 'Chưa xác minh'}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Discord ID</span><span className="font-mono text-xs text-slate-300">{selected.discord_id || 'Chưa liên kết'}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Đăng nhập gần nhất</span><span className="text-right text-slate-200">{dateTime(selected.last_login_at)}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Đơn gần nhất</span><span className="text-right text-slate-200">{dateTime(selected.orders_max_created_at)}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Yêu cầu bảo hành</span><span className="text-slate-200">{selected.claims_count ?? 0}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Ngày tạo</span><span className="text-right text-slate-200">{new Date(selected.created_at).toLocaleString('vi-VN')}</span></div></div><div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><button className={control} onClick={() => setSelected(null)}>Đóng</button><button className="rounded-xl bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/20" onClick={() => { const user = selected; setSelected(null); openEditor(user); }}>Sửa tài khoản</button></div></div></div>}
  </section>;
}
