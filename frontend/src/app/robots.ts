import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taphoa247.io.vn';

  return {
    rules: [
      {
        // Cho phép Google crawl tất cả trang công khai
        userAgent: '*',
        allow: '/',
        disallow: [

        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
