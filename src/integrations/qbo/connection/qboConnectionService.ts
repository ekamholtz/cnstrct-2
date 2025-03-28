
import { supabase } from "@/integrations/supabase/client";
import { QBOTokenManager } from "../auth/qboTokenManager";

export class QBOConnectionService {
  private tokenManager: QBOTokenManager;
  
  constructor() {
    this.tokenManager = new QBOTokenManager();
  }
  
  /**
   * Get the current user's QBO connection
   */
  async getConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when getting QBO connection");
      return null;
    }
    
    const { data, error } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching QBO connection:", error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Delete a QBO connection
   */
  async deleteConnection(connectionId: string) {
    const { error } = await supabase
      .from('qbo_connections')
      .delete()
      .eq('id', connectionId);
    
    if (error) {
      console.error("Error deleting QBO connection:", error);
      throw error;
    }
    
    return true;
  }
  
  /**
   * Update a QBO connection with new token information
   */
  async updateConnection(connectionId: string, data: any) {
    const { error } = await supabase
      .from('qbo_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);
    
    if (error) {
      console.error("Error updating QBO connection:", error);
      throw error;
    }
    
    return true;
  }
  
  /**
   * Disconnect from QBO by removing the connection
   */
  async disconnect() {
    try {
      const connection = await this.getConnection();
      
      if (!connection) {
        console.log("No QBO connection found to disconnect");
        return true;
      }
      
      return await this.deleteConnection(connection.id);
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      throw error;
    }
  }
}
