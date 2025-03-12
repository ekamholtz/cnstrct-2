
import { supabase } from "@/integrations/supabase/client";
import axios from "axios";

export class QBOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];
  private authEndpoint: string;
  private tokenEndpoint: string;
  private apiBaseUrl: string;
  private isProduction: boolean;
  
  constructor() {
    // Environment detection - could be moved to configuration
    this.isProduction = window.location.hostname !== 'localhost' && 
                         !window.location.hostname.includes('127.0.0.1');
    
    // Updated sandbox credentials
    this.clientId = "AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j";
    this.clientSecret = "4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau";
    
    // Important: Using a clean domain format without port for QBO registration
    // The actual redirect will still use the port, but the registration in QBO doesn't like ports
    // Intuit requires the domain to be just "localhost" for local development
    const domain = this.isProduction ? window.location.origin : "https://localhost";
    this.redirectUri = `${domain}/qbo/callback`;
    this.scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ];

    // Use correct endpoints based on environment
    this.authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
    this.tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    
    // API base URL - switch between sandbox and production
    this.apiBaseUrl = this.isProduction 
      ? "https://quickbooks.api.intuit.com/v3"
      : "https://sandbox-quickbooks.api.intuit.com/v3";
      
    console.log("QBO Auth Service initialized with:", {
      environment: this.isProduction ? "Production" : "Sandbox",
      apiBaseUrl: this.apiBaseUrl,
      clientId: this.clientId,
      redirectUri: this.redirectUri
    });
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateRandomState();
    
    // Store state in localStorage for validation when the user returns
    localStorage.setItem('qbo_auth_state', state);
    localStorage.setItem('qbo_auth_user_id', userId);
    
    // Build the authorization URL with correct parameters
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: this.scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: state
    });
    
    const authUrl = `${this.authEndpoint}?${params.toString()}`;
    console.log("Generated QBO Auth URL:", authUrl);
    return authUrl;
  }
  
  /**
   * Handle the OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<{
    success: boolean;
    companyId?: string;
    companyName?: string;
    error?: string;
  }> {
    // Validate state to prevent CSRF attacks
    const storedState = localStorage.getItem('qbo_auth_state');
    if (state !== storedState) {
      console.error("State mismatch in QBO callback", { provided: state, stored: storedState });
      return { success: false, error: 'Invalid state parameter' };
    }
    
    try {
      console.log("Exchanging authorization code for tokens...");
      
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
          }
        }
      );
      
      console.log("Token response received", { status: tokenResponse.status });
      
      const { access_token, refresh_token, expires_in, x_refresh_token_expires_in, realmId } = tokenResponse.data;
      
      if (!access_token || !refresh_token || !realmId) {
        console.error("Missing required token information", tokenResponse.data);
        return { success: false, error: 'Missing required token information' };
      }
      
      // Get company info
      const companyInfo = await this.getCompanyInfo(access_token, realmId);
      
      // Store tokens in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found when storing QBO tokens");
        return { success: false, error: 'User authentication required' };
      }
      
      console.log("Storing QBO connection for user:", user.id);
      
      const { error } = await supabase
        .from('qbo_connections')
        .upsert({
          user_id: user.id,
          company_id: realmId,
          company_name: companyInfo.companyName,
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + (expires_in * 1000)).toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO tokens:", error);
        return { success: false, error: 'Failed to store connection information' };
      }
      
      // Clear the state from localStorage
      localStorage.removeItem('qbo_auth_state');
      localStorage.removeItem('qbo_auth_user_id');
      
      console.log("QBO connection successfully established", { 
        companyId: realmId,
        companyName: companyInfo.companyName
      });
      
      return { 
        success: true, 
        companyId: realmId,
        companyName: companyInfo.companyName
      };
      
    } catch (error: any) {
      console.error("Error in QBO authorization:", error);
      const errorMessage = error.response?.data?.error_description || 
                          error.response?.data?.error ||
                          error.message ||
                          'Authorization failed';
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Get current user's QBO connection
   */
  async getConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found when getting QBO connection");
        return null;
      }
      
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.log("No QBO connection found for user:", user.id);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error getting QBO connection:", err);
      return null;
    }
  }
  
  /**
   * Refresh the QBO access token
   */
  async refreshToken(connectionId: string): Promise<string> {
    try {
      // Get the connection
      const { data: connection, error: fetchError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('id', connectionId)
        .single();
        
      if (fetchError || !connection) {
        console.error("QBO connection not found for ID:", connectionId);
        throw new Error('QBO connection not found');
      }
      
      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = new Date(connection.expires_at).getTime();
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      if (expiresAt - now > fiveMinutesInMs) {
        // Token is still valid
        return connection.access_token;
      }
      
      console.log("Refreshing QBO token for connection:", connectionId);
      
      // Refresh the token
      const tokenResponse = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Update the tokens in the database
      const { error } = await supabase
        .from('qbo_connections')
        .update({
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + (expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
        
      if (error) {
        console.error("Error updating QBO tokens:", error);
        throw new Error('Failed to update tokens');
      }
      
      console.log("QBO token successfully refreshed");
      return access_token;
    } catch (error) {
      console.error("Error refreshing QBO token:", error);
      throw new Error('Failed to refresh token');
    }
  }
  
  /**
   * Get company information from QBO
   */
  private async getCompanyInfo(accessToken: string, realmId: string): Promise<{
    companyName: string;
    [key: string]: any;
  }> {
    try {
      console.log("Getting company info from QBO...");
      
      const url = `${this.apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`;
      console.log("Company info URL:", url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log("Company info retrieved successfully");
      
      return {
        companyName: response.data.CompanyInfo.CompanyName,
        ...response.data.CompanyInfo
      };
    } catch (error) {
      console.error("Error getting company info:", error);
      return { companyName: 'Unknown Company' };
    }
  }
  
  /**
   * Generate a random state parameter for OAuth
   */
  private generateRandomState(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found when disconnecting QBO");
        return false;
      }
      
      console.log("Disconnecting QBO for user:", user.id);
      
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error disconnecting from QBO:", error);
        return false;
      }
      
      console.log("QBO successfully disconnected");
      return true;
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      return false;
    }
  }
}
