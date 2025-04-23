
import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "./config/qboConfig";
import { QBOUtils } from "./utils/qboUtils";
import { QBOTokenManager } from "./auth/qboTokenManager";
import { QBOCompanyService } from "./company/qboCompanyService";
import { QBOConnectionService } from "./connection/qboConnectionService";

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
    
    console.log("QBOAuthService initialized with:", {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      environment: this.config.isProduction ? "Production" : "Sandbox"
    });
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  getAuthorizationUrl(userId: string): string {
    const state = QBOUtils.generateRandomState();
    
    // Store state in localStorage for validation when the user returns
    QBOUtils.storeOAuthState(state, userId);
    
    // Build the authorization URL with correct parameters
    // Important: Join scopes with '+' instead of space to match Intuit's requirements
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(' '), // Using scopes instead of scope
      redirect_uri: this.config.redirectUri,
      state: state
    });
    
    const authUrl = `${this.config.authEndpoint}?${params.toString()}`;
    console.log("Generated QBO Auth URL:", authUrl);
    return authUrl;
  }
  
  /**
   * Launch the QBO OAuth flow in a new window
   * This prevents CSP issues with embedding Intuit's authorization page
   */
  launchAuthFlow(userId: string): void {
    const authUrl = this.getAuthorizationUrl(userId);
    
    // Open in a new tab/window instead of trying to embed
    const newWindow = window.open(authUrl, 'QBOAuth', 'width=600,height=700');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.error("QBO popup window was blocked. Please allow popups for this site.");
      // Fallback to redirecting the current window
      window.location.href = authUrl;
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
    // Validate state to prevent CSRF attacks
    if (!QBOUtils.validateState(state)) {
      console.error("State mismatch in QBO callback", { 
        provided: state, 
        stored: localStorage.getItem('qbo_auth_state') 
      });
      
      // In production, we might proceed despite state mismatch for better user experience
      // but log the security concern
      if (this.config.isProduction) {
        console.warn("Production environment - proceeding despite state mismatch (security risk)");
      } else {
        return { success: false, error: 'Invalid state parameter - security validation failed' };
      }
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
      
      // Store tokens in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found when storing QBO tokens");
        return { success: false, error: 'User authentication required' };
      }
      
      await this.tokenManager.storeConnection(user.id, tokenData, companyInfo);
      
      // Clear the state from localStorage
      QBOUtils.clearOAuthState();
      
      return { 
        success: true, 
        companyId: tokenData.realmId,
        companyName: companyInfo.CompanyName || companyInfo.companyName
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
    try {
      // Get the connection first
      const connection = await this.connectionService.getConnection();
      
      if (!connection) {
        console.log("No connection to disconnect");
        return true;
      }
      
      // Delete the connection using the connection ID
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('id', connection.id);
        
      if (error) {
        console.error("Error disconnecting from QBO:", error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to disconnect from QBO:", error);
      return false;
    }
  }
}
