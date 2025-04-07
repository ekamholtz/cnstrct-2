
-- Fix foreign key constraints for payment_records table
ALTER TABLE IF EXISTS payment_records
DROP CONSTRAINT IF EXISTS payment_records_gc_account_id_fkey;

-- Add the constraint with proper ON DELETE/UPDATE behavior
ALTER TABLE IF EXISTS payment_records
ADD CONSTRAINT payment_records_gc_account_id_fkey
FOREIGN KEY (gc_account_id) REFERENCES gc_accounts(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Make sure gc_account_id is nullable (in case it's not already)
ALTER TABLE IF EXISTS payment_records
ALTER COLUMN gc_account_id DROP NOT NULL;

-- Also fix checkout_sessions constraint
ALTER TABLE IF EXISTS checkout_sessions
DROP CONSTRAINT IF EXISTS checkout_sessions_user_id_fkey;

-- Make sure user_id can be set to a UUID placeholder when needed
ALTER TABLE IF EXISTS checkout_sessions
ADD CONSTRAINT checkout_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Add default tier if it doesn't exist
INSERT INTO subscription_tiers (id, name, description, price, fee_percentage, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Free', 'Free tier with basic features', 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();
