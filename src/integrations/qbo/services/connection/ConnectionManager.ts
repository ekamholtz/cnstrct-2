
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing QBO connections
 */
export class ConnectionManager {
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
}
