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
    
    console.log("QBOAuthService initialized with:", {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      environment: this.config.isProduction ? "Production" : "Sandbox"
    });
  }
  
  /**
   * Generate the authorization URL for QBO OAuth2 flow
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    
      // Generate a unique state parameter
      let state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User must be logged in to connect to QBO");
      }
      // store user.id in state
      // let state = user.id.replace("-","99999999999");
      console.log("state", state)
      
      // Store state in the database with an expiry of 10 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      const { error } = await supabase
        .from('qbo_auth_states')
        .insert({
          state,
          user_id: user.id,
          expires_at: expiresAt.toISOString()
        });
        
    // Build the authorization URL with correct parameters
    // Important: Join scopes with '+' instead of space to match Intuit's requirements
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(' '), // Using space delimiter for scopes
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
  async launchAuthFlow(userId: string): Promise<void> {
    try {
      const authUrl = await this.getAuthorizationUrl(userId);
      
      // Debug info for troubleshooting
      console.log("Launching QBO auth flow with URL:", authUrl);
      console.log("Stored user ID for QBO flow:", userId);
      
      // Open in a new tab/window instead of trying to embed
      const newWindow = window.open(authUrl, 'QBOAuth', 'width=800,height=700,menubar=no,toolbar=no,location=yes');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.error("QBO popup window was blocked. Please allow popups for this site.");
        // Provide user with instructions if popup is blocked
        throw new Error("Popup blocked by browser. Please allow popups for this site to continue with QuickBooks connection.");
      }
      
      // Attempt to focus the new window
      try {
        newWindow.focus();
      } catch (e) {
        console.warn("Could not focus QBO auth window:", e);
      }
      
    } catch (error) {
      console.error("Error launching QBO auth flow:", error);
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
    console.log("Starting QBO callback handling with code and state:", { 
      codeExists: !!code, 
      stateExists: !!state 
    });
    
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
      
      // Get the stored user ID from localStorage (set during auth initiation)
      const userId = QBOUtils.getStoredUserId();
      console.log("Retrieved user ID from storage:", userId);
      
      if (!userId) {
        console.error("No user ID found in storage during QBO callback");
        return { success: false, error: 'User ID not found - unable to complete connection' };
      }
      
      // Exchange authorization code for tokens
      const tokenData = await this.tokenManager.exchangeCodeForTokens(code);
      console.log("Token exchange successful, received token data:", {
        accessTokenExists: !!tokenData.access_token,
        refreshTokenExists: !!tokenData.refresh_token,
        realmId: tokenData.realmId || 'not provided'
      });
      
      if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.realmId) {
        console.error("Missing required token information", {
          accessToken: !!tokenData.access_token,
          refreshToken: !!tokenData.refresh_token,
          realmId: !!tokenData.realmId
        });
        return { success: false, error: 'Missing required token information from QBO' };
      }
      
      // Get company info
      const companyInfo = await this.companyService.getCompanyInfo(tokenData.access_token, tokenData.realmId);
      console.log("Retrieved company info:", {
        companyName: companyInfo.CompanyName || 'Unknown',
        companyId: tokenData.realmId
      });
      
      // Store tokens in database
      await this.tokenManager.storeConnection(userId, tokenData, companyInfo);
      console.log("Successfully stored QBO connection for user:", userId);
      
      // Clear the state from localStorage
      QBOUtils.clearOAuthState();
      
      return { 
        success: true, 
        companyId: tokenData.realmId,
        companyName: companyInfo.CompanyName
      };
      
    } catch (error: any) {
      console.error("Error in QBO authorization:", error);
      
      // Enhanced error extraction
      const errorMessage = error.response?.data?.error_description || 
                          error.response?.data?.error ||
                          error.message ||
                          'Authorization failed';
                          
      // Log more detailed error information for troubleshooting
      console.error("QBO error details:", {
        message: errorMessage,
        response: error.response?.data || 'No response data',
        status: error.response?.status || 'No status code'
      });
      
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
