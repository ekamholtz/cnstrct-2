
import { QBOConnectionService } from "./connection/qboConnectionService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Simplified QBO service that uses Supabase Edge Functions for API calls
 * This replaces the previous CORS proxy implementation
 */
export class QBOProxyService {
  private connectionService: QBOConnectionService;
  
  constructor() {
    this.connectionService = new QBOConnectionService();
    console.log("QBOProxyService initialized with Edge Function support");
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    return this.connectionService.getConnection();
  }
  
  /**
   * Test connection to QBO using Edge Function
   */
  async testConnection() {
    try {
      // Get connection details
      const connection = await this.getUserConnection();
      
      if (!connection) {
        throw new Error("No QuickBooks connection found");
      }
      
      // Use Edge Function to test the connection
      const { data, error } = await supabase.functions.invoke('qbo-test-connection', {
        body: {
          accessToken: connection.access_token,
          realmId: connection.company_id
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      // If we got a new access token, update the connection
      if (data.newAccessToken) {
        console.log('Received new access token from Edge Function, updating connection');
        
        try {
          // Update the connection in Supabase
          const { error } = await supabase
            .from('qbo_connections')
            .update({
              access_token: data.newAccessToken,
              refresh_token: data.newRefreshToken || connection.refresh_token,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);
            
          if (error) {
            console.error('Error updating connection with new tokens:', error);
          }
        } catch (updateError) {
          console.error('Error updating connection with new tokens:', updateError);
        }
      }
      
      return {
        success: true,
        status: 200,
        data: data
      };
    } catch (error) {
      console.error("Error testing QBO connection:", error);
      return {
        success: false,
        error: error
      };
    }
  }
}
