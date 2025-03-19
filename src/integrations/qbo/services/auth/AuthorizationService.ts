import { QBOConfig } from "../../config/qboConfig";
import { QBOTokenManager } from "../../auth/qboTokenManager";
import { QBOCompanyServiceProxy } from "../../company/qboCompanyServiceProxy";
import { supabase } from "@/integrations/supabase/client";
import crypto from "crypto";

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
   * Initiate the QBO OAuth flow
   */
  initiateAuth(): string {
    // Generate a secure random state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString("hex");
    
    // Store the state in localStorage for validation during callback
    if (typeof window !== 'undefined') {
      localStorage.setItem('qbo_auth_state', state);
      console.log("Stored QBO auth state for CSRF protection:", state);
    }
    
    // Construct the authorization URL with the state parameter
    const authUrl = `${this.config.authEndpoint}?client_id=${this.config.clientId}&response_type=code&scope=${encodeURIComponent(this.config.scopes.join(' '))}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&state=${state}`;
    
    console.log("Initiating QBO authorization with URL:", authUrl);
    return authUrl;
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
      
      // Exchange the authorization code for tokens
      const tokenData = await this.tokenManager.exchangeCodeForTokens(code);
      
      // Get company information using the access token
      const companyInfo = await this.companyService.getCompanyInfo(tokenData.access_token, tokenData.realmId);
      
      // Store the connection in the database
      await this.tokenManager.storeConnection(userId, tokenData, companyInfo);
      
      console.log("QBO connection successfully established for company:", companyInfo.CompanyName);
      
      return {
        success: true,
        companyName: companyInfo.CompanyName
      };
    } catch (error: any) {
      console.error("Error handling QBO callback:", error);
      
      return {
        success: false,
        error: error.message || "Unknown error during QBO connection"
      };
    }
  }
  
  /**
   * Get a QBO access token for a specific connection
   */
  async getAccessToken(connectionId: string): Promise<string> {
    return this.tokenManager.refreshToken(connectionId);
  }
  
  /**
   * Get QBO connections for a specific user
   */
  async getUserConnections(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error fetching QBO connections:", error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Error getting user QBO connections:", error);
      throw error;
    }
  }
}
