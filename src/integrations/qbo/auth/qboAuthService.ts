
import { QBOConfig } from "../config/qboConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Service for QBO authorization using Supabase Edge Functions
 */
export class QBOAuthService {
  private config: QBOConfig;
  
  constructor() {
    this.config = QBOConfig.getInstance();
  }
  
  /**
   * Generate a state parameter and store it in the database
   */
  private async generateAndStoreState(): Promise<string> {
    try {
      // Generate a unique state parameter
      const state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User must be logged in to connect to QBO");
      }
      
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
      
      if (error) {
        throw new Error(`Failed to store auth state: ${error.message}`);
      }
      
      return state;
    } catch (err) {
      console.error("Error generating state parameter:", err);
      throw err;
    }
  }
  
  /**
   * Generate the QBO authorization URL and start the OAuth flow
   */
  async startAuthFlow(): Promise<{success: boolean, error?: string}> {
    try {
      const state = await this.generateAndStoreState();
      
      // Get the redirect URI from the config
      const redirectUri = new URL(
        '/qbo-oauth-callback', 
        window.location.origin.includes('localhost') || 
        window.location.origin.includes('127.0.0.1') || 
        window.location.origin.includes('.vercel.app') || 
        window.location.origin.includes('.lovableproject.com')
          ? 'https://' + Deno.env.get('SUPABASE_PROJECT_REF') + '.supabase.co/functions/v1'
          : window.location.origin
      ).toString();
      
      // Build the authorization URL
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        scope: this.config.scopes.join(' '),
        redirect_uri: redirectUri,
        state
      });
      
      const authUrl = `${this.config.authEndpoint}?${params.toString()}`;
      
      console.log("Starting QBO auth flow with redirect URI:", redirectUri);
      console.log("Auth URL:", authUrl);
      
      // Open the auth URL in a popup or new tab
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const authWindow = window.open(
        authUrl,
        'qbo-auth',
        `width=${width},height=${height},top=${top},left=${left}`
      );
      
      if (!authWindow) {
        toast({
          title: 'Popup Blocked',
          description: 'Please allow popups for this site to connect to QuickBooks.',
          variant: 'destructive'
        });
        return { success: false, error: 'Popup blocked' };
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error starting QBO auth flow:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Handle callback from QBO OAuth
   */
  async handleCallback(code: string, state: string): Promise<{
    success: boolean;
    companyName?: string;
    companyId?: string;
    error?: string;
  }> {
    try {
      // The token exchange and database updates are now handled by the edge function
      // This method is now just a handler for the frontend callback page
      console.log("QBO OAuth callback received with code and state", { code: !!code, state: !!state });
      
      if (!code || !state) {
        return { 
          success: false, 
          error: 'Missing required parameters' 
        };
      }
      
      // Get current connection to see if it was successfully created/updated
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (error || !connection) {
        return { 
          success: false, 
          error: `Connection not found after callback: ${error?.message || 'No data'}` 
        };
      }
      
      return {
        success: true,
        companyName: connection.company_name,
        companyId: connection.company_id
      };
    } catch (err) {
      console.error("Error handling QBO callback:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Test the QBO connection
   */
  async testConnection(): Promise<{
    success: boolean;
    companyName?: string;
    error?: string;
  }> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "User must be logged in to test QBO connection" };
      }
      
      // Call the test connection edge function
      const { data, error } = await supabase.functions.invoke('qbo-test-connection', {
        body: { userId: user.id }
      });
      
      if (error || !data.success) {
        return { 
          success: false, 
          error: error?.message || data?.error || 'Unknown error'
        };
      }
      
      return {
        success: true,
        companyName: data.companyInfo?.CompanyName
      };
    } catch (err) {
      console.error("Error testing QBO connection:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "User must be logged in to disconnect from QBO" };
      }
      
      // Delete the connection from the database
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(`Failed to delete QBO connection: ${error.message}`);
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error disconnecting from QBO:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
}
