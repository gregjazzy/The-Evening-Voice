-- ============================================================================
-- Migration: 5 free credits on signup
-- Date: 2026-02-24
-- ============================================================================

-- 1. Change default credit_balance from 0 to 5 for new signups
ALTER TABLE profiles ALTER COLUMN credit_balance SET DEFAULT 5;

-- 2. Give 5 free credits to existing profiles that have 0 credits
UPDATE profiles SET credit_balance = 5 WHERE credit_balance = 0;

-- 3. Log the bonus for existing profiles
INSERT INTO credit_transactions (profile_id, amount, balance_after, reason)
SELECT id, 5, 5, 'signup_bonus'
FROM profiles
WHERE credit_balance = 5
  AND id NOT IN (SELECT profile_id FROM credit_transactions WHERE reason = 'signup_bonus');
