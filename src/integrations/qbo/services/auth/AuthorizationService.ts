import { QBOConfig } from "../../config/qboConfig";
import { QBOTokenManager } from "../../auth/qboTokenManager";
import { QBOCompanyServiceProxy } from "../../company/qboCompanyServiceProxy";

/**
 * Service for handling QBO authorization
 */
export class AuthorizationService {
  private config: QBOConfig;
  private tokenManager: QBOTokenManager;
  private companyService: QBOCompanyServiceProxy;
  
  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    this.tokenManager = new QBOTokenManager();
    this.companyService = new QBOCompanyServiceProxy();
    
    console.log("AuthorizationService initialized with client ID:", this.config.clientId);
    console.log("AuthorizationService environment:", this.config.isProduction ? "Production" : "Sandbox");
  }
  
  /**
   * Handle the OAuth callback
   */
  async handleCallback(code: string, state: string, userId: string | null): Promise<{
    success: boolean;
    error?: string;
    companyName?: string;
  }> {
    try {
      console.log("Handling QBO callback for user:", userId);
      
      // Verify the state parameter to prevent CSRF attacks
      const storedState = localStorage.getItem('qbo_auth_state');
      if (!storedState || storedState !== state) {
        console.error("State mismatch - possible CSRF attack");
        return {
          success: false,
          error: "Invalid state parameter - security validation failed"
        };
      }
      
      // Clear the state from localStorage
      localStorage.removeItem('qbo_auth_state');
      
      if (!userId) {
        console.error("Missing user ID for QBO callback");
        return {
          success: false,
          error: "Missing user ID - unable to complete connection"
        };
      }
      
      console.log("Exchanging code for tokens...");
      
      // Exchange the authorization code for tokens
      try {
        const tokenData = await this.tokenManager.exchangeCodeForTokens(code);
        
        // Get the company information
        const companyInfo = await this.companyService.getCompanyInfo(tokenData.access_token, tokenData.realmId);
        
        // Store the connection information
        await this.tokenManager.storeConnection(userId, tokenData, companyInfo);
        
        return {
          success: true,
          companyName: companyInfo.CompanyName
        };
      } catch (error: any) {
        console.error("Error exchanging code for tokens:", error);
        return {
          success: false,
          error: `Failed to exchange authorization code for tokens: ${error.message}`
        };
      }
    } catch (error: any) {
      console.error("Error handling QBO callback:", error);
      return {
        success: false,
        error: `Error handling QBO callback: ${error.message}`
      };
    }
  }
}
