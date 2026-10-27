import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchProduct } from '@/lib/api';
import { JsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: 'Sản Phẩm Không Tồn Tại',
      description: 'Không tìm thấy thông tin sản phẩm yêu cầu tại DTFF SHOP.',
    };
  }

  const title = `Mua ${product.name} Giá ${product.price.toLocaleString('vi-VN')}đ`;
  const description = `Mua ${product.name} giá chỉ ${product.price.toLocaleString('vi-VN')}đ tại DTFF SHOP. Tự động nhận acc qua VietQR MBBank sau 3 giây, bảo hành ${product.warranty_hours}h 1 đổi 1.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://dtffshop.com/${product.category?.slug || 'valorant'}/${product.slug}`,
    },
    openGraph: {
      title: `${title} | DTFF SHOP`,
      description,
      url: `https://dtffshop.com/${product.category?.slug || 'valorant'}/${product.slug}`,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return [
    { category: 'valorant', slug: 'acc-valorant-unranked' },
    { category: 'valorant', slug: 'acc-valorant-gold' },
    { category: 'valorant', slug: 'acc-valorant-platinum' },
    { category: 'valorant', slug: 'acc-valorant-diamond' },
    { category: 'valorant', slug: 'acc-valorant-gold-chu-off' },
    { category: 'cs2', slug: 'acc-csgo-2-prime-choi-duoc-rank' },
    { category: 'steam', slug: 'acc-steam-0-10-games' },
    { category: 'pubg', slug: 'acc-pubg-plus-choi-rank' },
  ];
}

export default async function ProductDetailPage({ params }: Props) {
  const { category: catSlug, slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const isOutOfStock = (product.available_stock ?? 0) <= 0;

  const breadcrumbs = [
    { name: 'Trang Chủ', url: 'https://dtffshop.com' },
    { name: product.category?.name || 'Valorant', url: `https://dtffshop.com/${catSlug}` },
    { name: product.name, url: `https://dtffshop.com/${catSlug}/${product.slug}` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Product + Offer Schema */}
      <JsonLd
        type="Product"
        data={{
          name: product.name,
          description: product.short_description || `Mua ${product.name} tự động 24/7.`,
          sku: product.account_type,
          offers: {
            '@type': 'Offer',
            url: `https://dtffshop.com/${catSlug}/${product.slug}`,
            priceCurrency: 'VND',
            price: product.price,
            availability: isOutOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'DTFF SHOP',
            },
          },
        }}
      />

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

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-emerald-400">Trang Chủ</Link>
        <span>/</span>
        <Link href={`/${catSlug}`} className="hover:text-emerald-400">{product.category?.name || 'Danh mục'}</Link>
        <span>/</span>
        <span className="text-white font-semibold line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Info */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {product.is_off_mode ? '🛡️ Chế Độ Chủ Off' : '⚡ Gói Thường'}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isOutOfStock
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isOutOfStock ? 'Tạm hết hàng' : `Còn ${product.available_stock} tài khoản`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
            {product.name}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            {product.short_description}
          </p>

          {/* Guarantees Box */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span>🛡️ Thời gian bảo hành: {product.warranty_hours} tiếng (1 đổi 1)</span>
            </div>
            <p>
              • {product.is_off_mode
                ? 'Tài khoản Chủ Off được theo dõi không online nhiều ngày. Tỉ lệ vào trùng cực thấp.'
                : 'Tài khoản thường thích hợp chơi trải nghiệm, leo rank nhanh.'}
            </p>
            <p>• Nhận thông tin tài khoản (TK:MK) ngay trên màn hình và hỗ trợ tải file TXT / HTML 3D kho đồ.</p>
          </div>
        </div>

        {/* Pricing & Checkout Card */}
        <div className="md:col-span-5">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-6 sticky top-24">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-mono">Giá thanh toán</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {product.price.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 border-y border-slate-800/80 py-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Giao hàng:</span>
                <span className="text-white font-semibold">Tự động qua VietQR MBBank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian nhận:</span>
                <span className="text-emerald-400 font-semibold font-mono">3 giây sau thanh toán</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hình thức bảo hành:</span>
                <span className="text-white font-semibold">Tự động 1 đổi 1</span>
              </div>
            </div>

            <Link
              href={`/checkout?product_id=${product.id}`}
              className={`w-full block py-3.5 text-center rounded-xl font-bold text-sm transition-all shadow-lg ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isOutOfStock ? 'Hết hàng tạm thời' : '🛒 Tạo Mã QR Mua Ngay'}
            </Link>

            <p className="text-[11px] text-slate-400 text-center">
              Khách có thể mua trực tiếp không cần đăng ký tài khoản.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
