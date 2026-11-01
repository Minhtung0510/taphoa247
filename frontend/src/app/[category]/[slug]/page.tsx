import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchProduct } from '@/lib/api';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductPurchaseSection } from '@/components/product/ProductPurchaseSection';

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: 'Sản Phẩm Không Tồn Tại',
      description: 'Không tìm thấy thông tin sản phẩm yêu cầu tại Tạp Hóa 247.',
    };
  }

  const title = `Mua ${product.name} Giá ${product.price.toLocaleString('vi-VN')}đ`;
  const description = `Mua ${product.name} giá chỉ ${product.price.toLocaleString('vi-VN')}đ tại Tạp Hóa 247. Tự động nhận acc qua VietQR TPBank sau 3 giây, bảo hành ${product.warranty_hours}h 1 đổi 1.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://taphoa247.io.vn/${product.category?.slug || 'valorant'}/${product.slug}`,
    },
    openGraph: {
      title: `${title} | Tạp Hóa 247`,
      description,
      url: `https://taphoa247.io.vn/${product.category?.slug || 'valorant'}/${product.slug}`,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return [
    { category: 'valorant', slug: 'tai-khoan-valorant' },
    { category: 'cursor-ai', slug: 'cursor-ai-pro-1-day-400' },
    { category: 'gemini-antigravity', slug: 'antigravity-pro-1month-slot' },
    { category: 'api-sub-credits', slug: 'api-sub-card-20' },
    { category: 'google-one', slug: 'google-one-5tb-1month' },
    { category: 'muse-ai', slug: 'muse-ai-1b-token' },
    { category: 'video-ai-tools', slug: 'digivideoviral-template' },
    { category: 'discord', slug: 'discord-token-only' },
    { category: 'discord', slug: 'discord-clone-verify-phone' },
    { category: 'discord', slug: 'discord-co-3-thang-full-mail' },
    { category: 'cs2', slug: 'cs2-prime-nfa-random' },
    { category: 'cs2', slug: 'cs2-prime-nfa-clean-khong-vac' },
  ];
}

