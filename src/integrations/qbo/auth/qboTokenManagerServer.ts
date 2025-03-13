import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfigFixed";

/**
 * Handles token-related operations for QBO integration using server-side proxy
 */
export class QBOTokenManager {
  private config: QBOConfig;
  
  constructor() {
    this.config = new QBOConfig();
  }
  
  /**
   * Exchange authorization code for tokens using server-side proxy
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }> {
    console.log("Exchanging authorization code for tokens via server proxy...");
    
    try {
      // First try using the server-side proxy
      const proxyResponse = await axios.post('/api/qbo/token-exchange', {
        code,
        redirectUri: this.config.redirectUri,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret
      });
      
      console.log("Token exchange successful via server proxy");
      return proxyResponse.data;
    } catch (proxyError) {
      console.error("Server proxy token exchange failed:", proxyError);
      console.log("Falling back to direct token exchange...");
      
      // Fall back to direct token exchange if server proxy fails
      try {
        // Prepare the request body
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri
        });
        
        // Prepare the authorization header
        const authString = `${this.config.clientId}:${this.config.clientSecret}`;
        const base64Auth = btoa(authString);
        
        // Make the token request with error handling
        const tokenResponse = await axios.post(
          this.config.tokenEndpoint,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${base64Auth}`,
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log("Direct token exchange successful");
        return tokenResponse.data;
      } catch (directError: any) {
        console.error("Direct token exchange also failed:", directError);
        
        if (directError.response) {
          console.error("Response error data:", directError.response.data);
          console.error("Response error status:", directError.response.status);
        }
        
        throw new Error("Failed to exchange authorization code for tokens: " + 
                       (directError.message || "Unknown error"));
      }
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
      
      try {
        // Try server-side proxy first
        const proxyResponse = await axios.post('/api/qbo/token-refresh', {
          refreshToken: connection.refresh_token,
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret
        });
        
        const { access_token, refresh_token, expires_in } = proxyResponse.data;
        
        // Update tokens in database
        await this.updateTokensInDatabase(connectionId, access_token, refresh_token, expires_in);
        
        return access_token;
      } catch (proxyError) {
        console.error("Server proxy token refresh failed:", proxyError);
        console.log("Falling back to direct token refresh...");
        
        // Fall back to direct token refresh
        const tokenResponse = await axios.post(
          this.config.tokenEndpoint,
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: connection.refresh_token
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        // Update tokens in database
        await this.updateTokensInDatabase(connectionId, access_token, refresh_token, expires_in);
        
        return access_token;
      }
    } catch (error) {
      console.error("Error in refresh token process:", error);
      throw new Error('Failed to refresh token');
    }
  }
  
  /**
   * Update tokens in the database
   */
  private async updateTokensInDatabase(
    connectionId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<void> {
    const { error } = await supabase
      .from('qbo_connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);
      
    if (error) {
      console.error("Error updating QBO tokens:", error);
      throw new Error('Failed to update tokens');
    }
    
    console.log("QBO token successfully refreshed");
  }
  
  /**
   * Store QBO connection in database
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any): Promise<void> {
    const { access_token, refresh_token, expires_in, realmId } = tokenData;
    
    console.log("Storing QBO connection for user:", userId);
    
    try {
      const { error } = await supabase
        .from('qbo_connections')
        .upsert({
          user_id: userId,
          company_id: realmId,
          company_name: companyInfo.companyName,
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + (expires_in * 1000)).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO tokens:", error);
        throw new Error('Failed to store connection information');
      }
      
      console.log("QBO connection successfully established");
    } catch (error) {
      console.error("Error in store connection process:", error);
      throw error;
    }
  }
}
