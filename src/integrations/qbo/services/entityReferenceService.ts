
import { BaseQBOService } from "./BaseQBOService";
import { supabase } from "@/integrations/supabase/client";

export class EntityReferenceService {
  private baseService: BaseQBOService;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
  }

  /**
   * Get entity reference from database
   */
  async getEntityReference(entityType: string, localId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('qbo_entity_refs')
        .select('qbo_id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('local_id', localId)
        .single();
        
      if (error) {
        console.log("QBO entity reference not found", { entityType, localId });
        return null;
      }
      
      return data.qbo_id;
    } catch (error) {
      console.error("Error getting QBO entity reference:", error);
      return null;
    }
  }

  /**
   * Store entity reference mapping
   */
  async storeEntityReference(entityType: string, localId: string, qboId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { error } = await supabase
        .from('qbo_entity_refs')
        .upsert({
          user_id: user.id,
          entity_type: entityType,
          local_id: localId,
          qbo_id: qboId,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO entity reference:", error);
        throw new Error("Failed to store QBO entity reference");
      }
      
      return true;
    } catch (error) {
      console.error("Error storing QBO entity reference:", error);
      return false;
    }
  }
}
