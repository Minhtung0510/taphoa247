'use client';

import React, { useState } from 'react';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  category_id?: number;
  category?: Category;
  account_type?: string;
  available_stock?: number;
  warranty_hours?: number;
  is_off_mode?: boolean;
  is_active?: boolean;
  short_description?: string;
}

interface AdminProductsViewProps {
  products: Product[];
  categories: Category[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  isCategoryManagerOpen: boolean;
  setIsCategoryManagerOpen: (open: boolean) => void;
  openCreateProductModal: () => void;
  openEditProductModal: (p: Product) => void;
  openCreateCategoryModal: () => void;
  openEditCategoryModal: (c: Category) => void;
  handleDeleteCategory: (id: number, name: string) => void;
  handleDeleteProduct: (id: number, name: string) => void;
  handleQuickPriceUpdate: (id: number, newPrice: number) => void;
  handleToggleActive: (id: number, currentState: boolean) => void;
  onRefresh: () => void;
}

export function AdminProductsView({
  products,
  categories,
  productSearch,
  setProductSearch,
  isCategoryManagerOpen,
  setIsCategoryManagerOpen,
  openCreateProductModal,
  openEditProductModal,
  openCreateCategoryModal,
  openEditCategoryModal,
  handleDeleteCategory,
  handleDeleteProduct,
  handleQuickPriceUpdate,
  handleToggleActive,
  onRefresh,
}: AdminProductsViewProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // KPIs
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active !== false);
  const inStockProducts = products.filter((p) => (p.available_stock || 0) > 0);
  const outOfStockProducts = products.filter((p) => (p.available_stock || 0) === 0);

