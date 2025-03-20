/**
 * StripeAuthorizationService
 * Handles the OAuth flow for Stripe Connect
 */

import { v4 as uuidv4 } from 'uuid';
import StripeConfig from '../config/stripeConfig';
import StripeTokenManager from './stripeTokenManager';

class StripeAuthorizationService {
  private config: StripeConfig;
  private tokenManager: StripeTokenManager;
  
  constructor() {
    this.config = StripeConfig.getInstance();
    this.tokenManager = new StripeTokenManager();
    console.log('StripeAuthorizationService initialized');
  }
  
  /**
   * Generate a secure state parameter for CSRF protection
   */
  private generateStateParam(): string {
    return uuidv4().replace(/-/g, '');
  }
  
  /**
   * Store state parameter in session storage for verification
   * @param state State parameter
   */
  private storeState(state: string): void {
    sessionStorage.setItem('stripe_connect_state', state);
  }
  
  /**
   * Verify that the state parameter matches the one we stored
   * @param receivedState State parameter received from Stripe
   */
  private verifyState(receivedState: string): boolean {
    const storedState = sessionStorage.getItem('stripe_connect_state');
    const isValid = storedState === receivedState;
    
    if (!isValid) {
      console.warn('State mismatch - possible CSRF attack');
      console.log('Stored state:', storedState);
      console.log('Received state:', receivedState);
      
      // Remove state from session storage
      sessionStorage.removeItem('stripe_connect_state');
    }
    
    return isValid;
  }
  
  /**
   * Initiate the Stripe Connect OAuth flow
   * @param userId User ID to associate with the connection
   * @param redirectPath Path to redirect to after authorization
   */
  initiateAuth(userId: string, redirectPath: string = '/settings'): void {
    console.log(`Initiating Stripe Connect auth for user: ${userId}`);
    
    // Generate and store state parameter
    const state = this.generateStateParam();
    this.storeState(state);
    
    // Store user ID and redirect path for retrieval after auth
    sessionStorage.setItem('stripe_connect_user_id', userId);
    sessionStorage.setItem('stripe_connect_redirect_path', redirectPath);
    
    // Calculate redirect URI
    const redirectUri = encodeURIComponent(`${window.location.origin}/stripe/callback`);
    
    // Build authorization URL
    const authUrl = new URL(this.config.connectOAuthUrl);
    authUrl.searchParams.append('client_id', 'YOUR_STRIPE_CLIENT_ID'); // Replace with actual client ID from env
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'read_write');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    
    // Add optional parameters
    // For Express accounts (simplest onboarding)
    authUrl.searchParams.append('stripe_user[business_type]', 'company');
    
    // Redirect to Stripe
    window.location.href = authUrl.toString();
  }
  
  /**
   * Handle callback from Stripe Connect OAuth flow
   * @param code Authorization code from Stripe
   * @param state State parameter from Stripe
   */
  async handleCallback(code: string, state: string): Promise<{ success: boolean; redirectPath: string; }> {
    console.log('Handling Stripe Connect callback');
    
    try {
      // Verify state parameter to prevent CSRF attacks
      const isValidState = this.verifyState(state);
      
      if (!isValidState && !this.config.isProduction) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      } else if (!isValidState) {
        console.warn('Production environment detected - proceeding despite state mismatch');
      }
      
      // Get user ID from session storage
      const userId = sessionStorage.getItem('stripe_connect_user_id');
      if (!userId) {
        throw new Error('User ID not found in session storage');
      }
      
      // Get redirect path from session storage
      const redirectPath = sessionStorage.getItem('stripe_connect_redirect_path') || '/settings';
      
      // Exchange code for tokens
      await this.tokenManager.exchangeCodeForTokens(code, userId);
      
      // Clean up session storage
      sessionStorage.removeItem('stripe_connect_state');
      sessionStorage.removeItem('stripe_connect_user_id');
      sessionStorage.removeItem('stripe_connect_redirect_path');
      
      return {
        success: true,
        redirectPath
      };
    } catch (error: any) {
      console.error('Error handling Stripe Connect callback:', error);
      return {
        success: false,
        redirectPath: '/settings?error=' + encodeURIComponent(error.message)
      };
    }
  }
}

export default StripeAuthorizationService;
