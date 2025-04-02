
import { QBOConfig } from "../config/qboConfig";
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for QBO authorization using Supabase Edge Functions
 */
export class QBOAuthService {
  private config: QBOConfig;
  
  constructor() {
    this.config = QBOConfig.getInstance();
  }
  
  /**
   * Generate the QBO authorization URL
   */
  generateAuthorizationUrl(redirectUri: string, state?: string): string {
    // Build the authorization URL
    const baseUrl = "https://appcenter.intuit.com/connect/oauth2";
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      scope: this.config.scopes.join(' '), // Fixed: Using scopes instead of scope
      redirect_uri: redirectUri,
      state: state || Math.random().toString(36).substring(2, 15)
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token using Edge Function
   */
  async exchangeCodeForToken(code: string, redirectUri: string) {
    try {
      console.log("Exchanging code for token via Edge Function");
      
      const { data, error } = await supabase.functions.invoke('qbo-token', {
        body: { code, redirectUri }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return {
        success: true,
        data: data
      };
    } catch (err) {
      console.error("Error exchanging code for token:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error"
      };
    }
  }
  
  /**
   * Refresh the access token using Edge Function
   */
  async refreshToken(refreshToken: string) {
    try {
      console.log("Refreshing token via Edge Function");
      
      const { data, error } = await supabase.functions.invoke('qbo-refresh', {
        body: { refreshToken }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      return {
        success: true,
        data: data
      };
    } catch (err) {
      console.error("Error refreshing token:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error"
      };
    }
  }
}
