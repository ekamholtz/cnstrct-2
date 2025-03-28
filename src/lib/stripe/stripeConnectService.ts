
/**
 * Stripe Connect Service
 * Provides functionality for Stripe Connect account management
 */

import { supabase } from '@/lib/supabase';
import { StripeConnectAccount, StripeAccountStatus } from '@/types/stripe';
import { stripeConnectConfig } from './stripeConnectConfig';

/**
 * Creates an onboarding link for a Stripe Connect account
 * 
 * @param companyId - The company ID
 * @param accountId - The Stripe account ID
 * @param returnUrl - URL to return to after onboarding
 * @returns The onboarding URL
 */
export async function createOnboardingLink(
  companyId: string,
  accountId: string,
  returnUrl: string
): Promise<string> {
  try {
    const response = await fetch('/api/proxy/stripe/account_links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          account: accountId,
          refresh_url: window.location.origin + '/dashboard/settings/stripe?error=refresh',
          return_url: returnUrl || window.location.origin + '/dashboard/settings/stripe?success=true',
          type: 'account_onboarding'
        },
        endpoint: 'account_links',
        method: 'post'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create onboarding link');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    throw error;
  }
}

/**
 * Creates a Stripe Connect account for a company
 * 
 * @param companyId - The company ID
 * @param businessName - The business name
 * @param email - The business email
 * @returns The created Stripe Connect account
 */
export async function createConnectAccount(
  companyId: string,
  businessName: string,
  email: string
): Promise<StripeConnectAccount> {
  try {
    // Create the Stripe Connect account through our proxy
    const response = await fetch('/api/proxy/stripe/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          type: stripeConnectConfig.defaultAccountType,
          business_type: 'company',
          company: {
            name: businessName,
          },
          business_profile: {
            name: businessName,
            url: window.location.origin,
          },
          email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        },
        endpoint: 'accounts',
        method: 'post'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create Stripe Connect account');
    }

    const stripeAccount = await response.json();

    // Save the account to our database
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .insert({
        company_id: companyId,
        stripe_account_id: stripeAccount.id,
        status: 'pending',
        account_type: stripeConnectConfig.defaultAccountType,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save Stripe account: ${error.message}`);
    }

    return data as StripeConnectAccount;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

/**
 * Gets the Stripe Connect account for a company
 * 
 * @param companyId - The company ID
 * @returns The Stripe Connect account or null if not found
 */
export async function getConnectAccount(companyId: string): Promise<StripeConnectAccount | null> {
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found
      return null;
    }
    throw new Error(`Failed to get Stripe Connect account: ${error.message}`);
  }

  return data as StripeConnectAccount;
}

/**
 * Updates the account status in our database based on the current state in Stripe
 * 
 * @param companyId - The company ID
 * @param accountId - The Stripe account ID
 * @returns The updated account status
 */
export async function updateAccountStatus(
  companyId: string,
  accountId: string
): Promise<StripeAccountStatus> {
  try {
    // Get the account details from Stripe
    const response = await fetch(`/api/proxy/stripe/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `accounts/${accountId}`,
        method: 'get',
        data: {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get account details');
    }

    const account = await response.json();

    // Determine the status
    let status: StripeAccountStatus = 'pending';
    
    if (account.details_submitted) {
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'complete';
      } else {
        status = 'onboarding';
      }
    } else if (account.requirements?.disabled_reason === 'rejected.fraud') {
      status = 'rejected';
    } else if (account.requirements?.disabled_reason) {
      status = 'error';
    }

    // Update our database
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .update({
        status,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        error_message: account.requirements?.disabled_reason,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('stripe_account_id', accountId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account status: ${error.message}`);
    }

    return status;
  } catch (error) {
    console.error('Error updating account status:', error);
    throw error;
  }
}

/**
 * Creates a login link for Express dashboard access
 * 
 * @param accountId - The Stripe account ID
 * @returns The login link URL
 */
export async function createLoginLink(accountId: string): Promise<string> {
  try {
    const response = await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `accounts/${accountId}/login_links`,
        method: 'post',
        data: {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create login link');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating login link:', error);
    throw error;
  }
}
