import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing QBO connections
 */
export class QBOConnectionService {
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
        console.log(`No QBO connection found with ID: ${connectionId}`);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error(`Error getting QBO connection with ID ${connectionId}:`, err);
      return null;
    }
  }
  
  /**
   * Disconnect from QBO
   */
  async disconnect(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found when disconnecting QBO");
        return false;
      }
      
      console.log("Disconnecting QBO for user:", user.id);
      
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error disconnecting from QBO:", error);
        return false;
      }
      
      console.log("QBO successfully disconnected");
      return true;
    } catch (error) {
      console.error("Error disconnecting from QBO:", error);
      return false;
    }
  }
  
  /**
   * Update an existing QBO connection with new tokens
   * @param connection The updated connection data
   * @returns The updated connection
   */
  async updateConnection(connection: any) {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }
      
      // Update the connection in the database
      const { data, error } = await supabase
        .from('qbo_connections')
        .update({
          access_token: connection.access_token,
          refresh_token: connection.refresh_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error updating QBO connection:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error in updateConnection:", error);
      throw error;
    }
  }
}
