
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccountStatus {
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export function useStripeConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({});

  // Function to get the current Stripe account status for a company (gc_account)
  const getAccountStatus = async (gcAccountId: string): Promise<AccountStatus> => {
    try {
      setLoading(true);
      setError('');

      // Call the Supabase function to get account status
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'get_account_status',
          gc_account_id: gcAccountId
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setAccountStatus(data || {});
      return data || {};
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch account status';
      setError(errorMessage);
      console.error('Error fetching Stripe account status:', err);
      return {};
    } finally {
      setLoading(false);
    }
  };

  // Function to connect a Stripe account to a company (gc_account)
  const connectStripeAccount = async (gcAccountId: string, returnUrl?: string): Promise<string> => {
    try {
      setLoading(true);
      setError('');

      // Save current authentication state to localStorage before redirecting
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        // Save auth state to localStorage
        localStorage.setItem('stripe_auth_state', JSON.stringify({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          returnUrl: returnUrl || '/settings/payments'
        }));
      }

      // Call the Supabase function to start OAuth flow
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create_oauth_link',
          gc_account_id: gcAccountId,
          // Use our custom callback page that preserves auth state
          return_url: window.location.origin + '/auth/stripe-callback'
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.url) {
        throw new Error('No authorization URL returned');
      }

      return data.url;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect Stripe account';
      setError(errorMessage);
      console.error('Error creating Stripe connect link:', err);
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Function to handle the OAuth callback from Stripe
  const handleOAuthCallback = async (code: string, state: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError('');

      // Call the Supabase function to handle OAuth callback
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'handle_oauth_callback',
          code,
          state
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success) {
        return true;
      } else {
        throw new Error(data?.message || 'Failed to complete Stripe connection');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process Stripe callback';
      setError(errorMessage);
      console.error('Error handling Stripe OAuth callback:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to get Stripe account login link
  const getLoginLink = async (accountId: string): Promise<string> => {
    try {
      setLoading(true);
      setError('');

      // Call the Supabase function to get login link
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create_login_link',
          account_id: accountId
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.url) {
        throw new Error('No login URL returned');
      }

      return data.url;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create login link';
      setError(errorMessage);
      console.error('Error creating Stripe login link:', err);
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Function to create an account link for onboarding or updating
  const createAccountLink = async (accountId: string): Promise<string> => {
    try {
      setLoading(true);
      setError('');

      // Call the Supabase function to create account link
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create-account-link',
          account_id: accountId
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.url) {
        throw new Error('No account link URL returned');
      }

      return data.url;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account link';
      setError(errorMessage);
      console.error('Error creating Stripe account link:', err);
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Function to skip connection checks (e.g., force onboarding completion)
  const skipConnectionCheck = async (accountId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError('');

      // Call the Supabase function to skip connection check
      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'skip_connection_check',
          account_id: accountId
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      return data?.success || false;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update connection status';
      setError(errorMessage);
      console.error('Error updating Stripe connection status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    accountStatus,
    getAccountStatus,
    connectStripeAccount,
    handleOAuthCallback,
    getLoginLink,
    createAccountLink, // Added the missing method here
    skipConnectionCheck
  };
}
