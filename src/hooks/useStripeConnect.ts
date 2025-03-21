import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  getStripeAccessToken,
  getConnectedAccountFromDB,
  getConnectedAccount,
  createConnectedAccount,
  createAccountLink,
  saveConnectedAccount,
  createLoginLink
} from '@/integrations/stripe/services/StripeConnectService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useStripeConnect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>({});
  const [skipConnectionCheck, setSkipConnectionCheck] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const fetchAccessToken = async () => {
    try {
      setLoading(true);
      const token = await getStripeAccessToken();
      
      if (!token) {
        console.warn('Stripe access token not found. Some features may be limited.');
        setSkipConnectionCheck(true);
        return null;
      }
      
      setAccessToken(token);
      return token;
    } catch (err: any) {
      console.error('Error fetching Stripe access token:', err);
      setSkipConnectionCheck(true);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const getAccountStatus = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // If we're skipping connection checks, return a placeholder status
      if (skipConnectionCheck) {
        console.log('Skipping Stripe connection check due to missing API key');
        return {
          accountId: undefined,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false
        };
      }
      
      // Ensure we have an access token
      const token = accessToken || await fetchAccessToken();
      if (!token) {
        setError('Stripe access token not found');
        return null;
      }
      
      try {
        // First check if the table exists
        try {
          const { count, error } = await supabase
            .from('stripe_connect_accounts')
            .select('*', { count: 'exact', head: true });
          
          // If we get here, the table exists
        } catch (tableErr: any) {
          if (tableErr.message && tableErr.message.includes('does not exist')) {
            setError('The stripe_connect_accounts table does not exist. Please run the SQL migrations first.');
            setLoading(false);
            return null;
          }
        }
        
        // Get the connected account from the database
        const accountData = await getConnectedAccountFromDB(userId);
        
        if (accountData && accountData.account_id) {
          try {
            // Get the account details from Stripe
            const accountDetails = await getConnectedAccount(accountData.account_id, token);
            
            const status = {
              accountId: accountData.account_id,
              chargesEnabled: accountDetails.charges_enabled,
              payoutsEnabled: accountDetails.payouts_enabled,
              detailsSubmitted: accountDetails.details_submitted
            };
            
            setAccountStatus(status);
            
            // Update the database with the latest status
            await saveConnectedAccount(userId, accountData.account_id, accountDetails);
            
            return status;
          } catch (stripeErr: any) {
            console.error('Error fetching account from Stripe:', stripeErr);
            
            // If the error is related to the Stripe API key being invalid
            if (stripeErr.message && (stripeErr.message.includes('Invalid API Key') || stripeErr.message.includes('No API key provided'))) {
              setError('Invalid Stripe API key. Please check your environment configuration.');
              
              toast({
                title: 'API Key Error',
                description: 'The Stripe API key appears to be invalid. Please check your environment configuration.',
                variant: 'destructive',
                duration: 8000
              });
            } else {
              setError(stripeErr.message || 'Failed to fetch account from Stripe');
            }
            
            // Still return what we have in the database
            const status = {
              accountId: accountData.account_id,
              chargesEnabled: accountData.charges_enabled,
              payoutsEnabled: accountData.payouts_enabled,
              detailsSubmitted: accountData.details_submitted
            };
            
            setAccountStatus(status);
            return status;
          }
        }
      } catch (dbErr: any) {
        console.error('Database error when getting account status:', dbErr);
        
        // Check if the error is related to missing tables
        if (dbErr.message && (dbErr.message.includes('table not found') || dbErr.message.includes('does not exist'))) {
          setError('The required database tables are missing. Please run the SQL migrations first.');
          toast({
            title: 'Database Setup Required',
            description: 'The Stripe Connect database tables need to be created. Please run the SQL migrations provided.',
            variant: 'destructive',
            duration: 10000
          });
        } else {
          setError(dbErr.message || 'Failed to get account from database');
        }
      }
      
      return null;
    } catch (err: any) {
      console.error('Error getting account status:', err);
      setError(err.message || 'Failed to get account status');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const connectStripeAccount = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        setError('User ID is required to connect a Stripe account');
        return null;
      }
      
      // If we're skipping connection checks, show an API key missing message
      if (skipConnectionCheck) {
        toast({
          title: 'Stripe API Key Required',
          description: 'Please add your Stripe secret key to the environment variables to enable Stripe Connect.',
          variant: 'destructive',
          duration: 8000
        });
        return null;
      }
      
      // Ensure we have an access token
      const token = accessToken || await fetchAccessToken();
      if (!token) {
        setError('Stripe access token not found');
        return null;
      }
      
      try {
        // First check if the table exists
        try {
          const { count, error } = await supabase
            .from('stripe_connect_accounts')
            .select('*', { count: 'exact', head: true });
          
          // If we get here, the table exists
        } catch (tableErr: any) {
          if (tableErr.message && tableErr.message.includes('does not exist')) {
            setError('The stripe_connect_accounts table does not exist. Please run the SQL migrations first.');
            setLoading(false);
            return null;
          }
        }
        
        // Create a new Stripe Connect account
        const accountResponse = await createConnectedAccount(userId, token);
        
        // Save the account to the database
        await saveConnectedAccount(userId, accountResponse.id, accountResponse);
        
        // Create an account link for onboarding
        const accountLink = await createAccountLink(
          accountResponse.id,
          token,
          `${window.location.origin}/settings/payments`, // Refresh URL
          `${window.location.origin}/settings/payments` // Return URL (changed to redirect back to payment settings)
        );
        
        return accountLink.url;
      } catch (stripeErr: any) {
        // Check if the error is related to missing tables
        if (stripeErr.message && (stripeErr.message.includes('table not found') || stripeErr.message.includes('does not exist'))) {
          setError('The required database tables are missing. Please run the SQL migrations first.');
          toast({
            title: 'Database Setup Required',
            description: 'The Stripe Connect database tables need to be created. Please run the SQL migrations provided.',
            variant: 'destructive',
            duration: 10000
          });
          return null;
        }
        
        // If the error is related to the Stripe API key
        if (stripeErr.message && (stripeErr.message.includes('Invalid API Key') || stripeErr.message.includes('No API key provided'))) {
          setError('Invalid Stripe API key. Please check your environment configuration.');
          toast({
            title: 'API Key Error',
            description: 'The Stripe API key appears to be invalid. Please check your environment configuration.',
            variant: 'destructive',
            duration: 8000
          });
          return null;
        }
        
        throw stripeErr;
      }
    } catch (err: any) {
      console.error('Error connecting Stripe account:', err);
      setError(err.message || 'Failed to connect Stripe account');
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to connect Stripe account. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const getLoginLink = async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // If we're skipping connection checks, return null
      if (skipConnectionCheck) {
        toast({
          title: 'Stripe API Key Required',
          description: 'Please add your Stripe secret key to the environment variables to enable Stripe account management.',
          variant: 'destructive',
          duration: 8000
        });
        return null;
      }
      
      // Ensure we have an access token
      const token = accessToken || await fetchAccessToken();
      if (!token) {
        setError('Stripe access token not found');
        return null;
      }
      
      // Create a login link for the connected account
      const loginLink = await createLoginLink(accountId, token);
      return loginLink.url;
    } catch (err: any) {
      console.error('Error creating login link:', err);
      setError(err.message || 'Failed to create login link');
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to create login link. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    accountStatus,
    skipConnectionCheck,
    fetchAccessToken,
    getAccountStatus,
    connectStripeAccount,
    getLoginLink
  };
};
