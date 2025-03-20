/**
 * StripeTokenManager
 * Handles token exchange, refreshing, and storage for Stripe Connect
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import StripeConfig from '../config/stripeConfig';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StripeConnectionData {
  id?: string;
  user_id: string;
  account_id: string;
  access_token: string;
  refresh_token?: string;
  publishable_key?: string;
  scope?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StripeConnectAccountData {
  id?: string;
  user_id: string;
  account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StripeTokenExchangeResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
  stripe_user_id: string;
  stripe_publishable_key?: string;
}

export interface StripeAccountInfo {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  email?: string;
  business_name?: string;
}

class StripeTokenManager {
  private config: StripeConfig;
  private proxyUrl: string;
  
  constructor() {
    this.config = StripeConfig.getInstance();
    this.proxyUrl = this.config.proxyUrl;
    console.log(`StripeTokenManager initialized with proxy URL: ${this.proxyUrl}`);
  }
  
  /**
   * Exchange authorization code for access token
   * @param code Authorization code from Stripe
   * @param userId User ID to associate with the connection
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<StripeConnectionData> {
    console.log('Exchanging authorization code for tokens...');
    
    try {
      // Prepare the token exchange request
      const proxyResponse = await axios.post(`${this.proxyUrl}/token`, {
        code,
        grant_type: 'authorization_code',
      });
      
      console.log('Token exchange successful');
      
      // Extract token data
      const tokenData = proxyResponse.data as StripeTokenExchangeResponse;
      
      // Get account information
      const accountInfo = await this.getAccountInfo(tokenData.stripe_user_id, tokenData.access_token);
      
      // Store the connection
      return await this.storeConnection(userId, tokenData, accountInfo);
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }
  
  /**
   * Get account information from Stripe
   * @param accountId Stripe account ID
   * @param accessToken Access token for the account
   */
  async getAccountInfo(accountId: string, accessToken: string): Promise<StripeAccountInfo> {
    console.log(`Getting account info for accountId: ${accountId}`);
    
    try {
      const response = await axios.post(`${this.proxyUrl}/account`, {
        accountId,
        accessToken
      });
      
      console.log('Account info retrieved successfully');
      
      return {
        id: response.data.id,
        charges_enabled: response.data.charges_enabled,
        payouts_enabled: response.data.payouts_enabled,
        details_submitted: response.data.details_submitted,
        email: response.data.email,
        business_name: response.data.business_name || response.data.display_name
      };
    } catch (error: any) {
      console.error('Error getting account info:', error);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }
  
  /**
   * Store Stripe connection in the database
   * @param userId User ID
   * @param tokenData Token data from Stripe
   * @param accountInfo Account information
   */
  async storeConnection(
    userId: string,
    tokenData: StripeTokenExchangeResponse,
    accountInfo: StripeAccountInfo
  ): Promise<StripeConnectionData> {
    console.log(`Storing Stripe connection for user: ${userId}`);
    
    try {
      // Check if connection already exists
      const { data: existingConnection, error: findError } = await supabase
        .from('stripe_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', tokenData.stripe_user_id)
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        console.error('Error checking for existing connection:', findError);
        throw findError;
      }
      
      // Prepare connection data
      const connectionData: StripeConnectionData = {
        user_id: userId,
        account_id: tokenData.stripe_user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        publishable_key: tokenData.stripe_publishable_key,
        scope: tokenData.scope
      };
      
      let result;
      
      if (existingConnection) {
        console.log('Updating existing Stripe connection:', existingConnection.id);
        
        // Update existing connection
        const { data, error } = await supabase
          .from('stripe_connections')
          .update(connectionData)
          .eq('id', existingConnection.id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating Stripe connection:', error);
          throw error;
        }
        
        result = data;
      } else {
        console.log('Creating new Stripe connection');
        
        // Create new connection
        const { data, error } = await supabase
          .from('stripe_connections')
          .insert(connectionData)
          .select()
          .single();
          
        if (error) {
          console.error('Error creating Stripe connection:', error);
          throw error;
        }
        
        result = data;
      }
      
      // Store account information separately
      await this.storeAccountInfo(userId, accountInfo);
      
      return result;
    } catch (error: any) {
      console.error('Error storing Stripe connection:', error);
      throw new Error(`Failed to store Stripe connection: ${error.message}`);
    }
  }
  
  /**
   * Store Stripe account information
   * @param userId User ID
   * @param accountInfo Account information
   */
  private async storeAccountInfo(userId: string, accountInfo: StripeAccountInfo): Promise<void> {
    console.log(`Storing Stripe account info for user: ${userId}`);
    
    try {
      // Check if account info already exists
      const { data: existingAccount, error: findError } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', accountInfo.id)
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        console.error('Error checking for existing account:', findError);
        throw findError;
      }
      
      // Prepare account data
      const accountData: StripeConnectAccountData = {
        user_id: userId,
        account_id: accountInfo.id,
        charges_enabled: accountInfo.charges_enabled,
        payouts_enabled: accountInfo.payouts_enabled,
        details_submitted: accountInfo.details_submitted
      };
      
      if (existingAccount) {
        console.log('Updating existing Stripe account info:', existingAccount.id);
        
        // Update existing account
        const { error } = await supabase
          .from('stripe_connect_accounts')
          .update(accountData)
          .eq('id', existingAccount.id);
          
        if (error) {
          console.error('Error updating Stripe account info:', error);
          throw error;
        }
      } else {
        console.log('Creating new Stripe account info');
        
        // Create new account
        const { error } = await supabase
          .from('stripe_connect_accounts')
          .insert(accountData);
          
        if (error) {
          console.error('Error creating Stripe account info:', error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error storing Stripe account info:', error);
      throw new Error(`Failed to store Stripe account info: ${error.message}`);
    }
  }
  
  /**
   * Get Stripe connection by user ID
   * @param userId User ID
   */
  async getConnectionByUserId(userId: string): Promise<StripeConnectionData | null> {
    console.log(`Getting Stripe connection for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('stripe_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No connection found
          console.log(`No Stripe connection found for user: ${userId}`);
          return null;
        }
        console.error('Error getting Stripe connection:', error);
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error getting Stripe connection:', error);
      throw new Error(`Failed to get Stripe connection: ${error.message}`);
    }
  }
  
  /**
   * Check if a user has a valid Stripe Connect account
   * @param userId User ID
   */
  async hasValidConnectAccount(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('charges_enabled', true)
        .eq('details_submitted', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No account found or not valid
          return false;
        }
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking for valid Stripe account:', error);
      return false;
    }
  }
}

export default StripeTokenManager;
