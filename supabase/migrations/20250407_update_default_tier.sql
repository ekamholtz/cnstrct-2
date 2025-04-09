
-- Ensure we have at least one default tier that matches our DEFAULT_TIER_ID constant
INSERT INTO subscription_tiers (id, name, description, price, fee_percentage, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Trial', 'Free trial with limited features', 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = 'Trial',
  description = 'Free trial with limited features',
  max_projects = 2,
  updated_at = NOW();

-- Ensure the account_subscriptions table has gc_account_id as a unique key
ALTER TABLE account_subscriptions 
DROP CONSTRAINT IF EXISTS account_subscriptions_gc_account_id_key;

ALTER TABLE account_subscriptions
ADD CONSTRAINT account_subscriptions_gc_account_id_key UNIQUE (gc_account_id);
