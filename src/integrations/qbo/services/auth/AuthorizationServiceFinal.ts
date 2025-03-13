import { QBOAuthService } from "../../authServiceFixed";
import { QBOTokenManager } from "../../auth/qboTokenManagerCorsProxy";
import { QBOCompanyService } from "../../company/qboCompanyService";
import { QBOUtils } from "../../utils/qboUtilsFixed";
import { QBOSessionHelper } from "../../utils/qboSessionHelper";

/**
 * Service to handle QBO authorization flow
 */
export class AuthorizationService {
  private authService: QBOAuthService;
  private tokenManager: QBOTokenManager;
  private companyService: QBOCompanyService;
  
  constructor() {
    this.authService = new QBOAuthService();
    this.tokenManager = new QBOTokenManager();
    this.companyService = new QBOCompanyService();
  }
  
  /**
   * Initiate the QBO authorization flow
   */
  async initiateAuthorization(userId: string): Promise<string> {
    try {
      console.log("Initiating QBO authorization for user:", userId);
      
      // Backup the current session before redirecting
      QBOSessionHelper.backupAuthSession(userId);
      
      // Generate the authorization URL
      const authUrl = await this.authService.getAuthorizationUrl(userId);
      
      return authUrl;
    } catch (error) {
      console.error("Error initiating QBO authorization:", error);
      throw error;
    }
  }
  
  /**
   * Handle the OAuth callback
   */
  async handleCallback(code: string, state: string, userId: string): Promise<{
    success: boolean;
    companyName?: string;
    error?: string;
  }> {
    try {
      console.log("Handling QBO callback for user:", userId);
      
      // Validate state to prevent CSRF attacks
      if (!QBOUtils.validateState(state)) {
        console.error("Invalid state parameter");
        return {
          success: false,
          error: "Invalid state parameter. Please try again."
        };
      }
      
      // Exchange code for tokens
      console.log("Exchanging code for tokens...");
      const tokenData = await this.authService.getTokens(code);
      
      if (!tokenData || !tokenData.access_token) {
        console.error("Failed to obtain tokens");
        return {
          success: false,
          error: "Failed to obtain authorization tokens. Please try again."
        };
      }
      
      // Get company information
      console.log("Getting company information...");
      const companyInfo = await this.companyService.getCompanyInfo(
        tokenData.access_token,
        tokenData.realmId
      );
      
      if (!companyInfo) {
        console.error("Failed to get company information");
        return {
          success: false,
          error: "Failed to get company information. Please try again."
        };
      }
      
      // Store connection in database
      console.log("Storing connection information...");
      await this.tokenManager.storeConnection(userId, tokenData, companyInfo);
      
      // Clear OAuth state after successful connection
      QBOUtils.clearOAuthState();
      
      return {
        success: true,
        companyName: companyInfo.companyName
      };
    } catch (error: any) {
      console.error("Error handling QBO callback:", error);
      
      return {
        success: false,
        error: error.message || "An error occurred during the authorization process."
      };
    }
  }
}
