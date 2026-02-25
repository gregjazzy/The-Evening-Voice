-- ============================================================================
-- Migration: Credits system + Orders table for Stripe integration
-- Date: 2026-02-24
-- ============================================================================

-- 1. Add credit_balance to profiles (5 free credits on signup)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 5;

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN ('book', 'credits')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'failed', 'refunded')),
  -- Book order data
  book_data JSONB DEFAULT NULL,
  gelato_order_id TEXT DEFAULT NULL,
  -- Credits order data
  credits_amount INTEGER DEFAULT NULL,
  -- Pricing
  amount_total INTEGER DEFAULT 0, -- in cents
  currency TEXT DEFAULT 'eur',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create credit_transactions table (audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'purchase', 'generation', 'bonus', 'refund'
  reference_id TEXT DEFAULT NULL, -- order_id or generation_job_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Orders: users can read their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Credit transactions: users can read their own transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access on orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on credit_transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Atomic credit deduction function (supports variable amount for images=1, videos=3)
CREATE OR REPLACE FUNCTION deduct_credits(p_profile_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_reason TEXT;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credit_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;
  v_reason := CASE WHEN p_amount = 1 THEN 'generation' ELSE 'video_generation' END;

  UPDATE profiles
  SET credit_balance = v_new_balance, updated_at = NOW()
  WHERE id = p_profile_id;

  -- Insert audit trail
  INSERT INTO credit_transactions (profile_id, amount, balance_after, reason)
  VALUES (p_profile_id, -p_amount, v_new_balance, v_reason);

  RETURN QUERY SELECT true, v_new_balance;
END;
$$;

-- 6. Function to add credits (for webhook)
CREATE OR REPLACE FUNCTION add_credits(p_profile_id UUID, p_amount INTEGER, p_reason TEXT, p_reference_id TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credit_balance = credit_balance + p_amount, updated_at = NOW()
  WHERE id = p_profile_id
  RETURNING credit_balance INTO v_new_balance;

  INSERT INTO credit_transactions (profile_id, amount, balance_after, reason, reference_id)
  VALUES (p_profile_id, p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN v_new_balance;
END;
$$;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_profile_id ON credit_transactions(profile_id);
