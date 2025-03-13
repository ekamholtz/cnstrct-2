import { QBOAuthService } from "../../authServiceFixed";
import { QBOUtils } from "../../utils/qboUtils";
import { supabase } from "@/integrations/supabase/client";
import { QBOSessionHelper } from "../../utils/qboSessionHelper";

/**
 * Service for handling QBO authorization
 */
export class AuthorizationService {
  private authService: QBOAuthService;
  
  constructor() {
    this.authService = new QBOAuthService();
  }
  
  /**
   * Get an authorization token
   */
  async refreshToken(connectionId: string): Promise<string> {
    return this.authService.refreshToken(connectionId);
  }

  /**
   * Handle OAuth callback with user ID persistence
   */
  async handleCallback(code: string, state: string, userId?: string): Promise<{
    success: boolean;
    companyId?: string;
    companyName?: string;
    error?: string;
  }> {
    // First, try to restore the auth session if it was lost
    await QBOSessionHelper.restoreAuthSession();
    
    // Validate state to prevent CSRF attacks
    if (!QBOUtils.validateState(state)) {
      console.error("State mismatch in QBO callback", { provided: state, stored: localStorage.getItem('qbo_auth_state') });
      return { success: false, error: 'Invalid state parameter' };
    }

    try {
      console.log("Exchanging authorization code for tokens...");
      
      let user;
      if (userId) {
        // Use the provided userId instead of relying on the current session
        user = { id: userId };
      } else {
        // Fallback to checking the current session
        const { data } = await supabase.auth.getUser();
        user = data.user;
        
        if (!user) {
          // Try to get the user ID from the stored state
          const storedUserId = QBOSessionHelper.getStoredUserId();
          
          if (storedUserId) {
            user = { id: storedUserId };
          } else {
            console.error("No authenticated user found when storing QBO tokens");
            return { success: false, error: 'User authentication required' };
          }
        }
      }

      // Exchange authorization code for tokens
      const tokenData = await this.authService.getTokens(code);
      
      if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.realmId) {
        console.error("Missing required token information", tokenData);
        return { success: false, error: 'Missing required token information' };
      }
      
      // Get company info using the new access token
      const companyInfo = await this.authService.getCompanyInfo(tokenData.access_token, tokenData.realmId);
      
      // Store connection with the persisted user ID
      await this.authService.storeConnection(user.id, tokenData, companyInfo);
      
      // Clear OAuth state from localStorage
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
}
