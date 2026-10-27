import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/JsonLd';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dtffshop.com'),
  title: {
    default: 'DTFF SHOP - Shop Bán Acc Game Valorant, CS2, Steam Tự Động 24/7',
    template: '%s | DTFF SHOP',
  },
  description:
    'Shop bán tài khoản game Valorant rank Iron đến Radiant, CS2 Prime, Steam tự động 24/7 qua VietQR MBBank. Bảo hành 1 đổi 1 tức thì, uy tín số 1 Việt Nam.',
  keywords: [
    'shop bán acc valorant',
    'acc valorant giá rẻ',
    'acc cs2 prime',
    'acc steam random',
    'mua acc valorant tự động',
    'acc valorant chủ off',
    'dtff shop',
  ],
  authors: [{ name: 'DTFF SHOP Team' }],
  openGraph: {
    title: 'DTFF SHOP - Shop Bán Acc Game Valorant, CS2 Tự Động 24/7',
    description:
      'Hệ thống bán tài khoản game tự động 24/7 qua mã VietQR MBBank. Nhận acc tức thì, bảo hành 1 đổi 1.',
    url: 'https://dtffshop.com',
    siteName: 'DTFF SHOP',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DTFF SHOP - Shop Bán Acc Game Valorant, CS2 Tự Động 24/7',
    description:
      'Mua acc game tự động 24/7 qua VietQR MBBank. Nhận acc sau 3 giây, bảo hành 1 đổi 1 uy tín.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
