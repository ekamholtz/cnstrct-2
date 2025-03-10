import { supabase } from "@/integrations/supabase/client";
import axios from "axios";

export class QBOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];
  private authEndpoint: string;
  private tokenEndpoint: string;
  
  constructor() {
    // For production, these should be environment variables
    this.clientId = "AB6pN0pnXfsBtCI1S03SYSdoRiSCVD2ZQDxDgR4yYvbDdEx4";
    this.clientSecret = "4zjveAX4tFhuxWx1sfgN3bE4zRVUquFun3YqVau";
    this.redirectUri = `${window.location.origin}/qbo/callback`;
    this.scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ];
    this.authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
    this.tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateRandomState();
    
    // Store state in localStorage for validation when the user returns
    localStorage.setItem('qbo_auth_state', state);
    localStorage.setItem('qbo_auth_user_id', userId);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: this.scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: state
    });
    
    return `${this.authEndpoint}?${params.toString()}`;
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
      return { success: false, error: 'Invalid state parameter' };
    }
    
    try {
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
      
      const { access_token, refresh_token, expires_in, x_refresh_token_expires_in, realmId } = tokenResponse.data;
      
      if (!access_token || !refresh_token || !realmId) {
        return { success: false, error: 'Missing required token information' };
      }
      
      // Get company info
      const companyInfo = await this.getCompanyInfo(access_token, realmId);
      
      // Store tokens in database
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('qbo_connections')
        .upsert({
          user_id: user?.id,
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
      
      return { 
        success: true, 
        companyId: realmId,
        companyName: companyInfo.companyName
      };
      
    } catch (error) {
      console.error("Error in QBO authorization:", error);
      return { success: false, error: 'Authorization failed' };
    }
  }
  
  /**
   * Get current user's QBO connection
   */
  async getConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user?.id)
      .single();
      
    if (error || !data) {
      return null;
    }
    
    return data;
  }
  
  /**
   * Refresh the QBO access token
   */
  async refreshToken(connectionId: string): Promise<string> {
    // Get the connection
    const { data: connection, error: fetchError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
      
    if (fetchError || !connection) {
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
    
    // Refresh the token
    try {
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
      const response = await axios.get(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );
      
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
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user?.id);
        
      if (error) {
        console.error("Error disconnecting from QBO:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      return false;
    }
  }
}
