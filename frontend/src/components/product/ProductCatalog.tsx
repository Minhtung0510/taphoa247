'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Category, Product } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
}

function getCategoryEmoji(icon?: string, slug?: string): string {
  if (slug === 'discord' || icon?.includes('discord') || icon?.includes('chat')) return '💬';
  if (slug === 'cs2' || slug === 'csgo' || icon?.includes('cs2') || icon?.includes('csgo') || icon?.includes('fire')) return '🔫';
  if (icon?.includes('cursor')) return '💻';
  if (icon?.includes('sparkle')) return '✨';
  if (icon?.includes('cpu') || icon?.includes('chip')) return '⚡';
  if (icon?.includes('cloud')) return '☁️';
  if (icon?.includes('paint') || icon?.includes('brush')) return '🎨';
  if (icon?.includes('video') || icon?.includes('camera')) return '🎬';
  if (icon?.includes('valorant')) return '🎯';
  if (!icon || icon.includes('/') || icon.includes('.')) return '📦';
  return icon;
}

const categoryLogoMap: Record<string, string> = {
  'discord':            '/logos/discord-logo.png',
  'cs2':                '/logos/csgo2-logo.png',
  'csgo2':              '/logos/csgo2-logo.png',
  'cursor-ai':          '/images/products/cursor-logo.jpg',
  'gemini-antigravity': '/images/products/antigravity-logo.jpg',
  'api-sub-credits':    '/images/products/apisub-logo.jpg',
  'google-one':         '/images/products/google-one-logo.png',
  'muse-ai':            '/images/products/muse-logo.jpg',
  'video-ai-tools':     '/images/products/video-ai-tools-logo.jpg',
  'valorant':           '/images/products/valorant.png',
};

export function ProductCatalog({ products: initialProducts, categories: initialCategories }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'off_mode' | 'normal' | 'in_stock'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Đồng bộ khi props thay đổi từ Server SSR
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Lắng nghe URL params & hash để cuộn và lọc danh mục tự động
  useEffect(() => {
    const handleUrlSync = () => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const cat = url.searchParams.get('cat') || url.searchParams.get('category');
      const q = url.searchParams.get('q');
      const hash = window.location.hash;

      if (cat) {
        setSelectedCategory(cat.toLowerCase());
      }
      if (q) {
        setSearchQuery(q);
      }
      if (hash === '#products' || hash === '#kho-hang') {
        const el = document.getElementById('products') || document.getElementById('kho-hang');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, []);

  // Cơ chế Auto-Sync tồn kho mỗi 30s với debounce chống spam request khi focus/đổi tab
  useEffect(() => {
    let isMounted = true;
    let lastSyncTime = 0;

    const syncLiveCatalog = async () => {
      if (document.hidden) return;
      const now = Date.now();
      // Chống spam: Nếu vừa gọi API trong vòng 25s thì không gọi lại
      if (now - lastSyncTime < 25000) return;
      lastSyncTime = now;

      try {
        const pRes = await fetch(`${API_BASE_URL}/products`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          if (isMounted && pJson.success && Array.isArray(pJson.data)) {
            setProducts(pJson.data);
          }
        }
      } catch {
        // bỏ qua nếu mất mạng chớp nhoáng
      }
    };

    // 1. Chu kỳ 45 giây tự động làm mới tồn kho & giá
    const interval = setInterval(syncLiveCatalog, 45000);

    // 2. Tự động kiểm tra khi quay lại tab nếu đã quá 25s
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLiveCatalog();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      const slug = p.category?.slug || 'valorant';
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  const hasOffModeProducts = useMemo(() => {
    return products.some((p) => p.is_off_mode);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const pSlug = p.category?.slug?.toLowerCase() || '';
        if (selectedCategory === 'ai' || selectedCategory === 'tai-khoan-ai') {
          if (!pSlug.includes('ai') && !pSlug.includes('cursor') && !pSlug.includes('gemini')) return false;
        } else if (pSlug !== selectedCategory) {
          return false;
        }
      }

      // Package type filter
      if (selectedFilter === 'off_mode' && !p.is_off_mode) return false;
      if (selectedFilter === 'normal' && p.is_off_mode) return false;
      if (selectedFilter === 'in_stock' && (p.available_stock ?? 0) <= 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = (p.short_description || '').toLowerCase().includes(query);
        const matchType = (p.account_type || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchType) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── Category Tab Switcher ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#00e5a0] text-[#050a14] shadow-lg shadow-[#00e5a0]/20 font-black scale-105'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40'
          }`}
        >
          <span>🔥</span>
          <span>Tất Cả Sản Phẩm</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              selectedCategory === 'all' ? 'bg-[#050a14]/20 text-[#050a14]' : 'bg-slate-700/60 text-slate-400'
            }`}
          >
            {categoryCounts.all || 0}
          </span>
        </button>

        {categories
          .filter((cat) => (categoryCounts[cat.slug] || 0) > 0)
          .map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const logoSrc = categoryLogoMap[cat.slug] || (cat.icon?.startsWith('/') ? cat.icon : undefined);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] shadow-lg shadow-[#00e5a0]/20 font-black scale-105'
                    : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40'
                }`}
              >
                {logoSrc ? (
                  <div className="w-5 h-5 rounded-md bg-[#0a0f1d] border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                    <img
                      src={logoSrc}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain rounded-[3px]"
                    />
                  </div>
                ) : (
                  <span>{getCategoryEmoji(cat.icon, cat.slug)}</span>
                )}
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none ${
                      isSelected ? 'bg-[#050a14]/20 text-[#050a14]' : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* ─── Search Bar & Sub-Filters Row ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên rank, loại acc (Gold, Diamond, CS2...)"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#00e5a0] focus:ring-1 focus:ring-[#00e5a0] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/30'
            }`}
          >
            Tất cả
          </button>
          {hasOffModeProducts && (
            <button
              onClick={() => setSelectedFilter('off_mode')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'off_mode'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300/80 hover:text-purple-200 bg-purple-950/30 border border-purple-800/30'
              }`}
            >
              🛡️ Gói Chủ Off (5H)
            </button>
          )}
          {hasOffModeProducts && (
            <button
              onClick={() => setSelectedFilter('normal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'normal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300/80 hover:text-emerald-200 bg-emerald-950/30 border border-emerald-800/30'
              }`}
            >
              ⚡ Gói Thường (2H)
            </button>
          )}
          <button
            onClick={() => setSelectedFilter('in_stock')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'in_stock'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/30'
            }`}
          >
            🟢 Còn Hàng
          </button>
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-base font-bold text-white">Không tìm thấy tài khoản phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục tài khoản sẵn có.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-[#00e5a0] hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Xóa Toàn Bộ Bộ Lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
