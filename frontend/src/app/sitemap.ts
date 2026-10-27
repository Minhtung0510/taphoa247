import { MetadataRoute } from 'next';
import { fetchCategories, fetchProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dtffshop.com';

  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bao-hanh`,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chinh-sach-bao-hanh`,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dieu-khoan`,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/lien-he`,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/huong-dan`,
      lastModified: new Date('2026-10-27T00:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: new Date('2026-10-27T00:00:00.000Z'),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((prod) => ({
    url: `${baseUrl}/${prod.category?.slug || 'valorant'}/${prod.slug}`,
    lastModified: new Date('2026-10-27T00:00:00.000Z'),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
