-- ============================================================================
-- Migration: Narration credits system (ElevenLabs character-based billing)
-- Date: 2026-02-26
-- ============================================================================

-- 1. Add narration_credit_balance to profiles (900 free chars on signup ≈ 1 short story)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS narration_credit_balance INTEGER DEFAULT 900;

-- 2. Create narration_credit_transactions table (audit trail)
CREATE TABLE IF NOT EXISTS narration_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'purchase', 'narration', 'refund_failed_narration', 'refund_error'
  reference_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies
ALTER TABLE narration_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own narration credit transactions" ON narration_credit_transactions
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on narration_credit_transactions" ON narration_credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Atomic narration credit deduction function
CREATE OR REPLACE FUNCTION deduct_narration_credits(p_profile_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT narration_credit_balance INTO v_current_balance
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

  UPDATE profiles
  SET narration_credit_balance = v_new_balance, updated_at = NOW()
  WHERE id = p_profile_id;

  -- Insert audit trail
  INSERT INTO narration_credit_transactions (profile_id, amount, balance_after, reason)
  VALUES (p_profile_id, -p_amount, v_new_balance, 'narration');

  RETURN QUERY SELECT true, v_new_balance;
END;
$$;

-- 5. Function to add narration credits (for webhook / refund)
CREATE OR REPLACE FUNCTION add_narration_credits(p_profile_id UUID, p_amount INTEGER, p_reason TEXT, p_reference_id TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET narration_credit_balance = narration_credit_balance + p_amount, updated_at = NOW()
  WHERE id = p_profile_id
  RETURNING narration_credit_balance INTO v_new_balance;

  INSERT INTO narration_credit_transactions (profile_id, amount, balance_after, reason, reference_id)
  VALUES (p_profile_id, p_amount, v_new_balance, p_reason, p_reference_id);

  RETURN v_new_balance;
END;
$$;

-- 6. Update order_type constraint to include 'narration_credits'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('book', 'credits', 'cart', 'narration_credits'));

-- 7. Index
CREATE INDEX IF NOT EXISTS idx_narration_credit_transactions_profile_id ON narration_credit_transactions(profile_id);
