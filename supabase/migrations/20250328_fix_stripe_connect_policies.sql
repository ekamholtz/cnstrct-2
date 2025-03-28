-- Fix the stripe_connect_accounts table policies

-- Use a DO block to safely update policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their gc_account's connected accounts" ON stripe_connect_accounts;
  DROP POLICY IF EXISTS "Users can insert their gc_account's connected accounts" ON stripe_connect_accounts;
  DROP POLICY IF EXISTS "Users can update their gc_account's connected accounts" ON stripe_connect_accounts;
  DROP POLICY IF EXISTS "Users can delete their gc_account's connected accounts" ON stripe_connect_accounts;
  
  -- Create more permissive policies for development if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_connect_accounts' AND policyname = 'Users can view connected accounts') THEN
    CREATE POLICY "Users can view connected accounts" 
      ON stripe_connect_accounts FOR SELECT
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_connect_accounts' AND policyname = 'Users can insert connected accounts') THEN
    CREATE POLICY "Users can insert connected accounts" 
      ON stripe_connect_accounts FOR INSERT
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_connect_accounts' AND policyname = 'Users can update connected accounts') THEN
    CREATE POLICY "Users can update connected accounts" 
      ON stripe_connect_accounts FOR UPDATE
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_connect_accounts' AND policyname = 'Users can delete connected accounts') THEN
    CREATE POLICY "Users can delete connected accounts" 
      ON stripe_connect_accounts FOR DELETE
      USING (true);
  END IF;
END $$;

-- Update the checkout_sessions policies similarly for development
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their checkout sessions" ON checkout_sessions;
  DROP POLICY IF EXISTS "Users can insert their checkout sessions" ON checkout_sessions;
  DROP POLICY IF EXISTS "Users can update their checkout sessions" ON checkout_sessions;
  DROP POLICY IF EXISTS "Users can delete their checkout sessions" ON checkout_sessions;
  
  -- Create more permissive policies for development if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_sessions' AND policyname = 'Users can view checkout sessions') THEN
    CREATE POLICY "Users can view checkout sessions" 
      ON checkout_sessions FOR SELECT
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_sessions' AND policyname = 'Users can insert checkout sessions') THEN
    CREATE POLICY "Users can insert checkout sessions" 
      ON checkout_sessions FOR INSERT
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_sessions' AND policyname = 'Users can update checkout sessions') THEN
    CREATE POLICY "Users can update checkout sessions" 
      ON checkout_sessions FOR UPDATE
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_sessions' AND policyname = 'Users can delete checkout sessions') THEN
    CREATE POLICY "Users can delete checkout sessions" 
      ON checkout_sessions FOR DELETE
      USING (true);
  END IF;
END $$;
