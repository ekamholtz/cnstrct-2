import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

/**
 * Handles token-related operations for QBO integration
 */
export class QBOTokenManager {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    
    // Determine proxy URL based on environment
    // IMPORTANT: We need to check if we're in a browser environment first
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.replace('preview--', '');
      console.log("QBOTokenManager - Current hostname:", hostname);
      
      if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
        // Local development
        this.proxyUrl = "http://localhost:3030/proxy";
      } else {
        // Production environment - use relative URL to avoid CORS issues
        this.proxyUrl = "/api/proxy";
      }
    } else {
      // Default to production proxy URL if not in browser
      this.proxyUrl = "/api/proxy";
    }
    
    console.log("QBOTokenManager initialized with proxy URL:", this.proxyUrl);
    console.log("QBOTokenManager - Is production environment:", this.config.isProduction);
  }
  
  /**
   * Get the appropriate proxy URL based on the current environment
   */
  private getProxyUrl(): string {
    // IMPORTANT: We need to check if we're in a browser environment first
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.replace('preview--', '');
      
      if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
        return "http://localhost:3030/proxy";
      }
    }
    
    // Production environment or non-browser context
    return "/api/proxy";
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
    console.log("Exchanging authorization code for tokens via CORS proxy...");
    
    try {
      // Always use the method to get the correct proxy URL
      const proxyUrl = this.getProxyUrl();
      
      console.log("Token exchange details:", {
        proxyUrl,
        redirectUri: this.config.redirectUri,
        clientId: this.config.clientId,
        isProduction: this.config.isProduction
      });
      
      // Use the CORS proxy to avoid CORS issues
      const proxyResponse = await axios.post(`${proxyUrl}/token`, {
        code,
        redirectUri: this.config.redirectUri,
        // In production, we don't send the client secret from the client
        // The server will use the environment variables
        clientId: this.config.clientId
      });
      
      console.log("Token exchange successful via proxy");
      
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
                     (error.response?.data?.error_description || 
                      error.response?.data?.error || 
                      error.message || 
                      "Unknown error"));
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
        console.log("QBO token still valid, not refreshing");
        return connection.access_token;
      }
      
      console.log("Refreshing QBO token for connection:", connectionId);
      
      // Always use the method to get the correct proxy URL
      const proxyUrl = this.getProxyUrl();
      console.log("Using proxy URL for token refresh:", proxyUrl);
      
      // Use the CORS proxy to refresh the token
      try {
        const proxyResponse = await axios.post(`${proxyUrl}/refresh`, {
          refreshToken: connection.refresh_token
          // Don't send clientId and clientSecret - the proxy will use defaults
        }, {
          timeout: 15000 // Increase timeout to 15 seconds
        });
        
        const { access_token, refresh_token, expires_in } = proxyResponse.data;
        
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
      } catch (proxyError: any) {
        console.error("Error from proxy server:", proxyError.message);
        if (proxyError.response) {
          console.error("Proxy server response:", proxyError.response.data);
          console.error("Proxy server status:", proxyError.response.status);
        }
        throw new Error(`Proxy server error: ${proxyError.message}`);
      }
    } catch (error: any) {
      console.error("Error refreshing QBO token:", error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
  
  /**
   * Store QBO connection in database
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any): Promise<void> {
    const { access_token, refresh_token, expires_in, realmId } = tokenData;
    
    console.log("Storing QBO connection for user:", userId);
    
    const { error } = await supabase
      .from('qbo_connections')
      .upsert({
        user_id: userId,
        company_id: realmId,
        company_name: companyInfo.CompanyName || companyInfo.companyName,
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + (expires_in * 1000)).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error storing QBO tokens:", error);
      throw new Error('Failed to store QBO connection');
    }
    
    console.log("QBO connection successfully stored");
  }
}
