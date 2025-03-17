import axios from 'axios';

// CORS proxy URL
const proxyUrl = 'http://localhost:3030/proxy/stripe';

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
