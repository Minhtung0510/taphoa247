import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCategories, fetchCategoryWithProducts } from '@/lib/api';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductCard } from '@/components/product/ProductCard';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const data = await fetchCategoryWithProducts(slug);

  if (!data) {
    return {
      title: 'Danh Mục Game Không Tồn Tại',
      description: 'Không tìm thấy danh mục game yêu cầu tại Tạp Hóa 247.',
    };
  }

  const { category } = data;
  const title = `Mua Acc ${category.name} Tự Động Giá Rẻ 24/7`;
  const description = `Shop bán tài khoản ${category.name} tự động 24/7 qua VietQR TPBank. Nhận acc sau 3s, bảo hành 1 đổi 1 tức thì, tài khoản sạch bao ban.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://taphoa247.io.vn/${category.slug}`,
    },
    openGraph: {
      title: `${title} | Tạp Hóa 247`,
      description,
      url: `https://taphoa247.io.vn/${category.slug}`,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return [
    { category: 'valorant' },
    { category: 'cursor-ai' },
    { category: 'gemini-antigravity' },
    { category: 'api-sub-credits' },
    { category: 'google-one' },
    { category: 'muse-ai' },
    { category: 'video-ai-tools' },
    { category: 'discord' },
    { category: 'cs2' },
  ];
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const data = await fetchCategoryWithProducts(slug);

  if (!data) {
    notFound();
  }

  const { category, products } = data;

  const breadcrumbs = [
    { name: 'Trang Chủ', url: 'https://taphoa247.io.vn' },
    { name: category.name, url: `https://taphoa247.io.vn/${category.slug}` },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Schema */}
      <JsonLd
        type="BreadcrumbList"
        data={{
          itemListElement: breadcrumbs.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            item: b.url,
          })),
        }}
      />

      {/* Hero Header */}
      <div className="hero-bg border-b border-slate-800/30 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#00e5a0] transition-colors">Trang Chủ</Link>
            <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-semibold">{category.name}</span>
          </nav>

          {(() => {
            const logoMap: Record<string, string> = {
              'discord': '/logos/discord-logo.png',
              'cs2': '/logos/csgo2-logo.png',
              'cursor-ai': '/images/products/cursor-logo.jpg',
              'gemini-antigravity': '/images/products/antigravity-logo.jpg',
              'api-sub-credits': '/images/products/apisub-logo.jpg',
              'google-one': '/images/products/google-one-logo.png',
              'muse-ai': '/images/products/muse-logo.jpg',
              'video-ai-tools': '/images/products/video-ai-tools-logo.jpg',
              'valorant': '/images/products/valorant.png',
            };
            const logoSrc = logoMap[category.slug] || (category.icon?.startsWith('/') ? category.icon : undefined);

            return (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0a0f1d] border border-slate-700/60 p-2 flex items-center justify-center shadow-xl shrink-0">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={category.name}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <span className="text-3xl">{category.icon || '📦'}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    Kho Tài Khoản {category.name}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <div className="flex items-center justify-between">
          <div className="section-header">
            <h2 className="text-lg font-bold text-white">
              Danh Sách Gói Tài Khoản ({products.length} loại)
            </h2>
          </div>
          <span className="badge badge-stock text-[10px]">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            Cắt kho tự động
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} categorySlug={category.slug} />
          ))}
        </div>

        {/* Game Guide / SEO Content */}
        <section className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-gradient-to-b from-[#00e5a0] to-[#00c4ff]" />
            Hướng Dẫn Chọn Mua Tài Khoản {category.name}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Khi mua acc {category.name} tại hệ thống, bạn sẽ nhận được thông tin đăng nhập ngay sau khi chuyển khoản thành công.
            Đơn hàng được lưu trên hệ thống và bạn có thể kiểm tra danh sách acc bất cứ lúc nào qua trang Đơn Hàng.
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-[#00e5a0] mt-0.5">•</span>
              <span><span className="text-white font-semibold">Giao hàng tự động 24/7:</span> Nhận thông tin đăng nhập ngay sau khi chuyển khoản thành công.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c4ff] mt-0.5">•</span>
              <span><span className="text-white font-semibold">Bảo hành 1 đổi 1 tức thì:</span> Hỗ trợ đổi mới tự động nếu tài khoản phát sinh lỗi trong thời gian bảo hành.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#a855f7] mt-0.5">•</span>
              <span><span className="text-white font-semibold">Cam kết chính hãng:</span> Tài khoản hoạt động ổn định, bảo mật cao và an toàn tuyệt đối.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
