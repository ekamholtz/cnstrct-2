import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "./config/qboConfig";
import { QBOUtils } from "./utils/qboUtils";
import { QBOTokenManager } from "./auth/qboTokenManager";
import { QBOCompanyService } from "./company/qboCompanyService";
import { QBOConnectionService } from "./connection/qboConnectionService";
import { QBOEdgeFunctionService } from "@/lib/qbo/qboEdgeFunctionService";

export class QBOAuthService {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  private companyService: QBOCompanyService;
  private connectionService: QBOConnectionService;
  private edgeFunctionService: QBOEdgeFunctionService;
  
  constructor() {
    this.config = QBOConfig.getInstance();
    this.tokenManager = new QBOTokenManager();
    this.companyService = new QBOCompanyService();
    this.connectionService = new QBOConnectionService();
    this.edgeFunctionService = new QBOEdgeFunctionService();
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    try {
      // Use the Edge Function to get the authorization URL
      const authUrl = await this.edgeFunctionService.getAuthorizationUrl();
      console.log("Generated QBO Auth URL:", authUrl);
      return authUrl;
    } catch (error) {
      console.error("Error generating QBO auth URL:", error);
      throw error;
    }
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
    try {
      console.log("Handling QBO callback with code and state");
      
      // Extract realmId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const realmId = urlParams.get('realmId');
      
      if (!realmId) {
        console.error("Missing realmId in callback URL");
        return { success: false, error: 'Missing realmId parameter' };
      }
      
      // Use the Edge Function to exchange the code for tokens
      const result = await this.edgeFunctionService.handleCallback(code, state, realmId);
      
      if (!result.success) {
        console.error("Error in QBO callback:", result.error);
        return { success: false, error: result.error };
      }
      
      return { 
        success: true, 
        companyId: result.companyId,
        companyName: result.companyName
      };
      
    } catch (error: any) {
      console.error("Error in QBO authorization:", error);
      const errorMessage = error.message || 'Authorization failed';
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
   * Test connection to QBO
   */
  async testConnection() {
    try {
      const result = await this.edgeFunctionService.testConnection();
      return {
        success: true,
        companyName: result.companyName,
        companyId: result.companyId
      };
    } catch (error) {
      console.error("Error testing QBO connection:", error);
      return {
        success: false,
        error: error.message || "Connection test failed"
      };
    }
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<boolean> {
    try {
      return await this.edgeFunctionService.disconnect();
    } catch (error) {
      console.error("Failed to disconnect from QBO:", error);
      return false;
    }
  }
}