function MarkdownViewer({ content }: { content: string }) {
  if (!content) return null;

  // Chuẩn hóa mọi dòng gạch ngang dài (như -------...) thành ký hiệu phân đoạn chuẩn ---
  const normalized = content.replace(/\n\s*[-=_*]{3,}\s*\n/g, '\n---\n');
  const sections = normalized.split(/\n\s*---\s*\n/);

  return (
    <div className="space-y-6 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]">
      {sections.map((section, sIdx) => {
        const rawLines = section.split('\n').map((l) => l.trim()).filter(Boolean);
        return (
          <div key={sIdx} className="space-y-3 max-w-full break-words [overflow-wrap:anywhere]">
            {rawLines.map((line, lIdx) => {
              // Bắt các dòng gạch ngang dài chống vỡ khung giao diện
              if (/^[-=_*]{3,}$/.test(line)) {
                return (
                  <div
                    key={lIdx}
                    className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-4"
                  />
                );
              }

              const imageMatch = line.match(/^!\[([^\]]*)\]\((\/images\/[^\s)]+)\)$/);
              if (imageMatch) {
                return (
                  <figure key={lIdx} className="my-5">
                    <a href={imageMatch[2]} target="_blank" rel="noopener noreferrer" aria-label="Mở ảnh hướng dẫn kích thước đầy đủ">
                      <img
                        src={imageMatch[2]}
                        alt={imageMatch[1] || 'Hướng dẫn sử dụng sản phẩm'}
                        loading="lazy"
                        decoding="async"
                        className="mx-auto h-auto w-full max-w-5xl cursor-zoom-in rounded-xl border border-slate-700/70 transition hover:border-cyan-400"
                      />
                    </a>
                  </figure>
                );
              }

              if (line.startsWith('### ') || line.startsWith('## ')) {
                const heading = line.replace(/^#{2,3}\s+/, '');
                return (
                  <h3
                    key={lIdx}
                    className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight pt-2 border-b border-slate-800/80 pb-2 mb-3 break-words"
                  >
                    {heading}
                  </h3>
                );
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                const item = line.substring(2);
                const parts = item.split(/(\*\*.*?\*\*)/g);
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 text-slate-300 text-sm sm:text-[14.5px] leading-relaxed pl-1 break-words">
                    <span className="text-[#3ddc97] mt-1 text-[11px] select-none font-bold shrink-0">◆</span>
                    <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                      {parts.map((p, pIdx) => {
                        if (p.startsWith('**') && p.endsWith('**')) {
                          return (
                            <strong key={pIdx} className="text-white font-bold">
                              {p.slice(2, -2)}
                            </strong>
                          );
                        }
                        return <span key={pIdx}>{p}</span>;
                      })}
                    </div>
                  </div>
                );
              }

              // Xử lý các đường link URL dài chống tràn chữ ra khỏi card
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              if (urlRegex.test(line)) {
                const parts = line.split(urlRegex);
                return (
                  <p key={lIdx} className="text-slate-300 text-sm sm:text-[15px] leading-relaxed break-words [overflow-wrap:anywhere]">
                    {parts.map((part, pIdx) => {
                      if (/^https?:\/\//.test(part)) {
                        return (
                          <a
                            key={pIdx}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00c4ff] underline hover:text-[#00e5a0] transition-colors break-all font-mono text-xs inline-block max-w-full"
                          >
                            {part}
                          </a>
                        );
                      }
                      return <span key={pIdx}>{part}</span>;
                    })}
                  </p>
                );
              }

              return (
                <p key={lIdx} className="text-slate-300 text-sm sm:text-[15px] leading-relaxed break-words [overflow-wrap:anywhere]">
                  {line}
                </p>
              );
            })}
            {sIdx < sections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent my-5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { category: catSlug, slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const isOutOfStock = (product.available_stock ?? 0) <= 0;
  const isCustomOrder =
    Boolean(product.account_type?.includes('custom')) ||
    Boolean(product.badges?.includes('Đặt Hàng Riêng')) ||
    product.name.toLowerCase().includes('nâng cấp') ||
    product.name.toLowerCase().includes('chính chủ') ||
    product.name.toLowerCase().includes('bàn giao email');

  const breadcrumbs = [
    { name: 'Trang Chủ', url: 'https://taphoa247.io.vn' },
    { name: product.category?.name || 'Sản phẩm', url: `https://taphoa247.io.vn/${catSlug}` },
    { name: product.name, url: `https://taphoa247.io.vn/${catSlug}/${product.slug}` },
  ];

  return (
    <div className="min-h-screen">
      {/* Product + Offer Schema */}
      <JsonLd
        type="Product"
        data={{
          name: product.name,
          description: product.short_description || `Mua ${product.name} tự động 24/7.`,
          sku: product.account_type,
          offers: {
            '@type': 'Offer',
            url: `https://taphoa247.io.vn/${catSlug}/${product.slug}`,
            priceCurrency: 'VND',
            price: product.price,
            availability: isOutOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'Tạp Hóa 247',
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#00e5a0] transition-colors">Trang Chủ</Link>
          <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/${catSlug}`} className="hover:text-[#00e5a0] transition-colors">
            {product.category?.name || 'Danh mục'}
          </Link>
          <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white font-semibold line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Info */}
          <div className="lg:col-span-7 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCustomOrder ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                {isCustomOrder ? '✍️ Đặt Hàng Riêng' : '⚡ Giao Hàng Ngay 3s'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isOutOfStock ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'}`}>
                {isOutOfStock ? 'Tạm hết hàng' : isCustomOrder ? 'Sẵn sàng nhận đơn' : `Còn ${product.available_stock} tài khoản`}
              </span>
              {product.badges && Array.isArray(product.badges) && product.badges.map((b: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {b}
                </span>
              ))}
            </div>

            {/* Product Hero Header with Logo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#171b25] to-[#12151c] border border-[#232834] shadow-xl">
              {product.image_url ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-700/60 p-2.5 flex-shrink-0 shadow-2xl flex items-center justify-center">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-700/60 p-2.5 flex-shrink-0 shadow-2xl flex items-center justify-center">
                  <img
                    src={catSlug.includes('discord') ? '/logos/discord-logo.png' : '/logos/csgo2-logo.png'}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  {product.name}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {product.short_description}
                </p>
              </div>
            </div>

            {/* Full Details Markdown */}
            {product.details_markdown ? (
              <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4 border border-[#232834] overflow-hidden break-words [overflow-wrap:anywhere]">
                <MarkdownViewer content={product.details_markdown} />
              </div>
            ) : null}

            {/* Official Warranty & Usage Policy Callout */}
            <div className="glass-card rounded-2xl p-6 sm:p-7 border-[#232834] bg-gradient-to-br from-[#141926] to-[#0f121a] space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Chính Sách Bảo Hành & Quy Định Sử Dụng
                  </h3>
                </div>
                <Link
                  href="/chinh-sach-bao-hanh"
                  className="text-xs text-[#3ddc97] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Xem đầy đủ</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="space-y-3 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {catSlug === 'cursor-ai' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Thời hạn bảo hành:</b> Bảo hành theo đúng thời hạn gói đăng ký (1 ngày, 3 ngày, 7 ngày, 30 ngày). Cam kết key kích hoạt Extension hoạt động liên tục, đủ request.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                      <span><b>Quy định chống khóa (block):</b> Hệ thống tự động phát hiện và khóa nếu đăng nhập cùng lúc nhiều máy. Bắt buộc <b>Logout máy cũ trước khi Login máy mới</b>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-rose-400 mt-0.5 font-bold">✕</span>
                      <span><b>Chính sách đổi trả:</b> Sản phẩm kỹ thuật số bàn giao tự động, không chấp nhận đổi trả hay hoàn tiền sau khi thông tin bàn giao đã được cung cấp.</span>
                    </div>
                  </>
                ) : catSlug === 'gemini-antigravity' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Thời hạn bảo hành:</b> Gói Slot chính chủ bảo hành <b>FULL 100% thời gian gói</b> (1 tháng, 4 tháng, 1 năm). Gói Admin cấp sẵn bảo hành 1 - 2 tháng theo gói.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                      <span><b>Quy định Family Group:</b> Không dùng vượt Credit làm ảnh hưởng gia đình (sẽ bị kick và không hoàn tiền). Xóa phương thức thanh toán trong Google Wallet sau khi kích hoạt để tránh tự gia hạn.</span>
                    </div>
                  </>
                ) : catSlug === 'google-one' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Thời hạn bảo hành:</b> Bảo hành <b>FULL 100% thời hạn đăng ký</b> (1, 3, 4, 6, 12 tháng). Cam kết chuẩn 5TB lưu trữ cho Google Drive, Photos, Gmail.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-400 mt-0.5 font-bold">⚠️</span>
                      <span><b>Lưu ý:</b> Khách hàng không tự ý thoát nhóm Family hoặc đổi vùng quốc gia tài khoản trong thời gian sử dụng gói.</span>
                    </div>
                  </>
                ) : catSlug === 'api-sub-credits' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Thời hạn sử dụng:</b> <b>Không giới hạn thời gian (No Time Limit)</b>. Dùng đến khi hết hạn mức credits.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Bảo hành mã thẻ:</b> Đảm bảo nạp thành công 100% vào tài khoản cổng API Sub Credits tại thời điểm bàn giao.</span>
                    </div>
                  </>
                ) : catSlug === 'muse-ai' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Chế độ bảo hành:</b> Bảo hành <b>24 giờ</b> tính từ lúc nhận tài khoản. Đổi mới 1-1 ngay lập tức nếu sai mật khẩu hoặc lỗi cấp token ban đầu.</span>
                    </div>
                  </>
                ) : catSlug === 'video-ai-tools' ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Cam kết bàn giao:</b> Mã nguồn ZIP, templates, tài liệu và video hướng dẫn chi tiết. Link tải Drive lưu trữ vĩnh viễn, cập nhật trọn đời cho bộ kit. Không hoàn tiền sau khi đã tải file.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#3ddc97] mt-0.5 font-bold">✓</span>
                      <span><b>Thời hạn bảo hành:</b> Bảo hành 1 đổi 1 tự động 24/7 trong vòng {product.warranty_hours} giờ nếu tài khoản sai mật khẩu hoặc bị khóa trước khi mua.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Checkout Section with Dynamic Option Selector */}
          <div className="lg:col-span-5">
            <ProductPurchaseSection product={product} catSlug={catSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}
