/*
# Create saved_addresses table

1. New Tables
- `saved_addresses`
  - `id` (uuid, primary key)
  - `label` (text) — e.g. "Home", "Work", "Other"
  - `full_address` (text) — complete street address
  - `city` (text, default 'Hyderabad')
  - `pincode` (text) — 6-digit pincode
  - `is_default` (boolean, default false) — marks the default address
  - `created_at` (timestamptz)

2. Security
- RLS enabled.
- Single-tenant no-auth app: anon + authenticated CRUD allowed.
*/

CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'Home',
  full_address text NOT NULL,
  city text NOT NULL DEFAULT 'Hyderabad',
  pincode text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_saved_addresses" ON saved_addresses;
CREATE POLICY "anon_read_saved_addresses" ON saved_addresses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saved_addresses" ON saved_addresses;
CREATE POLICY "anon_insert_saved_addresses" ON saved_addresses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saved_addresses" ON saved_addresses;
CREATE POLICY "anon_update_saved_addresses" ON saved_addresses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saved_addresses" ON saved_addresses;
CREATE POLICY "anon_delete_saved_addresses" ON saved_addresses FOR DELETE
  TO anon, authenticated USING (true);
