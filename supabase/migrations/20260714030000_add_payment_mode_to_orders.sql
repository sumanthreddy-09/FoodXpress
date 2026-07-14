-- Add payment_mode column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'upi';
