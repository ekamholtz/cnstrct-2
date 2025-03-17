
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
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if the database table exists or create it
  useEffect(() => {
    const checkAndCreateTable = async () => {
      try {
        // Try to query the table to see if it exists
        const { error } = await supabase
          .from('stripe_connect_accounts')
          .select('count', { count: 'exact', head: true })
          .limit(1);
          
        // If we get a specific error about the relation not existing, create the table
        if (error && error.code === '42P01') {
          console.log('Stripe connect accounts table does not exist, creating it...');
          // Create the table
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL,
              account_id TEXT NOT NULL,
              charges_enabled BOOLEAN DEFAULT FALSE,
              payouts_enabled BOOLEAN DEFAULT FALSE,
              details_submitted BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, account_id)
            );
          `;
          
          // Execute table creation
          const { error: createError } = await supabase.rpc('execute_sql', { query: createTableQuery });
          
          if (createError) {
            console.error('Error creating Stripe connect accounts table:', createError);
            // Just log the error but don't block the user experience
          } else {
            console.log('Successfully created stripe_connect_accounts table');
          }
        }
      } catch (err) {
        console.error('Error checking/creating table:', err);
      }
    };
    
    checkAndCreateTable();
  }, []);
  
  const fetchAccessToken = async () => {
    try {
      setLoading(true);
      const token = await getStripeAccessToken();
      setAccessToken(token);
      return token;
    } catch (err: any) {
      console.error('Error fetching Stripe access token:', err);
      setError('Failed to get Stripe access token');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const getAccountStatus = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have an access token
      const token = accessToken || await fetchAccessToken();
      if (!token) {
        setError('Stripe access token not found');
        return null;
      }
      
      try {
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
            setError(stripeErr.message || 'Failed to fetch account from Stripe');
            
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
        // If the table doesn't exist or other DB error, handle it gracefully
        console.error('Database error when getting account status:', dbErr);
        
        if (dbErr?.code === '42P01') {
          // Table doesn't exist error, just return null without setting an error
          // This is handled by the table creation logic in useEffect
          return null;
        }
        
        setError(dbErr.message || 'Failed to get account from database');
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
      
      // Ensure we have an access token
      const token = accessToken || await fetchAccessToken();
      if (!token) {
        setError('Stripe access token not found');
        return null;
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
        `${window.location.origin}/stripe/onboarding-complete` // Return URL
      );
      
      return accountLink.url;
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
    fetchAccessToken,
    getAccountStatus,
    connectStripeAccount,
    getLoginLink
  };
};
