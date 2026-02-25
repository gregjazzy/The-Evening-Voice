-- ============================================================================
-- Migration: deduct_credits function with variable amount (for video = 3 credits)
-- Date: 2026-02-24
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_credits(p_profile_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
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

  UPDATE profiles
  SET credit_balance = v_new_balance, updated_at = NOW()
  WHERE id = p_profile_id;

  INSERT INTO credit_transactions (profile_id, amount, balance_after, reason)
  VALUES (p_profile_id, -p_amount, v_new_balance, CASE WHEN p_amount = 1 THEN 'generation' ELSE 'video_generation' END);

  RETURN QUERY SELECT true, v_new_balance;
END;
$$;
