
-- Update stripe_price_id for the Trial tier
UPDATE subscription_tiers
SET stripe_price_id = 'price_trial'
WHERE name = 'Trial';

-- Update stripe_price_id for the Platform Basics tier
UPDATE subscription_tiers
SET stripe_price_id = 'price_basic'
WHERE name = 'Platform Basics';

-- Update stripe_price_id for the Advanced Payments tier
UPDATE subscription_tiers
SET stripe_price_id = 'price_advanced'
WHERE name = 'Advanced Payments';

-- Update stripe_price_id for the Premium tier if it exists
UPDATE subscription_tiers
SET stripe_price_id = 'price_premium'
WHERE name = 'Premium';

-- Update stripe_price_id for the Advanced tier if it exists
UPDATE subscription_tiers
SET stripe_price_id = 'price_advanced_pro'
WHERE name = 'Advanced';
