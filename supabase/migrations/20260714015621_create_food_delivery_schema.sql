/*
# Swiggy-style Food Delivery Schema

1. Overview
- Single-tenant demo app (no sign-in). All policies use `TO anon, authenticated`
  so the anon-key frontend can read restaurants/menus and create orders.
- Models restaurants, their menu categories + items, a client-side cart
  (persisted as orders), and order line items.

2. New Tables
- `categories` — top-level food categories shown on the home screen
  (Pizza, Biryani, Burgers, etc.) with an icon name and image.
- `restaurants` — restaurant listing with name, cuisine, rating, delivery
  time, price-for-two, image URL, and a location/city.
- `menu_categories` — sections within a restaurant's menu (e.g. "Recommended",
  "Main Course"). Belongs to a restaurant.
- `menu_items` — individual dishes belonging to a menu category / restaurant,
  with price, description, image, veg flag, and rating.
- `orders` — a placed order: restaurant id, total, status, delivery address
  text, and timestamps.
- `order_items` — line items for an order: menu item snapshot (name, price,
  qty), linked to the order.

3. Security
- RLS enabled on every table.
- All tables allow anon + authenticated CRUD because the app is intentionally
  public/shared (no sign-in screen).
*/

-- Top-level food categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.0,
  delivery_time_min int NOT NULL DEFAULT 30,
  price_for_two int NOT NULL DEFAULT 300,
  image_url text,
  cover_url text,
  location text NOT NULL DEFAULT 'Bangalore',
  promoted boolean NOT NULL DEFAULT false,
  discount text,
  created_at timestamptz DEFAULT now()
);

-- Menu categories within a restaurant
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price int NOT NULL,
  image_url text,
  is_veg boolean NOT NULL DEFAULT true,
  rating numeric(2,1) DEFAULT 4.0,
  bestseller boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL,
  total int NOT NULL,
  status text NOT NULL DEFAULT 'Placed',
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price int NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  is_veg boolean NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(menu_category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies: categories (public read, no writes needed from client)
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Policies: restaurants
DROP POLICY IF EXISTS "anon_read_restaurants" ON restaurants;
CREATE POLICY "anon_read_restaurants" ON restaurants FOR SELECT
  TO anon, authenticated USING (true);

-- Policies: menu_categories
DROP POLICY IF EXISTS "anon_read_menu_categories" ON menu_categories;
CREATE POLICY "anon_read_menu_categories" ON menu_categories FOR SELECT
  TO anon, authenticated USING (true);

-- Policies: menu_items
DROP POLICY IF EXISTS "anon_read_menu_items" ON menu_items;
CREATE POLICY "anon_read_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

-- Policies: orders (anon can read, insert, update status)
DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Policies: order_items
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
