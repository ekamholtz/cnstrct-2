-- Migration: Stripe Connect Integration
-- Date: 2025-03-27

-- Create table for storing Stripe Connect account information
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id TEXT NOT NULL,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_account_id ON stripe_connect_accounts(account_id);

-- Create table for storing payment links
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_link_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'active',
  url TEXT NOT NULL,
  invoice_id UUID,
  project_id UUID,
  platform_fee INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_account_id ON payment_links(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_invoice_id ON payment_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_project_id ON payment_links(project_id);

-- Create table for storing payment records
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_intent_id TEXT NOT NULL,
  payment_link_id UUID REFERENCES payment_links(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  platform_fee INTEGER DEFAULT 0,
  payment_method_type TEXT,
  payment_method_details JSONB,
  invoice_id UUID,
  project_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_account_id ON payment_records(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_link_id ON payment_records(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_invoice_id ON payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_project_id ON payment_records(project_id);

-- Enable Row Level Security
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stripe_connect_accounts
CREATE POLICY "Users can view their own Stripe Connect accounts"
ON stripe_connect_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Stripe Connect accounts"
ON stripe_connect_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Stripe Connect accounts"
ON stripe_connect_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for payment_links
CREATE POLICY "Users can view their own payment links"
ON payment_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment links"
ON payment_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment links"
ON payment_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for payment_records
CREATE POLICY "Users can view their own payment records"
ON payment_records
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment records"
ON payment_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment records"
ON payment_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add policies for platform admins
CREATE POLICY "Platform admins can view all Stripe Connect accounts"
ON stripe_connect_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'platform_admin'
  )
);

CREATE POLICY "Platform admins can view all payment links"
ON payment_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'platform_admin'
  )
);

CREATE POLICY "Platform admins can view all payment records"
ON payment_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'platform_admin'
  )
);
