/**
 * StripeServiceProxy
 * Base class for all Stripe API services
 * Uses a CORS proxy to avoid CORS issues with Stripe APIs
 */

import axios from 'axios';
import StripeConfig from '../config/stripeConfig';
import StripeTokenManager from '../auth/stripeTokenManager';

class StripeServiceProxy {
  protected config: StripeConfig;
  protected tokenManager: StripeTokenManager;
  protected proxyUrl: string;
  
  constructor() {
    this.config = StripeConfig.getInstance();
    this.tokenManager = new StripeTokenManager();
    this.proxyUrl = this.config.proxyUrl;
    
    console.log(`StripeServiceProxy initialized with proxy URL: ${this.proxyUrl}`);
  }
  
  /**
   * Make a request to the Stripe API via the CORS proxy
   * @param endpoint Stripe API endpoint (e.g., 'charges', 'customers')
   * @param method HTTP method
   * @param accountId Stripe account ID (for Connect)
   * @param accessToken Access token for the account
   * @param data Request data
   */
  protected async makeRequest(
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    accountId: string,
    accessToken: string,
    data: any = null
  ): Promise<any> {
    try {
      const response = await axios.post(`${this.proxyUrl}/request`, {
        endpoint,
        method,
        accountId,
        accessToken,
        data
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error making Stripe API request to ${endpoint}:`, error);
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        throw new Error(`Stripe API error: ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from Stripe API');
      } else {
        // Something happened in setting up the request
        throw new Error(`Error setting up Stripe API request: ${error.message}`);
      }
    }
  }
  
  /**
   * Check if the user has a valid Stripe Connect account
   * @param userId User ID
   */
  async hasValidAccount(userId: string): Promise<boolean> {
    return this.tokenManager.hasValidConnectAccount(userId);
  }
}

export default StripeServiceProxy;
