-- Create table for Stripe Connect accounts
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);

-- Create table for payment links
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  payment_link_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  customer_email TEXT,
  customer_name TEXT,
  project_id TEXT,
  platform_fee INTEGER NOT NULL,
  status TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
-- Create index on stripe_account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_stripe_account_id ON payment_links(stripe_account_id);

-- Create table for payment records
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  customer_email TEXT,
  customer_name TEXT,
  project_id TEXT,
  platform_fee INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
-- Create index on stripe_account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_account_id ON payment_records(stripe_account_id);

-- Create row level security policies
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own Stripe Connect accounts
CREATE POLICY view_own_stripe_connect_accounts ON stripe_connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own Stripe Connect accounts
CREATE POLICY insert_own_stripe_connect_accounts ON stripe_connect_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own Stripe Connect accounts
CREATE POLICY update_own_stripe_connect_accounts ON stripe_connect_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to view only their own payment links
CREATE POLICY view_own_payment_links ON payment_links
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own payment links
CREATE POLICY insert_own_payment_links ON payment_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own payment links
CREATE POLICY update_own_payment_links ON payment_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to view only their own payment records
CREATE POLICY view_own_payment_records ON payment_records
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own payment records
CREATE POLICY insert_own_payment_records ON payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own payment records
CREATE POLICY update_own_payment_records ON payment_records
  FOR UPDATE USING (auth.uid() = user_id);
