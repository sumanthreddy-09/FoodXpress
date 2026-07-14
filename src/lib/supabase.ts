import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  delivery_time_min: number;
  price_for_two: number;
  image_url: string | null;
  cover_url: string | null;
  location: string;
  promoted: boolean;
  discount: string | null;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  menu_category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  rating: number;
  bestseller: boolean;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_veg: boolean;
  image_url: string | null;
  restaurant_id: string;
};

export type Order = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  total: number;
  status: string;
  address: string;
  created_at: string;
  payment_mode?: string;
  payment_ref_number?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
  is_veg: boolean;
};
