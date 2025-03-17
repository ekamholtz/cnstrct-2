import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

// CORS proxy URL - dynamically set based on environment
const proxyUrl = import.meta.env.MODE === 'production' 
  ? '/api/proxy/stripe'  // In production, use a relative path to the API route
  : import.meta.env.VITE_STRIPE_PROXY_URL || 'http://localhost:3030/proxy/stripe'; // In development, use localhost or VITE_STRIPE_PROXY_URL

/**
 * Retrieves the Stripe access token from environment or falls back to default
 * @returns The Stripe access token
 */
export const getStripeAccessToken = async (): Promise<string | null> => {
  try {
    // In production, we should never access the secret key directly from the client
    if (import.meta.env.MODE === 'production') {
      // Return null to indicate the server-side proxy should use its own key
      return null;
    }
    
    // In development, try to get the token from the environment
    // We avoid using localStorage for sensitive keys as it's not secure
    const token = import.meta.env.VITE_STRIPE_SECRET_KEY;
    
    if (token) {
      return token;
    }
    
    // Try to make a request to the proxy to get the default server-side key
    try {
      const response = await axios.get('http://localhost:3030');
      if (response.data && response.data.stripe_configured) {
        // Server has a key configured, we can use the proxy without providing a key
        return 'proxy_will_use_server_key';
      }
    } catch (err) {
      console.warn('Could not check proxy configuration:', err);
    }
    
    console.warn('No Stripe secret key found. Running in limited functionality mode.');
    return null;
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
 * Check if the stripe_connect_accounts table exists and create it if it doesn't
 */
const ensureTablesExist = async () => {
  try {
    // Check if the table exists first
    try {
      const { data, error } = await supabase.from('stripe_connect_accounts').select('count(*)', { count: 'exact', head: true });
      if (!error) {
        // Table exists
        return true;
      }
    } catch (error: any) {
      // Table might not exist
      if (error.message && error.message.includes('does not exist')) {
        try {
          // Try to execute execute_sql function
          const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
            query: `
              CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                account_id TEXT NOT NULL UNIQUE,
                charges_enabled BOOLEAN DEFAULT FALSE,
                payouts_enabled BOOLEAN DEFAULT FALSE,
                details_submitted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `
          });
          
          if (!sqlError) {
            console.log('Successfully created stripe_connect_accounts table');
            return true;
          } else if (sqlError.message && sqlError.message.includes('function') && sqlError.message.includes('does not exist')) {
            console.error('execute_sql function does not exist. Tables cannot be created automatically.');
            return false;
          } else {
            throw sqlError;
          }
        } catch (rpcError: any) {
          console.error('Error creating tables via RPC:', rpcError);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking tables existence:', error);
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
    // First, ensure we have the tables
    const tablesExist = await ensureTablesExist();
    
    if (!tablesExist) {
      throw new Error('Database tables not found. Please run the SQL migrations.');
    }
    
    // Try to save directly to the table
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
      console.error('Error saving to stripe_connect_accounts:', dbError);
      
      // If the table doesn't exist yet, the SQL migrations may not have been run
      if (dbError.code === '42P01') {
        console.error('stripe_connect_accounts table does not exist. Please run the SQL migrations.');
        throw new Error('Database table not found. Please ensure the required SQL migrations have been run.');
      }
      
      throw dbError;
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
    // First, ensure we have the tables
    const tablesExist = await ensureTablesExist();
    
    if (!tablesExist) {
      throw new Error('Database tables not found. Please run the SQL migrations.');
    }
    
    try {
      const { data, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (dbError: any) {
      // If the table doesn't exist, inform the user
      if (dbError.code === '42P01') {
        console.error('stripe_connect_accounts table does not exist. Please run the SQL migrations.');
        throw new Error('Database table not found. Please ensure the required SQL migrations have been run.');
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error retrieving Stripe Connect account from DB:', error);
    throw new Error(error.message || 'Failed to get Stripe Connect account');
  }
};
