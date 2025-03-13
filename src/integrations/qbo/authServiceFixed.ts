import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "./config/qboConfigFixed";
import { QBOUtils } from "./utils/qboUtilsFixed";
import { QBOTokenManager } from "./auth/qboTokenManagerCorsProxy";
import { QBOCompanyService } from "./company/qboCompanyService";
import { QBOConnectionService } from "./connection/qboConnectionService";
import { QBOSessionHelper } from "./utils/qboSessionHelper";

export class QBOAuthService {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  private companyService: QBOCompanyService;
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.config = new QBOConfig();
    this.tokenManager = new QBOTokenManager();
    this.companyService = new QBOCompanyService();
    this.connectionService = new QBOConnectionService();
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  getAuthorizationUrl(userId: string): string {
    const state = QBOUtils.generateRandomState();
    
    // Store state in localStorage for validation when the user returns
    QBOUtils.storeOAuthState(state, userId);
    
    // Backup the current session before redirecting
    QBOSessionHelper.backupAuthSession();
    
    // Build the authorization URL with correct parameters
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      state: state
    });
    
    const authUrl = `${this.config.authEndpoint}?${params.toString()}`;
    console.log("Generated QBO Auth URL:", authUrl);
    return authUrl;
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
    if (!QBOUtils.validateState(state)) {
      console.error("State mismatch in QBO callback", { provided: state, stored: localStorage.getItem('qbo_auth_state') });
      return { success: false, error: 'Invalid state parameter' };
    }
    
    try {
      console.log("Exchanging authorization code for tokens...");
      
      // Exchange authorization code for tokens
      const tokenData = await this.tokenManager.exchangeCodeForTokens(code);
      
      if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.realmId) {
        console.error("Missing required token information", tokenData);
        return { success: false, error: 'Missing required token information' };
      }
      
      // Get company info
      const companyInfo = await this.companyService.getCompanyInfo(tokenData.access_token, tokenData.realmId);
      
      // Try to get the user ID from the stored state first
      let userId = QBOUtils.getStoredUserId();
      
      if (!userId) {
        // If not found in state, try to get from current session
        const { data } = await supabase.auth.getUser();
        
        if (data?.user) {
          userId = data.user.id;
        } else {
          // Try to restore the session if it was lost
          await QBOSessionHelper.restoreAuthSession();
          
          // Try again after restoration
          const { data: restoredData } = await supabase.auth.getUser();
          
          if (restoredData?.user) {
            userId = restoredData.user.id;
          } else {
            console.error("No authenticated user found when storing QBO tokens");
            return { success: false, error: 'User authentication required' };
          }
        }
      }
      
      await this.tokenManager.storeConnection(userId, tokenData, companyInfo);
      
      // Clear the state from localStorage
      QBOUtils.clearOAuthState();
      
      return { 
        success: true, 
        companyId: tokenData.realmId,
        companyName: companyInfo.companyName
      };
      
    } catch (error: any) {
      console.error("Error in QBO authorization:", error);
      const errorMessage = error.response?.data?.error_description || 
                          error.response?.data?.error ||
                          error.message ||
                          'Authorization failed';
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
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    return this.tokenManager.exchangeCodeForTokens(code);
  }
  
  /**
   * Get company info from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string) {
    return this.companyService.getCompanyInfo(accessToken, realmId);
  }
  
  /**
   * Store connection in database
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any) {
    return this.tokenManager.storeConnection(userId, tokenData, companyInfo);
  }
  
  /**
   * Refresh the QBO access token
   */
  async refreshToken(connectionId: string): Promise<string> {
    return this.tokenManager.refreshToken(connectionId);
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<boolean> {
    return this.connectionService.disconnect();
  }
}
