-- Add access_token column to stripe_connect_accounts table

-- Check if the column already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'stripe_connect_accounts'
    AND column_name = 'access_token'
  ) THEN
    -- Add the access_token column
    ALTER TABLE stripe_connect_accounts 
    ADD COLUMN access_token TEXT;
    
    -- Add refresh_token column if it doesn't exist (commonly used with access_token)
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'stripe_connect_accounts'
      AND column_name = 'refresh_token'
    ) THEN
      ALTER TABLE stripe_connect_accounts 
      ADD COLUMN refresh_token TEXT;
    END IF;
    
    -- Add a scope column for storing OAuth scopes
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'stripe_connect_accounts'
      AND column_name = 'scope'
    ) THEN
      ALTER TABLE stripe_connect_accounts 
      ADD COLUMN scope TEXT;
    END IF;
    
    -- Add a token_type column 
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'stripe_connect_accounts'
      AND column_name = 'token_type'
    ) THEN
      ALTER TABLE stripe_connect_accounts 
      ADD COLUMN token_type TEXT;
    END IF;
  END IF;
END
$$;
