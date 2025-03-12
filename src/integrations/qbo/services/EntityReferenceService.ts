
import { BaseQBOService } from "./BaseQBOService";
import { supabase } from "@/integrations/supabase/client";

export class EntityReferenceService extends BaseQBOService {
  /**
   * Store a reference to a QBO entity in our database
   */
  async storeEntityReference(
    localEntityId: string,
    localEntityType: string,
    qboEntityId: string,
    qboEntityType: string
  ): Promise<boolean> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('qbo_references')
        .upsert({
          user_id: user.id,
          qbo_company_id: connection.company_id,
          local_entity_id: localEntityId,
          local_entity_type: localEntityType,
          qbo_entity_id: qboEntityId,
          qbo_entity_type: qboEntityType,
          sync_status: 'synced',
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO entity reference:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error storing QBO entity reference:", error);
      return false;
    }
  }
  
  /**
   * Get a QBO entity reference from our database
   */
  async getEntityReference(localEntityId: string, localEntityType: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('qbo_references')
        .select('*')
        .eq('local_entity_id', localEntityId)
        .eq('local_entity_type', localEntityType)
        .single();
        
      if (error || !data) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error getting QBO entity reference:", error);
      return null;
    }
  }
}