  // Filter & Search
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== 'all') {
      const catId = Number(selectedCategoryFilter);
      if (p.category_id !== catId && p.category?.id !== catId) return false;
    }
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.account_type?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  });

  const startEditPrice = (p: Product) => {
    setEditingPriceId(p.id);
    setTempPrice(p.price.toString());
  };

  const savePrice = (id: number) => {
    const val = parseInt(tempPrice, 10);
    if (!isNaN(val) && val >= 0) {
      handleQuickPriceUpdate(id, val);
    }
    setEditingPriceId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER & KPI METRICS
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng Sản Phẩm */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TỔNG SẢN PHẨM
            </span>
            <span className="text-lg">🏷️</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {totalProducts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Phân bổ trong {categories.length} danh mục
          </div>
        </div>

        {/* KPI 2: Đang Bán (Active) */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00e5a0] font-bold">
              ĐANG HIỂN THỊ BÁN
            </span>
            <span className="text-lg">🟢</span>
          </div>
          <div className="text-2xl font-black text-[#00e5a0] font-mono mt-2">
            {activeProducts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Sẵn sàng nhận thanh toán
          </div>
        </div>

        {/* KPI 3: Còn Hàng Trong Kho */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-5 shadow-lg group hover:border-[#334155] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00c4ff] font-bold">
              CÒN ACC TRONG KHO
            </span>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-2xl font-black text-[#00c4ff] font-mono mt-2">
            {inStockProducts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {inStockProducts.length > 0 ? `${inStockProducts.length} sản phẩm có sẵn tài khoản` : 'Kho đang trống'}
          </div>
        </div>

        {/* KPI 4: Hết Hàng (Cần nạp) */}
        <div className={`bg-[#0c1324] border rounded-2xl p-5 shadow-lg transition-all ${
          outOfStockProducts.length > 0 ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-[#1e293b]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              CẦN NẠP THÊM ACC
            </span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {outOfStockProducts.length}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {outOfStockProducts.length > 0 ? 'Tồn kho = 0, khách chưa thể mua' : 'Đã nạp đầy đủ'}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. ACTION TOOLBAR & SEARCH
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black shadow-md'
                : 'bg-[#050a14] text-slate-400 hover:text-white border border-[#1e293b]'
            }`}
          >
            Tất cả danh mục ({totalProducts})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id || p.category?.id === c.id).length;
            const isSelected = selectedCategoryFilter === c.id.toString();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id.toString())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#00e5a0] text-[#050a14] font-black shadow-md'
                    : 'bg-[#050a14] text-slate-400 hover:text-white border border-[#1e293b]'
                }`}
              >
                <span>{c.icon || '📁'}</span>
                <span>{c.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-black/20 text-[#050a14]' : 'bg-white/5 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <input
            type="text"
            placeholder="🔍 Tìm tên sản phẩm, rank..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="px-4 py-2 bg-[#050a14] border border-[#1e293b] text-white rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors w-44 sm:w-56"
          />

          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(!isCategoryManagerOpen)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
              isCategoryManagerOpen
                ? 'bg-amber-400 text-[#050a14] border-amber-400 shadow-md font-black'
                : 'bg-[#050a14] text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <span>📂</span>
            <span>Danh Mục ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateProductModal()}
            className="px-4 py-2 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 text-[#050a14] font-black rounded-xl text-xs transition-all shadow-lg shadow-[#00e5a0]/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. CATEGORY MANAGER DRAWER (IF OPEN)
         ══════════════════════════════════════════════════════════ */}
      {isCategoryManagerOpen && (
        <div className="bg-[#080d19] border border-amber-500/40 rounded-3xl p-5 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">📂</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Bảng Quản Lý Danh Mục Hệ Thống
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold font-mono">
                  {categories.length} danh mục
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Thêm danh mục mới, thay đổi icon, đường dẫn slug và thứ tự sắp xếp
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateCategoryModal()}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#050a14] font-black rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              + Tạo Danh Mục Mới
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1e293b]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0c1324] text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Danh Mục</th>
                  <th className="py-3 px-3">Slug</th>
                  <th className="py-3 px-3 text-center">Số SP</th>
                  <th className="py-3 px-3 text-center">Thứ tự</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] font-mono">
                {categories.map((c) => {
                  const prodCount = products.filter((p) => p.category_id === c.id || p.category?.slug === c.slug).length;
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-bold text-white font-sans">
                          <span className="text-base">{c.icon || '📦'}</span>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#050a14] border border-[#1e293b] text-[#00c4ff] text-[10px]">
                          /{c.slug}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#00e5a0]">
                        {prodCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {c.sort_order ?? 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.is_active !== false ? 'bg-[#00e5a0]/15 text-[#00e5a0]' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {c.is_active !== false ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(c)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. PRODUCTS TABLE WITH MODERN FINTECH CARDS
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#080d19] text-slate-400 border-b border-[#1e293b] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-4 px-4 font-bold">SẢN PHẨM & PHÂN LOẠI</th>
                <th className="py-4 px-4 font-bold text-amber-400">GIÁ BÁN NIÊM YẾT</th>
                <th className="py-4 px-4 font-bold text-center">TỒN KHO KHẢ DỤNG</th>
                <th className="py-4 px-4 font-bold text-center">BẢO HÀNH</th>
                <th className="py-4 px-4 font-bold text-center">TRẠNG THÁI</th>
                <th className="py-4 px-4 text-right font-bold">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500 font-sans">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.available_stock || 0;
                  const isStockEmpty = stock === 0;
                  const isStockLow = stock > 0 && stock <= 3;
                  const isActive = p.is_active !== false;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Name & Category */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs font-sans group-hover:text-[#00e5a0] transition-colors">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-[#050a14] border border-[#1e293b] text-[#00c4ff] text-[10px]">
                              {p.category?.name || 'Khác'}
                            </span>
                            {p.account_type && (
                              <span className="text-[10px] text-slate-400 font-sans">
                                • {p.account_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price with Quick Inline Edit */}
                      <td className="py-4 px-4">
                        {editingPriceId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-24 px-2 py-1 bg-[#050a14] border border-[#00e5a0] rounded-lg text-white font-mono text-xs outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => savePrice(p.id)}
                              className="px-2 py-1 bg-[#00e5a0] text-[#050a14] rounded-lg font-black text-[10px] cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditPrice(p)}
                            className="font-black text-amber-400 text-sm font-mono cursor-pointer hover:underline flex items-center gap-1.5"
                            title="Bấm để đổi giá nhanh"
                          >
                            <span>{p.price.toLocaleString('vi-VN')} đ</span>
                            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Counter with color pill */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold ${
                            isStockEmpty
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isStockLow
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isStockEmpty ? 'bg-rose-500' : isStockLow ? 'bg-amber-400' : 'bg-[#00e5a0]'
                            }`}
                          />
                          <span>{stock} acc</span>
                        </span>
                      </td>

                      {/* Warranty Hours */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-slate-300 text-xs font-mono">
                          {p.warranty_hours ?? 2} giờ
                        </span>
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#00e5a0]/15 text-[#00e5a0] hover:bg-[#00e5a0]/25 border border-[#00e5a0]/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {isActive ? '✓ Đang Bán' : 'Tạm Ẩn'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
