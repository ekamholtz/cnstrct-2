
-- Create table for storing Stripe auth state
CREATE TABLE IF NOT EXISTS stripe_auth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on state for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_auth_states_state ON stripe_auth_states(state);
-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_auth_states_user_id ON stripe_auth_states(user_id);

-- Add RLS policies
ALTER TABLE stripe_auth_states ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own auth states
CREATE POLICY view_own_auth_states ON stripe_auth_states
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own auth states
CREATE POLICY insert_own_auth_states ON stripe_auth_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);
