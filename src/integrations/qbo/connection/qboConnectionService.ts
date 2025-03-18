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
   * Get user's QBO connection
   */
  async getUserConnection(userId?: string) {
    try {
      let finalUserId: string;
      
      if (userId) {
        finalUserId = userId;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("User not authenticated when getting QBO connection");
          throw new Error("User not authenticated");
        }
        finalUserId = user.id;
      }
      
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', finalUserId)
        .single();
        
      if (error) {
        console.log("No QBO connection found for user", finalUserId);
        return null;
      }
      
      return connection;
    } catch (error) {
      console.error("Error getting user QBO connection:", error);
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
