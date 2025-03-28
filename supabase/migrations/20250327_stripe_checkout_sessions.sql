-- Update the stripe_connect_integration tables and add checkout sessions support

-- First, modify stripe_connect_accounts table to use gc_account_id instead of user_id
DO $$ 
BEGIN
  -- Check if the table exists first
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stripe_connect_accounts') THEN
    -- Add gc_account_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'stripe_connect_accounts' 
                   AND column_name = 'gc_account_id') THEN
      ALTER TABLE stripe_connect_accounts ADD COLUMN gc_account_id UUID REFERENCES gc_accounts(id);
    END IF;
    
    -- Update policies to use gc_account_id
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'stripe_connect_accounts' 
               AND policyname = 'Users can view their own connected accounts') THEN
      DROP POLICY "Users can view their own connected accounts" ON stripe_connect_accounts;
    END IF;
    
    -- Create policy that uses profiles table to link users with gc_accounts
    CREATE POLICY "Users can view their gc_account's connected accounts"
      ON stripe_connect_accounts FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.gc_account_id = stripe_connect_accounts.gc_account_id
        AND profiles.id = auth.uid()
      ));
  END IF;
END $$;

-- Create checkout_sessions table to track Stripe Checkout Sessions
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  gc_account_id UUID REFERENCES gc_accounts(id), 
  stripe_session_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'created',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on checkout_sessions table
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies for checkout_sessions 
CREATE POLICY "Users can view their own checkout sessions"
  ON checkout_sessions FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own checkout sessions"
  ON checkout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own checkout sessions"
  ON checkout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add policy for GC accounts members to view their account's checkout sessions
CREATE POLICY "Users can view their gc_account's checkout sessions"
  ON checkout_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.gc_account_id = checkout_sessions.gc_account_id
    AND profiles.id = auth.uid()
  ));

-- Conditionally create payment_records table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'payment_records') THEN
    CREATE TABLE payment_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      gc_account_id UUID REFERENCES gc_accounts(id),
      payment_intent_id TEXT,
      connected_account_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL DEFAULT 'created',
      customer_email TEXT,
      customer_name TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS on payment_records table
    ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
    
    -- Add policies for payment_records
    CREATE POLICY "Users can view their own payment records"
      ON payment_records FOR SELECT
      USING (auth.uid() = user_id);
      
    -- Add policy for GC account members to view their account's payment records
    CREATE POLICY "Users can view their gc_account's payment records"
      ON payment_records FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.gc_account_id = payment_records.gc_account_id
        AND profiles.id = auth.uid()
      ));
  ELSE
    -- Add checkout_session_id column to existing table
    ALTER TABLE payment_records 
    ADD COLUMN IF NOT EXISTS checkout_session_id UUID REFERENCES checkout_sessions(id);
  END IF;
END $$;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_checkout_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checkout_sessions_updated_at
BEFORE UPDATE ON checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION update_checkout_sessions_updated_at();
