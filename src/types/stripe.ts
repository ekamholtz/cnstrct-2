
/**
 * Stripe Types
 * Defines TypeScript types for Stripe data structures used in the application
 */

// Stripe Account Status
export type StripeAccountStatus = 
  | 'pending' 
  | 'onboarding' 
  | 'complete' 
  | 'rejected' 
  | 'error';

// Stripe Account details stored in our database
export interface StripeConnectAccount {
  id: string;
  company_id: string;
  stripe_account_id: string;
  status: StripeAccountStatus;
  account_type: 'standard' | 'express' | 'custom';
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
  details_submitted: boolean;
  error_message?: string;
}

// Stripe Payment Status
export type StripePaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'requires_payment_method'
  | 'canceled'
  | 'succeeded'
  | 'failed';

// Stripe Payment Link
export interface StripePaymentLink {
  id: string;
  invoice_id: string;
  company_id: string;
  payment_intent_id?: string;
  checkout_session_id?: string;
  url: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Simplified Stripe Invoice
export interface StripeInvoice {
  id: string;
  stripe_invoice_id: string;
  company_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  created_at: string;
  updated_at: string;
  hosted_invoice_url?: string;
}

// Stripe Customer
export interface StripeCustomer {
  id: string;
  client_id: string;
  company_id: string;
  stripe_customer_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Stripe Connect Account Requirement
export interface StripeAccountRequirement {
  requirement: string;
  description: string;
  status: 'required' | 'pending' | 'complete';
}

// Stripe Connect Onboarding Status Response
export interface StripeConnectOnboardingStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pendingVerification: string[];
    errors: Array<{
      requirement: string;
      error_message: string;
    }>;
  };
}
