export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  products_count?: number;
  updated_at?: string;
}

export interface ProductOption {
  id: string | number;
  name: string;
  price: number;
  display_price?: string;
  is_available: boolean;
  stock_status?: string;
  stock_detail?: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  account_type: string;
  price: number;
  warranty_hours: number;
  is_auto_warranty: boolean;
  is_off_mode: boolean;
  short_description?: string;
  details_markdown?: string;
  badges?: string[];
  image_url?: string;
  options?: ProductOption[];
  is_active: boolean;
  available_stock?: number;
  category?: Category;
  updated_at?: string;
}

export interface OrderItem {
  order_item_id: number;
  position: number;
  product_name: string;
  category_name?: string;
  raw_credentials?: string;
  parsed?: {
    username: string;
    password?: string;
    riot_id?: string;
    region?: string;
    rank?: string;
    peak_rank?: string;
    level?: number;
    vp?: number;
    rp?: number;
    kc?: number;
    email_verified?: boolean;
    phone_verified?: boolean;
    last_game?: string;
    skins_count?: number;
    knives?: string[];
    weapons?: Array<{
      name: string;
      type: string;
      tier: string;
    }>;
    is_cs?: boolean;
    raw?: string;
  };
  warranty_expires_at?: string;
  is_warranty_valid?: boolean;
  remaining_seconds?: number;
  replacement_count?: number;
}

export interface OrderDetails {
  order_code: string;
  access_token?: string;
  customer_name: string;
  total_amount: number;
  paid_at?: string;
  items_count: number;
  items: OrderItem[];
  status?: string;
  is_paid?: boolean;
  is_expired?: boolean;
  is_cancelled?: boolean;
  memo?: string;
  qr_url?: string;
  bank_code?: string;
  account_no?: string;
  account_name?: string;
  remaining_seconds?: number;
}

export interface LiveStats {
  total_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
  recent_sales: Array<{
    customer: string;
    product_name: string;
    amount: number;
    paid_at: string;
  }>;
  live_viewers: number;
  hearts_count: number;
}
