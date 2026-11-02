'use client';

import { useState } from 'react';

export function categoryIcon(icon?: string): string {
  if (icon && /^https?:\/\//i.test(icon)) return '📦';
  const icons: Record<string, string> = {
    'chat-bubble': '💬', fire: '🔥', cursor: '🖱️', sparkles: '✨',
    'cpu-chip': '⚙️', cloud: '☁️', 'paint-brush': '🎨', 'video-camera': '🎬',
  };
  return icon && !/^[a-z][a-z-]*$/i.test(icon) ? icon : icons[icon || ''] || '📦';
}

export function CategoryArtwork({ icon }: { icon?: string }) {
  return icon && /^https?:\/\//i.test(icon)
    ? <img src={icon} alt="" className="h-full w-full max-h-10 max-w-10 rounded-lg object-contain" />
    : <>{categoryIcon(icon)}</>;
}

interface Category {
  id: number; name: string; slug: string; icon?: string; is_active?: boolean; sort_order?: number;
}
interface Product { category_id?: number; category?: { slug: string }; is_active?: boolean }

export function CategoryManager({ categories, products, onCreate, onEdit, onDelete, onProducts, onClose }: {
  categories: Category[]; products: Product[]; onCreate: () => void; onEdit: (c: Category) => void;
  onDelete: (id: number, name: string) => void; onProducts: (id: number) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rows = categories.map((category) => {
    const items = products.filter((p) => p.category_id === category.id || p.category?.slug === category.slug);
    const selling = items.filter((p) => p.is_active !== false).length;
    const status = category.is_active === false ? 'hidden' : selling > 0 ? 'visible' : 'waiting';
    return { category, total: items.length, selling, status };
  });
  const filtered = rows.filter(({ category, status }) =>
    (filter === 'all' || filter === status) && `${category.name} ${category.slug}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
  ).sort((a, b) => (a.category.sort_order ?? 0) - (b.category.sort_order ?? 0) || a.category.id - b.category.id);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const tabs = [
    { id: 'all', name: 'Tất cả', count: rows.length },
    { id: 'visible', name: 'Đang hiển thị', count: rows.filter((r) => r.status === 'visible').length },
    { id: 'waiting', name: 'Chưa mở bán', count: rows.filter((r) => r.status === 'waiting').length },
    { id: 'hidden', name: 'Đã tắt', count: rows.filter((r) => r.status === 'hidden').length },
  ];
  return (
    <section className="rounded-2xl border border-slate-700 bg-[#0c1320] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-bold text-white">Quản lý danh mục</h2><p className="mt-1 text-sm text-slate-400">Danh mục chỉ xuất hiện trên shop khi được bật và có ít nhất một sản phẩm đang bán.</p></div>
        <div className="flex gap-2"><button type="button" onClick={onCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Thêm danh mục</button><button type="button" onClick={onClose} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300">Đóng</button></div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc danh mục">
        {tabs.map((tab) => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => { setFilter(tab.id); setPage(1); }} className={`rounded-xl px-3 py-2 text-sm transition-colors ${filter === tab.id ? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{tab.name} <span className="ml-2 font-mono text-xs">{tab.count}</span></button>)}
      </div>
      <input aria-label="Tìm danh mục" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc đường dẫn danh mục…" className="w-full sm:max-w-md rounded-xl border border-slate-700 bg-[#070d17] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" />
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-900 text-xs text-slate-400"><tr>{['Danh mục', 'Sản phẩm', 'Hiển thị trên shop', 'Thứ tự', 'Thao tác'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.slice((current - 1) * 10, current * 10).map(({ category: c, total, selling, status }) => <tr key={c.id} className="hover:bg-white/[0.025]">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl"><CategoryArtwork icon={c.icon} /></span><div><div className="font-semibold text-white">{c.name}</div><div className="mt-1 text-xs text-slate-400 font-mono">/{c.slug}</div></div></div></td>
              <td className="px-4 py-4"><div className="text-white">{total} sản phẩm</div><div className="mt-1 text-xs text-slate-400">{selling} đang bán · {total - selling} đang tắt</div></td>
              <td className="px-4 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-medium ${status === 'visible' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>{status === 'visible' ? '● Đang hiển thị' : status === 'hidden' ? 'Đã tắt danh mục' : 'Chưa có sản phẩm mở bán'}</span></td>
              <td className="px-4 py-4 font-mono text-slate-400">{c.sort_order ?? 0}</td>
              <td className="px-4 py-4"><div className="flex items-center gap-3 whitespace-nowrap"><button type="button" onClick={() => onProducts(c.id)} className="text-cyan-300 hover:underline">Xem sản phẩm</button><button type="button" onClick={() => onEdit(c)} className="text-slate-200 hover:underline">Sửa</button><button type="button" onClick={() => onDelete(c.id, c.name)} disabled={total > 0} title={total > 0 ? 'Chuyển hoặc xóa sản phẩm trước khi xóa danh mục' : 'Xóa danh mục'} className="text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed">Xóa</button></div></td>
            </tr>)}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Không có danh mục phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400"><span>{filtered.length} danh mục · Trang {current}/{pages}</span><div className="flex gap-2"><button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-30">Trước</button><button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-30">Sau</button></div></div>
    </section>
  );
}
