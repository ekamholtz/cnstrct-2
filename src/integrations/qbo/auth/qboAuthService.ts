
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";
import { QBOUtils } from "../utils/qboUtils";
import { QBOTokenManager } from "../auth/qboTokenManager";
import { QBOCompanyService } from "../company/qboCompanyService";
import { QBOConnectionService } from "../connection/qboConnectionService";

export class QBOAuthService {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  private companyService: QBOCompanyService;
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.config = QBOConfig.getInstance();
    this.tokenManager = new QBOTokenManager();
    this.companyService = new QBOCompanyService();
    this.connectionService = new QBOConnectionService();
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    // This method is now simplified since we're using AuthKit
    return "https://authkit.pica.dev";
  }
  
  /**
   * Launch the QBO OAuth flow in a new window
   */
  async launchAuthFlow(userId: string): Promise<void> {
    // This is now handled by AuthKit
    console.log("Using AuthKit for QBO flow");
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
    // This is now handled by AuthKit
    return { success: true };
  }
  
  /**
   * Exchange code for token (used by tokenManager)
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('qbo-token-exchange', {
        body: { code, redirectUri }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error in exchangeCodeForToken:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Get current user's QBO connection
   */
  async getConnection() {
    return this.connectionService.getConnection();
  }
  
  /**
   * Get company info from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string) {
    return this.companyService.getCompanyInfo(accessToken, realmId);
  }
  
  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('qbo-token-refresh', {
        body: { refreshToken }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error in refreshToken:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<boolean> {
    try {
      const connection = await this.connectionService.getConnection();
      
      if (!connection) {
        return true;
      }
      
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('id', connection.id);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      return false;
    }
  }
}
