
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing QBO connections
 */
export class ConnectionManager {
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("User not authenticated when getting QBO connection");
        throw new Error("User not authenticated");
      }
      
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.log("No QBO connection found for user", user.id);
        return null;
      }
      
      return connection;
    } catch (error) {
      console.error("Error getting user QBO connection:", error);
      return null;
    }
  }
}
