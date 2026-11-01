import { MetadataRoute } from 'next';
import { fetchCategories, fetchProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taphoa247.io.vn';
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bao-hanh`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/huong-dan`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/huong-dan/cs2`,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/huong-dan/cursor-ai`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chinh-sach-bao-hanh`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lien-he`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/dieu-khoan`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    ...(cat.updated_at && !Number.isNaN(Date.parse(cat.updated_at))
      ? { lastModified: new Date(cat.updated_at) }
      : {}),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const productPages: MetadataRoute.Sitemap = (products || []).map((prod) => ({
    url: `${baseUrl}/${prod.category?.slug || 'valorant'}/${prod.slug}`,
    ...(prod.updated_at && !Number.isNaN(Date.parse(prod.updated_at))
      ? { lastModified: new Date(prod.updated_at) }
      : {}),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
