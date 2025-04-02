
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useStripeConnect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const getAccountStatus = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { action: 'get-account', userId }
      });
      
      if (error) {
        console.error('Error fetching Stripe account status:', error);
        setError(error.message);
        return null;
      }
      
      if (!data.success) {
        // No account found, which is okay - user hasn't connected yet
        console.log('No Stripe account found for this user');
        return null;
      }
      
      const accountData = {
        accountId: data.account?.accountId,
        chargesEnabled: data.account?.chargesEnabled,
        payoutsEnabled: data.account?.payoutsEnabled,
        detailsSubmitted: data.account?.detailsSubmitted
      };
      
      setAccountStatus(accountData);
      return accountData;
    } catch (err: any) {
      console.error('Error in getAccountStatus:', err);
      setError(err.message || 'Error fetching account status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const connectStripeAccount = useCallback(async (userId: string, returnUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'initiate-oauth',
          userId,
          returnUrl: returnUrl || window.location.href
        }
      });
      
      if (error) {
        toast({
          title: 'Connection Error',
          description: `Failed to start Stripe connection: ${error.message}`,
          variant: 'destructive'
        });
        setError(error.message);
        return null;
      }
      
      return data.url;
    } catch (err: any) {
      console.error('Error connecting to Stripe:', err);
      setError(err.message || 'Error connecting to Stripe');
      toast({
        title: 'Connection Error',
        description: err.message || 'Error connecting to Stripe',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'handle-oauth-callback',
          code,
          state,
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Error handling OAuth callback:', error);
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      // Refresh the account status
      await getAccountStatus(user.id);
      
      toast({
        title: 'Connection Successful',
        description: 'Your Stripe account has been connected successfully.',
      });
      
      return {
        success: true,
        onboardingUrl: data.onboardingUrl,
        returnUrl: data.returnUrl
      };
    } catch (err: any) {
      console.error('Error in handleOAuthCallback:', err);
      setError(err.message || 'Error handling callback');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, getAccountStatus, toast]);
  
  const createAccountLink = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'create-account-link',
          accountId
        }
      });
      
      if (error) {
        console.error('Error creating account link:', error);
        setError(error.message);
        return null;
      }
      
      return data.url;
    } catch (err: any) {
      console.error('Error in createAccountLink:', err);
      setError(err.message || 'Error creating account link');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load account status on component mount
  useEffect(() => {
    if (user?.id) {
      getAccountStatus(user.id);
    }
  }, [user, getAccountStatus]);
  
  return {
    loading,
    error,
    accountStatus,
    getAccountStatus,
    connectStripeAccount,
    handleOAuthCallback,
    createAccountLink
  };
};

export default useStripeConnect;
