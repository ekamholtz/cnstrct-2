
// QBO Authentication Service
import { QBOConnectionService } from './qboConnectionService';
import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

// QBO Environment Config
const QBO_CLIENT_ID = import.meta.env.VITE_QBO_CLIENT_ID || '';
const QBO_REDIRECT_URI = import.meta.env.VITE_QBO_REDIRECT_URI || '';
const QBO_ENVIRONMENT = import.meta.env.VITE_QBO_ENVIRONMENT || 'sandbox';

// Endpoints
const QBO_AUTHORIZATION_ENDPOINT = QBO_ENVIRONMENT === 'sandbox' 
  ? 'https://appcenter.intuit.com/connect/oauth2'
  : 'https://appcenter.intuit.com/connect/oauth2';

/**
 * Service for handling QuickBooks Online authentication
 */
export class QBOAuthService {
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.connectionService = new QBOConnectionService();
  }
  
  /**
   * Start the OAuth 2.0 flow by redirecting to QBO
   * @param gcAccountId The GC account ID to associate with this QBO connection
   * @returns void
   */
  async authorize(gcAccountId: string): Promise<string> {
    try {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a state parameter to prevent CSRF
      const state = JSON.stringify({
        userId: user.id,
        gcAccountId,
        nonce: uuidv4()
      });
      
      // Store the state in session storage for verification later
      sessionStorage.setItem('qbo_auth_state', state);
      
      // Build the authorization URL
      const authorizationUrl = this.buildAuthorizationUrl(state);
      
      return authorizationUrl;
    } catch (error) {
      console.error('Error initializing QBO authorization:', error);
      throw error;
    }
  }
  
  /**
   * Handle the OAuth 2.0 callback from QBO
   * @param code The authorization code from QBO
   * @param state The state parameter from QBO
   * @returns Promise resolving to the QBO connection
   */
  async handleCallback(code: string, state: string): Promise<any> {
    try {
      // Verify the state parameter
      const storedState = sessionStorage.getItem('qbo_auth_state');
      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter');
      }
      
      // Parse the state to get user and GC account IDs
      const { userId, gcAccountId } = JSON.parse(state);
      if (!userId || !gcAccountId) {
        throw new Error('Invalid state data');
      }
      
      // Exchange the authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Store the connection in the database
      const connection = {
        user_id: userId,
        gc_account_id: gcAccountId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        realm_id: tokenResponse.realmId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      };
      
      await this.connectionService.saveConnection(connection);
      
      // Clear the state from session storage
      sessionStorage.removeItem('qbo_auth_state');
      
      return connection;
    } catch (error) {
      console.error('Error handling QBO callback:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from QBO by removing the connection
   * @param userId The user ID
   */
  async disconnect(userId: string): Promise<void> {
    try {
      await this.connectionService.deleteConnection(userId);
    } catch (error) {
      console.error('Error disconnecting from QBO:', error);
      throw error;
    }
  }
  
  /**
   * Build the QBO authorization URL
   * @param state The state parameter
   * @returns The authorization URL
   */
  private buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: QBO_CLIENT_ID,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: QBO_REDIRECT_URI,
      state: state
    });
    
    return `${QBO_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
  }
  
  /**
   * Exchange the authorization code for tokens
   * @param code The authorization code
   * @returns Promise resolving to the token response
   */
  private async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      // This would normally make an HTTP request to QBO token endpoint
      // But we're mocking it here since we can't make real requests from the frontend
      // In a real app, this would be handled by a server-side function
      console.log('Mocking token exchange for code:', code);
      
      // Return a mock token response
      return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        realmId: 'mock_realm_id'
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }
}

export const qboAuth = new QBOAuthService();
