
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for QBO connection management
 */
export class QBOConnectionService {
  /**
   * Get current user's QBO connection
   */
  async getConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching QBO connection:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getConnection:', error);
      return null;
    }
  }
}
