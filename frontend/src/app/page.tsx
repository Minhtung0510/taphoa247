import React from 'react';
import Link from 'next/link';
import { fetchCategories, fetchProducts, fetchStoreStats } from '@/lib/api';
import { AiGamingMascot } from '@/components/mascot/AiGamingMascot';
import { JsonLd } from '@/components/seo/JsonLd';

export default async function HomePage() {
  const [categories, products, stats] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
    fetchStoreStats(),
  ]);

  // Lọc sản phẩm bán chạy hiển thị trang chủ
  const featuredProducts = products.slice(0, 8);

  const faqData = [
    {
      question: 'Mua tài khoản game tại DTFF SHOP nhận hàng như thế nào?',
      answer:
        'Sau khi bạn quét mã VietQR MBBank và chuyển khoản đúng số tiền cùng nội dung, hệ thống AI sẽ tự động kiểm tra biến động số dư và giao thông tin tài khoản (TK:MK) trực tiếp trên màn hình sau 3 giây. Bạn cũng có thể tải về file TXT hoặc file HTML 3D kho đồ.',
    },
    {
      question: 'Tài khoản Chủ Off là gì và khác gì so với tài khoản thường?',
      answer:
        'Tài khoản Chủ Off là dạng tài khoản mà chủ cũ đã không còn online trong thời gian dài (xác thực lịch sử trận đấu). Gói Chủ Off có thời hạn bảo hành lên tới 5 tiếng (gấp 2.5 lần gói thường), tỉ lệ bị đè cực thấp, thích hợp cho anh em cày rank dài hạn.',
    },
    {
      question: 'Chính sách bảo hành 1 đổi 1 tại DTFF SHOP hoạt động ra sao?',
      answer:
        'Tất cả tài khoản đều được bảo hành 1 đổi 1 tự động trong 2 giờ (hoặc 5 giờ với gói Chủ Off). Nếu tài khoản bị sai mật khẩu hoặc bị khóa, bạn chỉ cần vào mục Bảo Hành, chọn tài khoản và tải lên ảnh/video chụp màn hình lỗi. Hệ thống sẽ tự động cấp tài khoản bù mới ngay lập tức.',
    },
    {
      question: 'Tôi có cần tạo tài khoản trên web để mua hàng không?',
      answer:
        'Không cần thiết! Bạn có thể mua hàng trực tiếp với tư cách khách (Guest Checkout). Hệ thống sẽ cấp mã đơn hàng duy nhất để bạn có thể xem lại tài khoản và bảo hành bất kỳ lúc nào.',
    },
  ];

  return (
    <div className="space-y-16 py-8">
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HỆ THỐNG GIAO ACC TỰ ĐỘNG 24/7 QUA VIETQR MBBANK</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Shop Bán Acc Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Tự Động 24/7</span> Uy Tín #1
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Cung cấp tài khoản <b>Valorant</b> rank Iron đến Radiant, <b>CS:GO 2 Prime</b> và <b>Steam Random</b>. Quét mã QR chuyển khoản là hệ thống tự động giao acc trong 3 giây. Bảo hành 1 đổi 1 tức thì!
            </p>

            {/* Quick Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-900 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">⚡</span>
                <span>Nhận acc sau 3s qua VietQR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">🛡️</span>
                <span>Bảo hành 1 đổi 1 tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">💎</span>
                <span>Bao sạch, không tool hack</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/valorant"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/25 active:scale-95"
              >
                🛒 Xem Kho Acc Valorant
              </Link>
              <Link
                href="/bao-hanh"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all"
              >
                🛡️ Trung Tâm Bảo Hành
              </Link>
            </div>
          </div>

          {/* Hero Right: AI Mascot & Live Cashier Stream */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                TRỰC TIẾP TỪ PHÒNG THU NGÂN
              </span>
              <span>MBBank VietQR Auto</span>
            </div>
            <AiGamingMascot initialHearts={stats.hearts_count} liveViewers={stats.live_viewers} />
          </div>
        </div>
      </section>

      {/* Live Social Proof Stats Banner */}
      <section className="bg-slate-900/40 border-y border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total_orders.toLocaleString('vi-VN')}</div>
              <div className="text-xs text-slate-400 mt-1">Đơn hàng đã giao</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{(stats.total_revenue / 1000000).toFixed(1)}M+ đ</div>
              <div className="text-xs text-slate-400 mt-1">Doanh thu giao dịch</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">3 Giây</div>
              <div className="text-xs text-slate-400 mt-1">Tốc độ xuất acc tự động</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">Bảo hành 1 đổi 1 tức thì</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Danh Mục Game Nổi Bật</h2>
            <p className="text-sm text-slate-400">Chọn game để xem các gói rank và tùy chọn bảo hành tương ứng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="group p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Xem kho hàng</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Tài Khoản Game Sẵn Sàng Giao Ngay</h2>
            <p className="text-sm text-slate-400">Dữ liệu tồn kho cập nhật thời gian thực từ cơ sở dữ liệu</p>
          </div>
          <Link
            href="/valorant"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Xem toàn bộ bảng giá Valorant →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => {
            const isOutOfStock = (p.available_stock ?? 0) <= 0;
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between p-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl hover:border-slate-700 transition-all shadow-md group"
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
                      {isOutOfStock ? 'Tạm hết' : `Còn ${p.available_stock} acc`}
                    </span>
                  </div>

                  <Link href={`/${p.category?.slug || 'valorant'}/${p.slug}`} className="block">
                    <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2">{p.short_description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Giá mua nhanh</span>
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
      </section>

      {/* Recent Purchases Journal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎉</span>
            <h3 className="text-base font-bold text-white">Đơn Hàng Vừa Giao Gần Đây</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {stats.recent_sales.map((sale, idx) => (
              <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">{sale.paid_at}</span>
                  <b className="text-white">{sale.customer}</b> đã mua <span className="text-emerald-400">{sale.product_name}</span>
                </div>
                <span className="font-bold text-slate-300">{sale.amount.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Câu Hỏi Thường Gặp (FAQ)</h2>
          <p className="text-sm text-slate-400">Những thắc mắc phổ biến nhất khi mua tài khoản game tại DTFF SHOP</p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, idx) => (
            <div key={idx} className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">Q:</span>
                {faq.question}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-6">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
