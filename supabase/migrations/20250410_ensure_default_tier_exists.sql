
-- Ensure we have a default trial tier that matches our DEFAULT_TIER_ID constant
INSERT INTO subscription_tiers (id, name, description, price, fee_percentage, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Trial', 'Free trial with limited features', 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = 'Trial',
  description = 'Free trial with limited features',
  price = 0,
  fee_percentage = 0,
  updated_at = NOW();

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Default tier ensured with ID: 00000000-0000-0000-0000-000000000001';
END $$;
