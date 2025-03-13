import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

/**
 * Handles token-related operations for QBO integration
 */
export class QBOTokenManager {
  private config: QBOConfig;
  
  constructor() {
    this.config = new QBOConfig();
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }> {
    console.log("Exchanging authorization code for tokens...");
    console.log("Redirect URI:", this.config.redirectUri);
    
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
      
      console.log("Making token request to:", this.config.tokenEndpoint);
      console.log("Request params:", params.toString());
      
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
      
      console.log("Token response received", { 
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      });
      
      if (!tokenResponse.data.access_token) {
        console.error("No access token in response", tokenResponse.data);
        throw new Error("No access token received from QuickBooks");
      }
      
      return tokenResponse.data;
    } catch (error: any) {
      console.error("Error exchanging code for tokens:", error);
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
        console.error("Response error headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
      }
      
      throw error;
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
        // Refresh the token
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
            timeout: 10000 // 10 second timeout
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
      } catch (error: any) {
        console.error("Error refreshing token:", error);
        
        if (error.response) {
          console.error("Response error data:", error.response.data);
          console.error("Response error status:", error.response.status);
        }
        
        throw error;
      }
    } catch (error) {
      console.error("Error in refresh token process:", error);
      throw new Error('Failed to refresh token');
    }
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
