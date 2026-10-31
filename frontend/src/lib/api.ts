import { Category, LiveStats, OrderDetails, Product } from './types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';



export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchCategoryWithProducts(slug: string): Promise<{
  category: Category;
  products: Product[];
} | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchStoreStats(): Promise<LiveStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/store/stats`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return {
        total_orders: 11,
        total_revenue: 160000,
        today_orders: 11,
        today_revenue: 160000,
        recent_sales: [],
        live_viewers: 1,
        hearts_count: 0,
      };
    }
    const json = await res.json();
    return json.data;
  } catch {
    return {
      total_orders: 11,
      total_revenue: 160000,
      today_orders: 11,
      today_revenue: 160000,
      recent_sales: [],
      live_viewers: 1,
      hearts_count: 0,
    };
  }
}

export async function sendStoreHeart(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/store/heart`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.hearts_count === 'number' ? json.hearts_count : null;
  } catch {
    return null;
  }
}
