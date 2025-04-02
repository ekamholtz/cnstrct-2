
-- Add stripe_price_id column to subscription_tiers table if it doesn't exist
ALTER TABLE subscription_tiers 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Ensure we have at least one default tier that matches our DEFAULT_TIER_ID constant
INSERT INTO subscription_tiers (id, name, description, price, fee_percentage, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Free', 'Free tier with basic features', 0, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
