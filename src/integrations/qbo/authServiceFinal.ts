import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "./config/qboConfigFixed";
import { QBOUtils } from "./utils/qboUtilsFixed";
import { QBOTokenManager } from "./auth/qboTokenManagerServer";
import { QBOCompanyService } from "./company/qboCompanyService";
import { QBOConnectionService } from "./connection/qboConnectionService";
import { QBOSessionHelper } from "./utils/qboSessionHelper";

/**
 * Service to handle QBO authentication
 */
export class QBOAuthService {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  
  constructor() {
    this.config = new QBOConfig();
    this.tokenManager = new QBOTokenManager();
  }
  
  /**
   * Get the authorization URL for QBO OAuth2 flow
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    // Generate a random state parameter for CSRF protection
    const state = QBOUtils.generateRandomState();
    
    // Store state in localStorage for validation when the user returns
    QBOUtils.storeOAuthState(state, userId);
    
    // Backup the current session before redirecting
    QBOSessionHelper.backupAuthSession(userId);
    
    // Build the authorization URL with correct parameters
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      state: state
    });
    
    const authUrl = `${this.config.authEndpoint}?${params.toString()}`;
    console.log("Generated QBO authorization URL:", authUrl);
    
    return authUrl;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId: string;
  }> {
    try {
      console.log("Exchanging authorization code for tokens");
      
      // Use the token manager to exchange code for tokens
      const tokenData = await this.tokenManager.exchangeCodeForTokens(code);
      
      return tokenData;
    } catch (error) {
      console.error("Error getting tokens:", error);
      throw error;
    }
  }
  
  /**
   * Check if a user has an active QBO connection
   */
  async hasActiveConnection(userId: string): Promise<boolean> {
    try {
      // Get the user's QBO connection
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        console.log("No active QBO connection found for user:", userId);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking QBO connection:", error);
      return false;
    }
  }
  
  /**
   * Get the active connection ID for a user
   */
  async getConnectionId(userId: string): Promise<string | null> {
    try {
      // Get the user's QBO connection
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        console.log("No QBO connection found for user:", userId);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error("Error getting QBO connection:", error);
      return null;
    }
  }
  
  /**
   * Disconnect QBO for a user
   */
  async disconnect(userId: string): Promise<boolean> {
    try {
      // Delete the user's QBO connection
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error disconnecting QBO:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error disconnecting QBO:", error);
      return false;
    }
  }
}
