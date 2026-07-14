-- Add payment_ref_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref_number text;
