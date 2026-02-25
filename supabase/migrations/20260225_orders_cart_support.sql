-- ============================================================================
-- Migration: Add cart support to orders table
-- Date: 2026-02-25
-- ============================================================================

-- 1. Add cart_data column for multi-item orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_data JSONB DEFAULT NULL;

-- 2. Update order_type constraint to include 'cart'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('book', 'credits', 'cart'));
