import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

/**
 * Service for managing QBO connections
 */
export class QBOConnectionService {
  private config: QBOConfig;
  
  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    console.log("QBOConnectionService initialized with client ID:", this.config.clientId);
    console.log("QBOConnectionService environment:", this.config.isProduction ? "Production" : "Sandbox");
  }
  
  /**
   * Get current user's QBO connection
   */
  async getConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found when getting QBO connection");
        return null;
      }
      
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.log("No QBO connection found for user:", user.id);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error getting QBO connection:", err);
      return null;
    }
  }
  
  /**
   * Get QBO connection by ID
   */
  async getConnectionById(connectionId: string) {
    try {
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('id', connectionId)
        .single();
        
      if (error) {
        console.error("Error getting QBO connection by ID:", connectionId, error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error getting QBO connection by ID:", connectionId, err);
      return null;
    }
  }
  
  /**
   * Store or update QBO connection
   */
  async storeConnection(userId: string, tokenData: any, companyInfo: any) {
    try {
      console.log("Storing QBO connection for user:", userId);
      
      // Check for existing connection
      const { data: existingConnection, error: findError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', tokenData.realmId)
        .single();
      
      const connectionData = {
        user_id: userId,
        company_id: tokenData.realmId,
        company_name: companyInfo?.CompanyName || 'Unknown Company',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + (tokenData.x_refresh_token_expires_in * 1000)).toISOString(),
        is_sandbox: !this.config.isProduction,
        client_id: this.config.clientId,
        last_refreshed_at: new Date().toISOString()
      };
      
      let result;
      
      if (existingConnection) {
        console.log("Updating existing QBO connection:", existingConnection.id);
        
        // Update existing connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .update(connectionData)
          .eq('id', existingConnection.id)
          .select()
          .single();
          
        if (error) {
          console.error("Error updating QBO connection:", error);
          throw error;
        }
        
        result = data;
      } else {
        console.log("Creating new QBO connection");
        
        // Create new connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .insert(connectionData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating QBO connection:", error);
          throw error;
        }
        
        result = data;
      }
      
      console.log("QBO connection stored successfully:", result.id);
      return result;
    } catch (err) {
      console.error("Error storing QBO connection:", err);
      throw err;
    }
  }
  
  /**
   * Update QBO connection with new tokens
   */
  async updateTokens(connectionId: string, tokenData: any) {
    try {
      console.log("Updating tokens for QBO connection:", connectionId);
      
      const { data, error } = await supabase
        .from('qbo_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          refresh_token_expires_at: new Date(Date.now() + (tokenData.x_refresh_token_expires_in * 1000)).toISOString(),
          last_refreshed_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating QBO connection tokens:", error);
        throw error;
      }
      
      console.log("QBO connection tokens updated successfully");
      return data;
    } catch (err) {
      console.error("Error updating QBO connection tokens:", err);
      throw err;
    }
  }
  
  /**
   * Delete QBO connection
   */
  async deleteConnection(connectionId: string) {
    try {
      console.log("Deleting QBO connection:", connectionId);
      
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('id', connectionId);
        
      if (error) {
        console.error("Error deleting QBO connection:", error);
        throw error;
      }
      
      console.log("QBO connection deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting QBO connection:", err);
      throw err;
    }
  }
}
