import Link from 'next/link';
import { fetchCategories, fetchProducts, fetchStoreStats } from '@/lib/api';
import { HeroFeatureCard } from '@/components/home/HeroFeatureCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductCatalog } from '@/components/product/ProductCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [categories, products, stats] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
    fetchStoreStats(),
  ]);

  const faqData = [
    {
      question: 'Mua tài khoản game tại TẠP HÓA 247 nhận hàng như thế nào?',
      answer:
        'Sau khi quét mã VietQR TPBank và chuyển khoản đúng số tiền cùng nội dung, hệ thống AI sẽ tự động xác nhận và giao thông tin tài khoản (TK:MK) trực tiếp trên màn hình sau 3 giây. Bạn cũng có thể tải về file TXT hoặc xem lại bất cứ lúc nào.',
    },
    {
      question: 'Tài khoản Chủ Off là gì và khác gì so với tài khoản thường?',
      answer:
        'Tài khoản Chủ Off là dạng tài khoản mà chủ cũ đã ngưng online thời gian dài. Gói Chủ Off được bảo hành lên tới 5 tiếng (gấp 2.5 lần gói thường), tỉ lệ bị đè cực thấp, an tâm cày rank.',
    },
    {
      question: 'Chính sách bảo hành 1 đổi 1 tại TẠP HÓA 247 hoạt động ra sao?',
      answer:
        'Tất cả tài khoản đều được bảo hành 1 đổi 1 tự động trong 2 giờ (hoặc 5 giờ với gói Chủ Off). Nếu tài khoản có lỗi sai mật khẩu hoặc bị khóa, chỉ cần vào mục Bảo Hành và bấm yêu cầu, hệ thống sẽ tự động cấp acc mới bù ngay tức thì.',
    },
    {
      question: 'Tôi có cần tạo tài khoản trên web để mua hàng không?',
      answer:
        'Có! Để đảm bảo an toàn tuyệt đối cho tài khoản game của bạn, tự động lưu trữ thông tin đăng nhập trong lịch sử và kích hoạt chế độ bảo hành 1 đổi 1 tức thì, bạn cần đăng nhập tài khoản trước khi mua. Việc đăng ký rất nhanh gọn (chỉ 5 giây qua Email hoặc Discord).',
    },
  ];

  return (
    <div className="space-y-0">
      {/* FAQ Schema for SEO */}
      <JsonLd
        type="FAQPage"
        data={{
          mainEntity: faqData.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        }}
      />

      {/* ═══════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════ */}
      <section className="hero-bg relative overflow-hidden py-8 sm:py-20 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              {/* Live Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-bold text-[#00e5a0] shadow-md backdrop-blur-md">
                <span className="live-dot" />
                <span>Hệ Thống Sẵn Sàng 24/7</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-medium">{stats.total_orders.toLocaleString('vi-VN')}+ đơn hoàn tất</span>
              </div>

              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2] sm:leading-[1.15]">
                Shop Tài Khoản Game, AI, Discord & CS:GO 2{' '}
                <span className="gradient-text">Giá Tốt Nhất</span>
                <br />
                <span className="text-slate-300 font-bold text-xl sm:text-4xl lg:text-5xl">Bảo Hành 1 Đổi 1 Trọn Gói</span>
              </h1>

              <p className="text-slate-400 text-xs sm:text-base leading-relaxed max-w-xl">
                Cung cấp bản quyền <span className="text-white font-semibold">Tài Khoản AI (Cursor, Gemini, API Sub)</span>,{' '}
                <span className="text-white font-semibold">Valorant</span>,{' '}
                <span className="text-white font-semibold">Discord (Token, Clone)</span> và{' '}
                <span className="text-white font-semibold">CS:GO 2 Prime</span>. Nhận tài khoản tự động sau 3 giây.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] sm:text-xs text-slate-300">
                  <span className="text-[#00e5a0] font-black">⚡</span>
                  <span>Giao acc 3s</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] sm:text-xs text-slate-300">
                  <span className="text-[#00c4ff] font-black">🛡️</span>
                  <span>BH 1 đổi 1 tự động</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] sm:text-xs text-slate-300">
                  <span className="text-purple-400 font-black">💎</span>
                  <span>Chủ Off bảo hành 5h</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#kho-hang"
                  className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-2 !py-3 !px-6 w-full sm:w-auto"
                >
                  <span>🛒 Khám Phá Kho Acc</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <Link
                  href="/bao-hanh"
                  className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2 !py-3 !px-6 w-full sm:w-auto"
                >
                  <span>🛡️ Trung Tâm Bảo Hành</span>
                </Link>
              </div>
            </div>

            {/* Hero Right: Automated System Feature Card */}
            <div className="lg:col-span-5">
              <HeroFeatureCard totalOrders={stats.total_orders} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS & TRUST BANNER (HIGH CREDIBILITY)
         ═══════════════════════════════════════════ */}
      <section className="relative border-b border-slate-800/60 bg-gradient-to-r from-[#060b17] via-[#091224] to-[#060b17] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#00e5a0_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {/* Box 1: Đơn Hàng Thành Công */}
            <div className="rounded-2xl p-4 sm:p-5 bg-[#0a1122]/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all group shadow-lg shadow-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ✓ Verified
                </span>
                <span className="text-base group-hover:scale-110 transition-transform">🛍️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {(18650 + (stats.total_orders || 0)).toLocaleString('vi-VN')}+
              </div>
              <div className="text-xs font-bold text-slate-300 mt-1">Đơn hàng hoàn tất</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Đối soát tự động qua VietQR</div>
            </div>

            {/* Box 2: Khách Hàng Hài Lòng */}
            <div className="rounded-2xl p-4 sm:p-5 bg-[#0a1122]/90 border border-slate-800/80 hover:border-[#00e5a0]/40 transition-all group shadow-lg shadow-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5a0]/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00e5a0] bg-[#00e5a0]/10 px-2 py-0.5 rounded-full border border-[#00e5a0]/20">
                  ⭐ 4.9 / 5.0
                </span>
                <span className="text-base group-hover:scale-110 transition-transform">💎</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#00e5a0] tracking-tight">
                99.9%
              </div>
              <div className="text-xs font-bold text-white mt-1">Khách hàng hài lòng</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                <span className="text-amber-400">★★★★★</span>
                <span>8.650+ đánh giá</span>
              </div>
            </div>

            {/* Box 3: Tốc Độ Nhả Acc */}
            <div className="rounded-2xl p-4 sm:p-5 bg-[#0a1122]/90 border border-slate-800/80 hover:border-amber-500/40 transition-all group shadow-lg shadow-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ⚡ Siêu Tốc
                </span>
                <span className="text-base group-hover:scale-110 transition-transform">🚀</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                3 Giây
              </div>
              <div className="text-xs font-bold text-white mt-1">Tốc độ nhả acc & key</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Tự động 24/7 không chờ đợi</div>
            </div>

            {/* Box 4: Bảo Hành Tự Động */}
            <div className="rounded-2xl p-4 sm:p-5 bg-[#0a1122]/90 border border-slate-800/80 hover:border-indigo-500/40 transition-all group shadow-lg shadow-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  🛡️ 1 Đổi 1
                </span>
                <span className="text-base group-hover:scale-110 transition-transform">🔒</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-400 tracking-tight">
                100%
              </div>
              <div className="text-xs font-bold text-white mt-1">Bảo hành tự động</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Chủ Off bảo hiểm lên đến 5h</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES BANNER SECTION
         ═══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="section-header">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Danh Mục Bản Quyền Chính Hãng
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Lựa chọn danh mục dịch vụ bạn cần để xem toàn bộ danh sách gói tài khoản bản quyền
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const metaMap: Record<string, {
                logo: string;
                bgGrad: string;
                borderHover: string;
                badge: string;
                badgeColor: string;
                iconFallback: string;
              }> = {
                'discord': {
                  logo: '/logos/discord-logo.png',
                  bgGrad: 'from-indigo-600/25 via-purple-950/35 to-slate-900',
                  borderHover: 'hover:border-[#5865F2] hover:shadow-[0_0_30px_rgba(88,101,242,0.45)]',
                  badge: '💬 DISCORD BẢN QUYỀN',
                  badgeColor: 'bg-[#5865F2]/20 text-[#8ea1e1] border-[#5865F2]/40',
                  iconFallback: '💬',
                },
                'cs2': {
                  logo: '/logos/csgo2-logo.png',
                  bgGrad: 'from-amber-600/25 via-orange-950/35 to-slate-900',
                  borderHover: 'hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]',
                  badge: '🔫 CS:GO 2 PRIME NFA',
                  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  iconFallback: '🔫',
                },
                'cursor-ai': {
                  logo: '/images/products/cursor-logo.jpg',
                  bgGrad: 'from-sky-500/15 via-blue-950/20 to-slate-900',
                  borderHover: 'hover:border-sky-400/50',
                  badge: '💻 CURSOR PRO',
                  badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                  iconFallback: '💻',
                },
                'gemini-antigravity': {
                  logo: '/images/products/antigravity-logo.jpg',
                  bgGrad: 'from-pink-500/15 via-purple-950/20 to-slate-900',
                  borderHover: 'hover:border-pink-500/50',
                  badge: '✨ CHÍNH CHỦ & ADMIN',
                  badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
                  iconFallback: '✨',
                },
                'api-sub-credits': {
                  logo: '/images/products/apisub-logo.jpg',
                  bgGrad: 'from-emerald-500/15 via-teal-950/20 to-slate-900',
                  borderHover: 'hover:border-emerald-500/50',
                  badge: '⚡ API SUB CREDITS',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  iconFallback: '⚡',
                },
                'google-one': {
                  logo: '/images/products/google-one-logo.png',
                  bgGrad: 'from-blue-500/15 via-cyan-950/20 to-slate-900',
                  borderHover: 'hover:border-blue-400/50',
                  badge: '☁️ GOOGLE ONE 5TB',
                  badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  iconFallback: '☁️',
                },
                'muse-ai': {
                  logo: '/images/products/muse-logo.jpg',
                  bgGrad: 'from-amber-500/15 via-orange-950/20 to-slate-900',
                  borderHover: 'hover:border-amber-500/50',
                  badge: '🎨 TOKEN 1 TỶ',
                  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  iconFallback: '🎨',
                },
                'video-ai-tools': {
                  logo: '/images/products/video-ai-tools-logo.jpg',
                  bgGrad: 'from-purple-500/15 via-violet-950/20 to-slate-900',
                  borderHover: 'hover:border-purple-500/50',
                  badge: '🎬 AUTOMATION & AI KIT',
                  badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  iconFallback: '🎬',
                },
                'valorant': {
                  logo: '/images/products/valorant.png',
                  bgGrad: 'from-rose-500/15 via-red-950/20 to-slate-900',
                  borderHover: 'hover:border-rose-500/50',
                  badge: '🎯 GAME VALORANT',
                  badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  iconFallback: '🎯',
                },
              };

              const theme = metaMap[cat.slug] || {
                logo: '',
                bgGrad: 'from-emerald-500/15 via-teal-950/20 to-slate-900',
                borderHover: 'hover:border-emerald-500/50',
                badge: '🛡️ CHÍNH HÃNG',
                badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                iconFallback: '📦',
              };

              return (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className={`group relative rounded-2xl p-5 bg-gradient-to-br ${theme.bgGrad} border border-slate-800/80 ${theme.borderHover} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 overflow-hidden flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-[#0a0f1d] p-1.5 flex items-center justify-center shadow-lg shrink-0">
                        {theme.logo ? (
                          <img
                            src={theme.logo}
                            alt={cat.name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl">{theme.iconFallback}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${theme.badgeColor}`}>
                        {theme.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00e5a0] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs font-bold text-[#00e5a0]">
                    <span>Xem kho hàng</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MAIN PRODUCT CATALOG (STREAMLINED + TABS + FILTERS)
         ═══════════════════════════════════════════ */}
      <section id="products" className="py-12 sm:py-16 bg-[#060c18] border-y border-slate-800/40 scroll-mt-20">
        <div id="kho-hang" className="scroll-mt-24" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="section-header">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Kho Tài Khoản Sẵn Sàng Giao Ngay
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dữ liệu tồn kho tự động cập nhật thời gian thực theo từng giây
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00e5a0]">
              <span className="live-dot" />
              <span>Giao Tự Động 24/7</span>
            </div>
          </div>

          {/* Interactive Catalog Component */}
          <ProductCatalog products={products} categories={categories} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          RECENT PURCHASES TICKER
         ═══════════════════════════════════════════ */}
      {stats.recent_sales && stats.recent_sales.length > 0 && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-xl">🎉</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Đơn Hàng Vừa Giao Thành Công</h3>
                  <p className="text-[11px] text-slate-500">Cập nhật giao dịch thời gian thực từ cổng VietQR</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {stats.recent_sales.map((sale, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#050a14]/60 rounded-xl border border-slate-800/40 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block">{sale.paid_at}</span>
                      <div className="mt-0.5">
                        <span className="text-slate-300 font-semibold">{sale.customer}</span>
                        <span className="text-slate-500"> mua </span>
                        <span className="text-[#00e5a0] font-medium">{sale.product_name}</span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-slate-400 font-mono ml-2 whitespace-nowrap">
                      {sale.amount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          HOW IT WORKS (3 SIMPLE STEPS)
         ═══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Quy Trình Nhận Acc <span className="gradient-text">Sau 3 Giây</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Không cần chờ nhân viên duyệt tay — Hệ thống hoàn toàn tự động 24/7
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                icon: '🎯',
                title: 'Chọn Gói Tài Khoản',
                desc: 'Chọn game và cấp bậc rank ưng ý. Xem trực tiếp số lượng acc sẵn có trong kho.',
                accent: 'from-[#00e5a0]',
              },
              {
                step: '02',
                icon: '📱',
                title: 'Quét Mã VietQR',
                desc: 'Mở app ngân hàng quét mã QR động. Tiền vào chuẩn xác theo nội dung tự sinh.',
                accent: 'from-[#00c4ff]',
              },
              {
                step: '03',
                icon: '⚡',
                title: 'Nhận Acc Tức Thì',
                desc: 'AI xác nhận biến động số dư và giao TK:MK trên màn hình sau 3s. Kèm bảo hành 1:1.',
                accent: 'from-[#7c3aed]',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 relative group hover:border-slate-700/60 transition-all"
              >
                <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r ${item.accent} to-transparent opacity-60`} />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-black text-slate-500 font-mono">BƯỚC {item.step}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          GUIDE & SETUP TUTORIALS SECTION
         ═══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-[#070d1a] border-t border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="section-header">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 mb-2">
                <span>📖</span>
                <span>HƯỚNG DẪN KÍCH HOẠT NHANH</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cẩm Nang Cài Đặt & Sử Dụng Acc CS2 & Discord
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hướng dẫn chi tiết cách đăng nhập CS2 Prime qua Loader và cách sử dụng Token Discord, Discord Clone an toàn
              </p>
            </div>
            <Link
              href="/huong-dan"
              className="text-xs font-bold text-[#00e5a0] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Xem tất cả bài viết hướng dẫn</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Main Featured Card: CS2 Prime SteamLoader */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border-amber-500/30 bg-gradient-to-br from-[#1c150c] via-[#1f1910] to-[#0d0b07] relative overflow-hidden flex flex-col justify-between shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-black border border-amber-400/40 p-1 flex items-center justify-center">
                      <img src="/logos/csgo2-logo.png" alt="CS:GO 2" className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                        KHUYÊN ĐỌC KHI MUA KEY CS2
                      </span>
                      <h3 className="text-lg font-black text-white">Cách Đăng Nhập CS2 Prime Qua SteamLoader</h3>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Key Loader VIP
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Khi mua tài khoản CS2 Prime NFA tại shop, bạn nhận được mã Key bản quyền (<code className="text-amber-300 font-mono">CS2-XXXX-XXXX-XXXX</code>).
                  Đăng nhập cực nhanh chỉ trong 3 bước:
                </p>

                {/* 3 Steps Mini */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <b className="text-white">Tải SteamLoader CS2:</b> Tải trực tiếp file <a href="/downloads/SteamLoader.exe" download="SteamLoader.exe" className="text-amber-300 underline font-mono font-bold">SteamLoader.exe</a> (bản quyền sạch, không virus).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <b className="text-white">Nhập Mã Key Bản Quyền:</b> Mở ứng dụng SteamLoader, dán <code className="text-[#00e5a0] font-mono">Mã Key</code> (hoặc Mã đơn hàng) vừa nhận vào ô nhập rồi nhấn <b>Enter</b>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#00e5a0] text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <b className="text-white">Steam Tự Động Đăng Nhập:</b> Loader sẽ tự điền mật khẩu và bypass Guard để vào Steam, mở CS2 và vào chiến rank ngay lập tức!
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="/downloads/SteamLoader.exe"
                    download="SteamLoader.exe"
                    className="btn-primary text-xs !py-2.5 !px-5 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <span>📦 Tải Công Cụ SteamLoader Tại Đây ➔</span>
                  </a>
                  <Link
                    href="/huong-dan/cs2"
                    className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5 border-slate-700 hover:border-amber-400/50"
                  >
                    <span>📖 Cẩm Nang Chi Tiết</span>
                  </Link>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  🛡️ Bảo hành 1:1 trong 1 giờ
                </span>
              </div>
            </div>

            {/* Side 3 Quick Guide Cards: Discord Guides */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              <div
                className="glass-card rounded-2xl p-4 hover:border-slate-700 transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform">
                  <img src="/logos/discord-logo.png" alt="Discord" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 font-mono">DISCORD TOKEN</span>
                    <span className="text-[10px] text-slate-500">• 1 phút</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors mt-0.5">
                    Cách Sử Dụng Token Discord Thô Cho Tool & Bot
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Dán token trực tiếp vào cấu hình tool MMO, extension Discord Token Login hoặc mã nguồn Bot không cần mật khẩu.
                  </p>
                </div>
              </div>

              <div
                className="glass-card rounded-2xl p-4 hover:border-slate-700 transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  📱
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono">DISCORD CLONE PHONE</span>
                    <span className="text-[10px] text-slate-500">• 2 phút</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors mt-0.5">
                    Đăng Nhập Acc Đã Verify SĐT Tránh Checkpoint
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Sử dụng proxy riêng hoặc profile ẩn danh khi login nhiều acc để tránh bị Discord quét liên đới IP.
                  </p>
                </div>
              </div>

              <Link
                href="/huong-dan/cs2"
                className="glass-card rounded-2xl p-4 hover:border-amber-500/50 transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 font-mono">CS2 SẠCH NO VAC</span>
                    <span className="text-[10px] text-slate-500">• 1 phút</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors mt-0.5">
                    Kiểm Tra Tình Trạng VAC Ban & Bật CS2 Prime
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Acc được lọc tự động cam kết 100% không VAC ban, không game ban, thoải mái tìm trận rank Competitive và Premier.
                  </p>
                </div>
              </Link>
              <Link
                href="/chinh-sach-bao-hanh"
                className="glass-card rounded-2xl p-4 hover:border-slate-700 transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 font-mono">CHÍNH SÁCH BẢO HÀNH</span>
                    <span className="text-[10px] text-slate-500">• 1 Đổi 1</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00e5a0] transition-colors mt-0.5">
                    Hệ Thống Đổi Mới Tự Động 100% Khi Gặp Lỗi
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    Nếu tài khoản sai mật khẩu hoặc lỗi login trong thời gian bảo hành, vào mục Bảo Hành yêu cầu là nhận acc thay thế tức thì.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ SECTION
         ═══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-[#060c18] border-t border-slate-800/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-xs text-slate-400">
              Giải đáp mọi thắc mắc trước khi bạn xuống tiền mua tài khoản
            </p>
          </div>

          <div className="space-y-2.5">
            {faqData.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card rounded-xl p-4 sm:p-5 hover:border-slate-700/60 transition-colors"
              >
                <h3 className="text-sm font-bold text-white flex items-start gap-2.5">
                  <span className="gradient-text font-mono text-xs mt-0.5 shrink-0">Q{idx + 1}</span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5 ml-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
