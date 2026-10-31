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
  metadataBase: new URL('https://taphoa247.io.vn'),
  title: {
    default: 'TẠP HÓA 247 - Shop Bán Acc Game, Tài Khoản AI & Phần Mềm Tự Động 24/7',
    template: '%s | Tạp Hóa 247',
  },
  description:
    'Shop bán tài khoản Discord & Token, CS2 Prime (NFA, No VAC), Cursor AI Pro, Gemini Antigravity tự động 24/7 qua VietQR TPBank. Nhận acc sau 3 giây, bảo hành 1 đổi 1 tức thì, uy tín số 1 Việt Nam.',
  keywords: [
    'tạp hóa 247',
    'taphoa247',
    'taphoa247.io.vn',
    'mua tài khoản discord',
    'discord token giá rẻ',
    'acc cs2 prime',
    'mua acc cs2 không vac',
    'cursor ai pro bản quyền',
    'gemini antigravity slot',
    'mua acc game tự động 247',
    'shop bán tài khoản số tự động',
    'google one 5tb gia re',
  ],
  authors: [{ name: 'Tạp Hóa 247 Team' }],
  alternates: {
    canonical: 'https://taphoa247.io.vn',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'TẠP HÓA 247 - Shop Bán Acc Game, Tài Khoản AI Tự Động 24/7',
    description:
      'Hệ thống bán tài khoản số tự động 24/7 qua mã VietQR TPBank. Nhận acc tức thì, bảo hành 1 đổi 1.',
    url: 'https://taphoa247.io.vn',
    siteName: 'Tạp Hóa 247',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: 'https://taphoa247.io.vn/logo.png',
        width: 800,
        height: 600,
        alt: 'TẠP HÓA 247 - Shop Bán Acc Game Tự Động',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TẠP HÓA 247 - Shop Bán Acc Game, Tài Khoản AI Tự Động 24/7',
    description:
      'Mua acc game tự động 24/7 qua VietQR TPBank. Nhận acc sau 3 giây, bảo hành 1 đổi 1 uy tín.',
    images: ['https://taphoa247.io.vn/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { AuthProvider } from '@/lib/AuthContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { AntiTamper } from '@/components/security/AntiTamper';
import { SideBanners } from '@/components/layout/SideBanners';
import { AiGamingMascot } from '@/components/mascot/AiGamingMascot';
import { API_BASE_URL } from '@/lib/api';

async function getInitialSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/store/settings`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch {
    // fallback
  }
  return null;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await getInitialSettings();

  return (
    <html lang="vi" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className="bg-[#050a14] text-[#e8edf5] antialiased min-h-screen flex flex-col font-sans">
        <AntiTamper />
        <SettingsProvider initialSettings={initialSettings}>
          <AuthProvider>
            <Navbar />
            <SideBanners />
            <main className="flex-1">{children}</main>
            <Footer />
            <AuthModal />
            <AiGamingMascot />
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
