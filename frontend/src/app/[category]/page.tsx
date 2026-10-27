import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCategories, fetchCategoryWithProducts } from '@/lib/api';
import { JsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const data = await fetchCategoryWithProducts(slug);

  if (!data) {
    return {
      title: 'Danh Mục Game Không Tồn Tại',
      description: 'Không tìm thấy danh mục game yêu cầu tại DTFF SHOP.',
    };
  }

  const { category } = data;
  const title = `Mua Acc ${category.name} Tự Động Giá Rẻ 24/7`;
  const description = `Shop bán tài khoản ${category.name} tự động 24/7 qua VietQR MBBank. Nhận acc sau 3s, bảo hành 1 đổi 1 tức thì, tài khoản sạch bao ban.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://dtffshop.com/${category.slug}`,
    },
    openGraph: {
      title: `${title} | DTFF SHOP`,
      description,
      url: `https://dtffshop.com/${category.slug}`,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return [
    { category: 'valorant' },
    { category: 'cs2' },
    { category: 'steam' },
    { category: 'pubg' },
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
    { name: 'Trang Chủ', url: 'https://dtffshop.com' },
    { name: category.name, url: `https://dtffshop.com/${category.slug}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
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

      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-emerald-400">Trang Chủ</Link>
        <span>/</span>
        <span className="text-white font-semibold">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3 border-b border-slate-900 pb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Kho Tài Khoản {category.name} Tự Động 24/7
            </h1>
            <p className="text-sm text-slate-400 mt-1">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Danh Sách Gói Tài Khoản ({products.length} loại)
          </h2>
          <span className="text-xs text-emerald-400 font-mono">Cắt kho tự động qua VietQR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const isOutOfStock = (p.available_stock ?? 0) <= 0;
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between p-5 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {p.is_off_mode ? '🛡️ Chủ Off 5h' : '⚡ BH 2 Giờ'}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOutOfStock ? 'Hết hàng' : `Còn ${p.available_stock} acc`}
                    </span>
                  </div>

                  <Link href={`/${category.slug}/${p.slug}`} className="block">
                    <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2">{p.short_description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Giá bán</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {p.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <Link
                    href={`/checkout?product_id=${p.id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                    }`}
                  >
                    {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Specific Guide / SEO Content */}
      <section className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <h2 className="text-base sm:text-lg font-bold text-white">
          Hướng Dẫn Chọn Mua Tài Khoản {category.name} Tại DTFF SHOP
        </h2>
        <p>
          Khi mua acc {category.name} tại hệ thống, bạn sẽ nhận được thông tin đăng nhập ngay sau khi chuyển khoản thành công.
          Đơn hàng được lưu trên hệ thống và bạn có thể kiểm tra danh sách acc bất cứ lúc nào qua trang Đơn Hàng.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li><b>Gói Thường (Bảo hành 2 tiếng):</b> Thích hợp chơi thử rank, quẩy cùng bạn bè hoặc trải nghiệm skin súng.</li>
          <li><b>Gói Chủ Off (Bảo hành 5 tiếng):</b> Dành cho anh em muốn cày rank cố định, hạn chế tối đa nguy cơ bị đè tài khoản.</li>
          <li><b>Bảo hành tự động:</b> Nếu tài khoản sai mật khẩu hoặc bị khóa khi vừa nhận, gửi yêu cầu bảo hành là có acc mới ngay.</li>
        </ul>
      </section>
    </div>
  );
}
