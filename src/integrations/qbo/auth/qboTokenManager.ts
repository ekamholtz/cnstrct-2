import axios from "axios";
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";
import { QBOEdgeFunctionService } from "@/lib/qbo/qboEdgeFunctionService";

/**
 * Handles token-related operations for QBO integration using Supabase Edge Functions
 * This replaces the previous CORS proxy implementation
 */
export class QBOTokenManager {
  private config: QBOConfig;
  private edgeFunctionService: QBOEdgeFunctionService;
  
  constructor() {
    // Use singleton instance instead of creating a new one
    this.config = QBOConfig.getInstance();
    this.edgeFunctionService = new QBOEdgeFunctionService();
    
    console.log("QBOTokenManager initialized with Edge Function");
  }
  
  /**
   * Exchange authorization code for tokens using Edge Function
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId?: string;
  }> {
    console.log("Exchanging authorization code for tokens via Edge Function...");
    
    try {
      // Extract realmId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const realmId = urlParams.get('realmId');
      
      if (!realmId) {
        throw new Error("Missing realmId parameter");
      }
      
      // Get the state from localStorage
      const state = localStorage.getItem('qbo_auth_state');
      
      if (!state) {
        throw new Error("Missing state parameter");
      }
      
      // Use the Edge Function to exchange the code for tokens
      const result = await this.edgeFunctionService.handleCallback(code, state, realmId);
      
      if (!result.success) {
        throw new Error(result.error || "Token exchange failed");
      }
      
      // Get the connection from the database to return token data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }
      
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error || !connection) {
        throw new Error("Failed to retrieve connection data");
      }
      
      // Return token data in the expected format
      return {
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
        expires_in: 3600, // Default to 1 hour
        x_refresh_token_expires_in: 8726400, // Default to 101 days
        realmId: connection.company_id
      };
    } catch (error: any) {
      console.error("Error exchanging code for tokens:", error);
      throw new Error(`Failed to exchange authorization code for tokens: ${error.message}`);
    }
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(connectionId: string): Promise<string> {
    try {
      console.log("Refreshing QBO access token for connection:", connectionId);
      
      // Use the Edge Function to refresh the token
      const response = await this.edgeFunctionService.callEdgeFunction('refresh');
      
      if (!response.access_token) {
        throw new Error("Failed to refresh token");
      }
      
      return response.access_token;
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }
  
  /**
   * Store QBO connection information in the database
   * Note: This is now handled by the Edge Function directly
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any): Promise<any> {
    console.log("Connection storage is now handled by the Edge Function");
    return { success: true };
  }
}
