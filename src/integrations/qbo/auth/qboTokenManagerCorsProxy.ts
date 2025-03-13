import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfigFixed";

/**
 * Handles token-related operations for QBO integration using a local CORS proxy
 */
export class QBOTokenManager {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    this.config = new QBOConfig();
    
    // Use local CORS proxy for development
    this.proxyUrl = "http://localhost:3030/proxy";
  }
  
  /**
   * Exchange authorization code for tokens using local CORS proxy
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }> {
    console.log("Exchanging authorization code for tokens via CORS proxy...");
    
    try {
      // Use the local CORS proxy to avoid CORS issues
      const proxyResponse = await axios.post(`${this.proxyUrl}/token`, {
        code,
        redirectUri: this.config.redirectUri,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret
      });
      
      console.log("Token exchange successful via CORS proxy");
      
      // Extract realmId from the URL query parameters (it's not in the token response)
      const urlParams = new URLSearchParams(window.location.search);
      const realmId = urlParams.get('realmId');
      
      if (!realmId) {
        throw new Error("Missing realmId in callback URL");
      }
      
      // Add realmId to the response
      return {
        ...proxyResponse.data,
        realmId
      };
    } catch (error: any) {
      console.error("CORS proxy token exchange failed:", error);
      
      // Provide detailed error information
      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
      }
      
      throw new Error("Failed to exchange authorization code for tokens: " + 
                     (error.message || "Unknown error"));
    }
  }
  
  /**
   * Refresh the QBO access token using local CORS proxy
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
      
      // Use the local CORS proxy to refresh the token
      const proxyResponse = await axios.post(`${this.proxyUrl}/refresh`, {
        refreshToken: connection.refresh_token,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret
      });
      
      const { access_token, refresh_token, expires_in } = proxyResponse.data;
      
      // Update tokens in database
      await this.updateTokensInDatabase(connectionId, access_token, refresh_token, expires_in);
      
      return access_token;
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
