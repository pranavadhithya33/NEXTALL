export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  amazon_url: string;
  original_price: number;
  our_price: number;
  prepaid_price: number;
  images: string[];
  specs: Record<string, string>;
  in_stock: boolean;
  rating: number;
  review_count: number;
  last_price_refresh: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  slug: string;
  name: string;
  quantity: number;
  original_price: number;
  our_price: number;
  prepaid_price: number;
  image: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
  items: OrderItem[];
  subtotal: number;
  payment_method: 'prepaid' | 'half_cod';
  final_amount: number;
  advance_amount?: number;
  remaining_amount?: number;
  savings_amount?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  lucide_icon: string;
  sort_order: number;
}
