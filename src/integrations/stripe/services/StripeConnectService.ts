
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

// CORS proxy URL
const proxyUrl = 'http://localhost:3030/proxy/stripe';

/**
 * Retrieves the Stripe access token from Supabase
 * @returns The Stripe access token
 */
export const getStripeAccessToken = async (): Promise<string | null> => {
  try {
    // In a production environment, we would store the access token in Supabase
    // This is just for demonstration purposes and should be secured in a real app
    // Normally this would be retrieved from server-side storage only
    return process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key';
  } catch (error) {
    console.error('Error retrieving Stripe access token:', error);
    return null;
  }
};

/**
 * Creates a Stripe Connect account for a general contractor
 * @param userId The user ID of the general contractor
 * @param accessToken The Stripe access token
 * @returns The created Stripe account data
 */
export const createConnectedAccount = async (userId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: 'accounts',
      method: 'post',
      data: {
        type: 'express', // Using Express Connect account type
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'company',
        business_profile: {
          mcc: '1520', // Merchant Category Code for General Contractors
          url: 'https://www.cnstrctnetwork.com'
        },
        metadata: {
          user_id: userId
        }
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create Stripe Connect account');
  }
};

/**
 * Creates an account link for onboarding a connected account
 * @param accountId The Stripe account ID
 * @param accessToken The Stripe access token
 * @param refreshUrl The URL to redirect to if the onboarding process is refreshed
 * @param returnUrl The URL to redirect to after the onboarding process is complete
 * @returns The created account link data
 */
export const createAccountLink = async (
  accountId: string, 
  accessToken: string,
  refreshUrl: string,
  returnUrl: string
) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: 'account_links',
      method: 'post',
      data: {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating account link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create account link');
  }
};

/**
 * Retrieves a connected account
 * @param accountId The Stripe account ID
 * @param accessToken The Stripe access token
 * @returns The retrieved account data
 */
export const getConnectedAccount = async (accountId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: `accounts/${accountId}`,
      method: 'get',
      data: {}
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error retrieving Stripe Connect account:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to get Stripe Connect account');
  }
};

/**
 * Creates a login link for a connected account
 * @param accountId The Stripe account ID
 * @param accessToken The Stripe access token
 * @returns The created login link data
 */
export const createLoginLink = async (accountId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: `accounts/${accountId}/login_links`,
      method: 'post',
      data: {}
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating login link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create login link');
  }
};

/**
 * Creates the stripe_connect_accounts table if it doesn't exist
 */
export const createStripeConnectAccountsTable = async () => {
  try {
    // Create a stored procedure to execute arbitrary SQL
    // This is needed as supabase.rpc('execute_sql') requires a pre-defined function
    const createFunction = `
      CREATE OR REPLACE FUNCTION execute_sql(query text)
      RETURNS void AS $$
      BEGIN
        EXECUTE query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Execute the function creation
    await supabase.rpc('execute_sql', { query: createFunction }).catch(err => {
      // Function might already exist, ignore this error
      console.log('Function creation error (may already exist):', err);
    });
    
    // Now create the table
    const createTableSQL = `
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
    
    // Try to create the table
    const { error } = await supabase.rpc('execute_sql', { query: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to create stripe_connect_accounts table:', error);
    return false;
  }
};

/**
 * Saves the connected account to the database
 * @param userId The user ID of the general contractor
 * @param accountId The Stripe account ID
 * @param accountDetails The account details
 * @returns The result of the operation
 */
export const saveConnectedAccount = async (
  userId: string,
  accountId: string,
  accountDetails: any
) => {
  try {
    // Try to create the table if it doesn't exist
    await createStripeConnectAccountsTable();
    
    // Now try to save the account
    try {
      const { data, error } = await supabase
        .from('stripe_connect_accounts')
        .upsert({
          user_id: userId,
          account_id: accountId,
          charges_enabled: accountDetails.charges_enabled,
          payouts_enabled: accountDetails.payouts_enabled,
          details_submitted: accountDetails.details_submitted,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return data;
    } catch (dbError: any) {
      // If the error is that the table doesn't exist, create it and try again
      if (dbError.code === '42P01') {
        // Table doesn't exist, create it
        await createStripeConnectAccountsTable();
        
        // Try the upsert again
        const { data, error } = await supabase
          .from('stripe_connect_accounts')
          .upsert({
            user_id: userId,
            account_id: accountId,
            charges_enabled: accountDetails.charges_enabled,
            payouts_enabled: accountDetails.payouts_enabled,
            details_submitted: accountDetails.details_submitted,
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;
        return data;
      } else {
        throw dbError;
      }
    }
  } catch (error: any) {
    console.error('Error saving Stripe Connect account:', error);
    throw new Error(error.message || 'Failed to save Stripe Connect account');
  }
};

/**
 * Retrieves the connected account from the database
 * @param userId The user ID of the general contractor
 * @returns The connected account data
 */
export const getConnectedAccountFromDB = async (userId: string) => {
  try {
    try {
      const { data, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (dbError: any) {
      // If the table doesn't exist, handle that case
      if (dbError.code === '42P01') {
        // Table doesn't exist, create it first
        await createStripeConnectAccountsTable();
        return null; // No data yet
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error retrieving Stripe Connect account from DB:', error);
    throw new Error(error.message || 'Failed to get Stripe Connect account');
  }
};
