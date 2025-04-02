
import { supabase } from "@/integrations/supabase/client";
import { QBOAuthService } from "./qboAuthService";

/**
 * Manager for QBO access tokens, handling refresh via Edge Function when necessary
 */
export class QBOTokenManager {
  private authService: QBOAuthService;
  
  constructor() {
    this.authService = new QBOAuthService();
  }
  
  /**
   * Get a valid access token for the connection, refreshing if necessary
   */
  async refreshToken(connectionId: string): Promise<string> {
    try {
      console.log(`Getting access token for connection ${connectionId}...`);
      
      // Get the connection from the database
      const { data: connection, error } = await supabase
        .from("qbo_connections")
        .select("*")
        .eq("id", connectionId)
        .single();
      
      if (error || !connection) {
        throw new Error(`Connection not found: ${error?.message || 'No connection data'}`);
      }
      
      // Check if token is expired or nearly expired (5 minutes buffer)
      const expiresAt = new Date(connection.created_at);
      expiresAt.setSeconds(expiresAt.getSeconds() + connection.expires_in - 300); // 5 minute buffer
      
      if (new Date() < expiresAt) {
        console.log("Access token is still valid");
        return connection.access_token;
      }
      
      console.log("Access token expired or nearly expired, refreshing...");
      
      // Refresh the token using Edge Function
      const result = await this.authService.refreshToken(connection.refresh_token);
      
      if (!result.success || !result.data) {
        throw new Error(`Failed to refresh token: ${result.error || 'Unknown error'}`);
      }
      
      const { access_token, refresh_token, expires_in } = result.data;
      
      // Update the token in the database
      const { error: updateError } = await supabase
        .from("qbo_connections")
        .update({
          access_token,
          refresh_token,
          expires_in,
          updated_at: new Date().toISOString()
        })
        .eq("id", connectionId);
      
      if (updateError) {
        console.error("Error updating token in database:", updateError);
        // Still return the new token even if we couldn't update the database
      }
      
      return access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
