import { Category, LiveStats, OrderDetails, Product } from './types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

// Dữ liệu fallback dự phòng cho Static Pre-rendering khi build
export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Valorant',
    slug: 'valorant',
    description: 'Tài khoản Valorant rank Iron đến Radiant, đầy đủ gói Thường và Chủ Off.',
    icon: '🎯',
    sort_order: 1,
    is_active: true,
    products_count: 20,
  },
  {
    id: 2,
    name: 'CS:GO 2',
    slug: 'cs2',
    description: 'Tài khoản CS2 Prime chơi được Rank, bao sạch 100%.',
    icon: '⚡',
    sort_order: 2,
    is_active: true,
    products_count: 1,
  },
  {
    id: 3,
    name: 'Steam',
    slug: 'steam',
    description: 'Tài khoản Steam theo số lượng game (Tier 1, Tier 2, Tier 3).',
    icon: '🎮',
    sort_order: 3,
    is_active: true,
    products_count: 3,
  },
  {
    id: 4,
    name: 'PUBG',
    slug: 'pubg',
    description: 'Tài khoản PUBG Plus chơi Rank thoải mái.',
    icon: '🪂',
    sort_order: 4,
    is_active: true,
    products_count: 1,
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    category_id: 1,
    name: 'Acc Valorant Unranked',
    slug: 'acc-valorant-unranked',
    account_type: 'valo_unranked',
    price: 10000,
    warranty_hours: 2,
    is_auto_warranty: true,
    is_off_mode: false,
    short_description: 'Tài khoản Valorant Unranked sạch, giao tự động 24/7.',
    badges: ['Bán Chạy', 'Giao Tự Động'],
    is_active: true,
    available_stock: 5,
  },
  {
    id: 5,
    category_id: 1,
    name: 'Acc Valorant Gold',
    slug: 'acc-valorant-gold',
    account_type: 'valo_gold',
    price: 20000,
    warranty_hours: 2,
    is_auto_warranty: true,
    is_off_mode: false,
    short_description: 'Tài khoản Valorant rank Gold, bảo hành 2 giờ.',
    badges: ['Phổ Biến', 'Rank Vàng'],
    is_active: true,
    available_stock: 1,
  },
  {
    id: 6,
    category_id: 1,
    name: 'Acc Valorant Platinum',
    slug: 'acc-valorant-platinum',
    account_type: 'valo_platinum',
    price: 25000,
    warranty_hours: 2,
    is_auto_warranty: true,
    is_off_mode: false,
    short_description: 'Tài khoản Valorant rank Platinum chiến rank cực mượt.',
    badges: ['Rank Plat', 'Giao Ngay'],
    is_active: true,
    available_stock: 2,
  },
  {
    id: 7,
    category_id: 1,
    name: 'Acc Valorant Diamond',
    slug: 'acc-valorant-diamond',
    account_type: 'valo_diamond',
    price: 35000,
    warranty_hours: 2,
    is_auto_warranty: true,
    is_off_mode: false,
    short_description: 'Tài khoản Valorant rank Diamond cao thủ.',
    badges: ['Kim Cương', 'Hot'],
    is_active: true,
    available_stock: 1,
  },
  {
    id: 11,
    category_id: 1,
    name: 'Acc Valorant Gold (Chủ Off)',
    slug: 'acc-valorant-gold-chu-off',
    account_type: 'valo_gold_off',
    price: 40000,
    warranty_hours: 5,
    is_auto_warranty: true,
    is_off_mode: true,
    short_description: 'Tài khoản Valorant rank Gold chế độ Chủ Off, bảo hành 5 tiếng.',
    badges: ['Chủ Off', 'Bảo Hành 5h'],
    is_active: true,
    available_stock: 0,
  },
  {
    id: 21,
    category_id: 2,
    name: 'Acc CSGO 2 Prime (Chơi được Rank)',
    slug: 'acc-csgo-2-prime-choi-duoc-rank',
    account_type: 'cs2_prime',
    price: 50000,
    warranty_hours: 2,
    is_auto_warranty: false,
    is_off_mode: false,
    short_description: 'Tài khoản CS2 Prime chuẩn rank, bảo hành check tay.',
    badges: ['CS2 Prime', 'Bảo Hành Tay'],
    is_active: true,
    available_stock: 0,
  },
  {
    id: 22,
    category_id: 3,
    name: 'Acc Steam (0 - 10 Games)',
    slug: 'acc-steam-0-10-games',
    account_type: 'steam_tier_1',
    price: 5000,
    warranty_hours: 2,
    is_auto_warranty: true,
    is_off_mode: false,
    short_description: 'Tài khoản Steam ngẫu nhiên 0 đến 10 game.',
    badges: ['Giá Rẻ', 'Steam'],
    is_active: true,
    available_stock: 0,
  },
  {
    id: 25,
    category_id: 4,
    name: 'Acc PUBG Plus (Chơi Rank)',
    slug: 'acc-pubg-plus-choi-rank',
    account_type: 'pubg_plus',
    price: 50000,
    warranty_hours: 2,
    is_auto_warranty: false,
    is_off_mode: false,
    short_description: 'Tài khoản PUBG Plus chơi rank, bảo hành check tay.',
    badges: ['PUBG Plus', 'Bảo Hành Tay'],
    is_active: true,
    available_stock: 0,
  },
];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_CATEGORIES;
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchCategoryWithProducts(slug: string): Promise<{
  category: Category;
  products: Product[];
} | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      const cat = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
      if (!cat) return null;
      const prods = FALLBACK_PRODUCTS.filter((p) => p.category_id === cat.id);
      return { category: cat, products: prods };
    }
    const json = await res.json();
    return json.data;
  } catch {
    const cat = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
    if (!cat) return null;
    const prods = FALLBACK_PRODUCTS.filter((p) => p.category_id === cat.id);
    return { category: cat, products: prods };
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_PRODUCTS;
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
    }
    const json = await res.json();
    return json.data;
  } catch {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

export async function fetchStoreStats(): Promise<LiveStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/store/stats`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return {
        total_orders: 128,
        total_revenue: 3450000,
        today_orders: 14,
        today_revenue: 420000,
        recent_sales: [
          { customer: 'H***', product_name: 'Acc Valorant Gold', amount: 20000, paid_at: '2 phút trước' },
          { customer: 'Q***', product_name: 'Acc Valorant Diamond', amount: 35000, paid_at: '8 phút trước' },
          { customer: 'T***', product_name: 'Acc Valorant Platinum', amount: 25000, paid_at: '15 phút trước' },
        ],
        live_viewers: 16,
        hearts_count: 284,
      };
    }
    const json = await res.json();
    return json.data;
  } catch {
    return {
      total_orders: 128,
      total_revenue: 3450000,
      today_orders: 14,
      today_revenue: 420000,
      recent_sales: [
        { customer: 'H***', product_name: 'Acc Valorant Gold', amount: 20000, paid_at: '2 phút trước' },
      ],
      live_viewers: 16,
      hearts_count: 284,
    };
  }
}
