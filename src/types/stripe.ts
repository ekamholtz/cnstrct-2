
// Types for Stripe integration

export type StripeAccountStatus = 
  | 'pending' 
  | 'onboarding' 
  | 'complete' 
  | 'rejected' 
  | 'error';

export interface StripeConnectAccount {
  id: string;
  company_id: string;
  stripe_account_id: string;
  status: StripeAccountStatus;
  account_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeInvoice {
  id: string;
  stripe_invoice_id: string;
  company_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: string;
  hosted_invoice_url: string;
  created_at: string;
  updated_at: string;
}

export interface StripePaymentLink {
  id: string;
  invoice_id: string;
  company_id: string;
  checkout_session_id: string;
  url: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// We need to add a SQL migration to make sure this field exists
// in the subscription_tiers table
let sql = `
ALTER TABLE subscription_tiers 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
`;
