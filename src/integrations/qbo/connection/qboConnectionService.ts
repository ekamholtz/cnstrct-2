
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
}
