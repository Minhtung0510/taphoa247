import React from 'react';

interface JsonLdProps {
  type: 'Organization' | 'WebSite' | 'Product' | 'BreadcrumbList' | 'FAQPage';
  data: Record<string, any>;
}

export function JsonLd({ type, data }: JsonLdProps) {
  let schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <JsonLd
      type="Organization"
      data={{
        name: 'TẠP HÓA 247 - Shop Bán Acc Game, Tài Khoản AI & Phần Mềm Tự Động 24/7',
        url: 'https://taphoa247.io.vn',
        logo: 'https://taphoa247.io.vn/logo.png',
        description:
          'Hệ thống bán tài khoản game Valorant, CS2 Prime, Steam, Tài khoản AI ChatGPT uy tín tự động 24/7 bằng mã VietQR TPBank. Bảo hành 1 đổi 1 tức thì.',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: '+84937809305',
          availableLanguage: ['Vietnamese'],
        },
        sameAs: [
          'https://t.me/taphoa247',
          'https://www.facebook.com/bill300213/',
        ],
      }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <JsonLd
      type="WebSite"
      data={{
        name: 'TẠP HÓA 247',
        url: 'https://taphoa247.io.vn',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://taphoa247.io.vn/tim-kiem?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}
