export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  products_count?: number;
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
  is_active: boolean;
  available_stock?: number;
  category?: Category;
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
    rank?: string;
    peak_rank?: string;
    level?: number;
    skins_count?: number;
    knives?: string[];
    is_cs?: boolean;
  };
  warranty_expires_at?: string;
  is_warranty_valid?: boolean;
  remaining_seconds?: number;
  replacement_count?: number;
}

export interface OrderDetails {
  order_code: string;
  customer_name: string;
  total_amount: number;
  paid_at?: string;
  items_count: number;
  items: OrderItem[];
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
