-- Add details column to stripe_connect_accounts table

-- Check if the column already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stripe_connect_accounts'
    AND column_name = 'details'
  ) THEN
    -- Add the details column
    ALTER TABLE stripe_connect_accounts 
    ADD COLUMN details JSONB;
  END IF;
END
$$;
