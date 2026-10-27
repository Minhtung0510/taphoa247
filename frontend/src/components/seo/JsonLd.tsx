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
        name: 'DTFF SHOP - Shop Bán Acc Game Tự Động',
        url: 'https://dtffshop.com',
        logo: 'https://dtffshop.com/logo.png',
        description:
          'Hệ thống bán tài khoản game Valorant, CS:GO 2, Steam, PUBG uy tín tự động 24/7 bằng mã VietQR MBBank. Bảo hành 1 đổi 1 tức thì.',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+84-900-000-000',
          contactType: 'customer service',
          availableLanguage: ['Vietnamese'],
        },
      }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <JsonLd
      type="WebSite"
      data={{
        name: 'DTFF SHOP',
        url: 'https://dtffshop.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://dtffshop.com/tim-kiem?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}
