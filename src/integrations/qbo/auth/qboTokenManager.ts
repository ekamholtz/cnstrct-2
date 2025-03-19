import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

/**
 * Handles token-related operations for QBO integration using a CORS proxy
 */
export class QBOTokenManager {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    // Use singleton instance instead of creating a new one
    this.config = QBOConfig.getInstance();
    
    // Get proxy URL dynamically based on environment
    this.proxyUrl = this.config.getProxyUrl();
    
    console.log("QBOTokenManager initialized with client ID:", this.config.clientId);
    console.log("QBOTokenManager environment:", this.config.isProduction ? "Production" : "Sandbox");
    console.log("QBOTokenManager using proxy URL:", this.proxyUrl);
  }
  
  /**
   * Exchange authorization code for tokens using CORS proxy
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId?: string;
  }> {
    console.log("Exchanging authorization code for tokens via CORS proxy...");
    console.log("Using proxy URL:", this.proxyUrl);
    console.log("Using client ID:", this.config.clientId);
    
    try {
      // Use the appropriate CORS proxy to avoid CORS issues
      const proxyResponse = await axios.post(`${this.proxyUrl}/token`, {
        code,
        redirectUri: this.config.redirectUri,
        clientId: this.config.clientId
      });
      
      if (!proxyResponse.data || proxyResponse.data.error) {
        console.error("Token exchange failed:", proxyResponse.data);
        throw new Error(proxyResponse.data?.error_description || 
                       proxyResponse.data?.error || 
                       "Token exchange failed with unknown error");
      }
      
      console.log("Token exchange successful");
      
      // Extract token data from response
      // Note: realmId might be missing in the token response, will be extracted from URL in the callback
      const tokenData = {
        access_token: proxyResponse.data.access_token,
        refresh_token: proxyResponse.data.refresh_token,
        expires_in: proxyResponse.data.expires_in || 3600, // Default to 1 hour if missing
        x_refresh_token_expires_in: proxyResponse.data.x_refresh_token_expires_in || 8726400, // Default to 101 days if missing
        realmId: proxyResponse.data.realmId // This might be undefined
      };
      
      return tokenData;
    } catch (error: any) {
      console.error("Error exchanging code for tokens:", error);
      
      // Enhanced error logging for better debugging
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      
      throw new Error(`Failed to exchange authorization code for tokens: ${error.message}`);
    }
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(connectionId: string): Promise<string> {
    try {
      console.log("Refreshing QBO access token for connection:", connectionId);
      
      // Get the connection from the database
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('id', connectionId)
        .single();
        
      if (error || !connection) {
        console.error("Connection not found:", error);
        throw new Error(`Connection not found: ${error?.message || "Unknown error"}`);
      }
      
      // Check if the token is already expired
      const now = new Date();
      const expiresAt = new Date(connection.expires_at);
      
      // If the token is not expired, return it
      if (expiresAt > now) {
        console.log("Access token still valid, returning existing token");
        return connection.access_token;
      }
      
      console.log("Access token expired, refreshing...");
      
      // Check if the refresh token is expired
      const refreshTokenExpiresAt = new Date(connection.refresh_token_expires_at);
      if (refreshTokenExpiresAt <= now) {
        console.error("Refresh token expired, need to re-authenticate");
        throw new Error("Refresh token expired, user needs to re-authenticate");
      }
      
      // Use the proxy for token refresh
      const proxyResponse = await axios.post(`${this.proxyUrl}/refresh`, {
        refreshToken: connection.refresh_token,
        clientId: this.config.clientId
      });
      
      if (!proxyResponse.data || proxyResponse.data.error) {
        console.error("Token refresh failed:", proxyResponse.data);
        throw new Error(proxyResponse.data?.error_description || 
                       proxyResponse.data?.error || 
                       "Token refresh failed with unknown error");
      }
      
      console.log("Token refresh successful");
      
      // Update the connection in the database
      const updatedData = {
        access_token: proxyResponse.data.access_token,
        refresh_token: proxyResponse.data.refresh_token,
        token_type: proxyResponse.data.token_type,
        expires_in: proxyResponse.data.expires_in,
        x_refresh_token_expires_in: proxyResponse.data.x_refresh_token_expires_in,
        expires_at: new Date(Date.now() + (proxyResponse.data.expires_in * 1000)).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + (proxyResponse.data.x_refresh_token_expires_in * 1000)).toISOString(),
        last_refreshed_at: new Date().toISOString()
      };
      
      const { data: updatedConnection, error: updateError } = await supabase
        .from('qbo_connections')
        .update(updatedData)
        .eq('id', connectionId)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating connection:", updateError);
        throw new Error(`Failed to update connection: ${updateError.message}`);
      }
      
      console.log("Connection updated with refreshed tokens");
      return proxyResponse.data.access_token;
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      
      // Enhanced error logging for better debugging
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }
  
  /**
   * Store QBO connection information in the database
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any): Promise<any> {
    try {
      console.log("Storing QBO connection for user:", userId);
      console.log("Token data received:", JSON.stringify({
        access_token: "[REDACTED]",
        realmId: tokenData.realmId,
        expires_in: tokenData.expires_in
      }));
      
      // Extract realmId from URL if not present in token data
      let realmId = tokenData.realmId;
      
      // If realmId is missing, try to extract it from URL parameters
      if (!realmId && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        realmId = urlParams.get('realmId');
        console.log("Extracted realmId from URL:", realmId);
      }
      
      // Validate that we have a realmId
      if (!realmId) {
        console.error("No realmId found in token data or URL parameters");
        throw new Error("Missing realmId, unable to store connection");
      }
      
      // Make sure we have valid numeric values for expiration times
      const expiresIn = parseInt(String(tokenData.expires_in || '3600'), 10);
      const refreshTokenExpiresIn = parseInt(String(tokenData.x_refresh_token_expires_in || '8726400'), 10);
      
      // Safely create expiration dates with validation
      let expiresAt, refreshTokenExpiresAt, lastRefreshedAt;
      try {
        expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
        refreshTokenExpiresAt = new Date(Date.now() + (refreshTokenExpiresIn * 1000)).toISOString();
        lastRefreshedAt = new Date().toISOString();
      } catch (error) {
        console.error("Error creating date values:", error);
        // Use fallback dates if conversion fails
        const now = new Date();
        expiresAt = now.toISOString();
        now.setDate(now.getDate() + 90); // 90 days for refresh token
        refreshTokenExpiresAt = now.toISOString();
        lastRefreshedAt = new Date().toISOString();
      }
      
      // Check for existing connection
      const { data: existingConnection, error: findError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', realmId)
        .single();
      
      const connectionData = {
        user_id: userId,
        company_id: realmId,
        company_name: companyInfo?.CompanyName || 'Unknown Company',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'bearer',
        expires_in: expiresIn,
        x_refresh_token_expires_in: refreshTokenExpiresIn,
        expires_at: expiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        is_sandbox: !this.config.isProduction,
        client_id: this.config.clientId,
        last_refreshed_at: lastRefreshedAt
      };
      
      let result;
      
      if (existingConnection) {
        console.log("Updating existing QBO connection:", existingConnection.id);
        
        // Update existing connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .update(connectionData)
          .eq('id', existingConnection.id)
          .select()
          .single();
          
        if (error) {
          console.error("Error updating QBO connection:", error);
          throw error;
        }
        
        result = data;
      } else {
        console.log("Creating new QBO connection");
        
        // Create new connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .insert(connectionData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating QBO connection:", error);
          throw error;
        }
        
        result = data;
      }
      
      console.log("QBO connection stored successfully:", result.id);
      return result;
    } catch (err) {
      console.error("Error storing QBO connection:", err);
      throw err;
    }
  }
}
