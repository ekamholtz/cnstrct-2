
import { supabase } from "../../../integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";

export class BaseQBOEdgeFunction {
  protected config: QBOConfig;

  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    console.log("BaseQBOEdgeFunction initialized with Edge Function support");
  }
  
  /**
   * Get the current user's QBO connection
   */
  async getUserConnection() {
    try {
      console.log("Getting user QBO connection...");
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return null;
      }
      
      // Get the user's QBO connection
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !connection) {
        console.error("No QBO connection found for user:", user.id, error);
        return null;
      }
      
      console.log("Found QBO connection:", connection.id);
      return connection;
    } catch (error) {
      console.error("Error getting QBO connection:", error);
      return null;
    }
  }
  
  /**
   * Exchange authorization code for QBO access token via Edge Function
   */
  async exchangeCodeForToken(code: string, redirectUri: string) {
    try {
      console.log("Exchanging authorization code for tokens via Edge Function");
      
      const { data, error } = await supabase.functions.invoke('qbo-token', {
        body: { code, redirectUri }
      });
      
      if (error) {
        throw new Error(`Failed to exchange code: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      throw error;
    }
  }
  
  /**
   * Refresh QBO access token via Edge Function
   */
  async refreshToken(refreshToken: string) {
    try {
      console.log("Refreshing QBO token via Edge Function");
      
      const { data, error } = await supabase.functions.invoke('qbo-refresh', {
        body: { refreshToken }
      });
      
      if (error) {
        throw new Error(`Failed to refresh token: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }
  
  /**
   * Test connection to QBO via Edge Function
   */
  async testConnection() {
    try {
      console.log("Testing QBO connection via Edge Function");
      
      const connection = await this.getUserConnection();
      if (!connection) {
        return { success: false, error: "No QuickBooks connection found" };
      }
      
      const { data, error } = await supabase.functions.invoke('qbo-test-connection', {
        body: {
          accessToken: connection.access_token,
          realmId: connection.company_id
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Check if token was refreshed and update connection if needed
      if (data.newAccessToken) {
        try {
          await supabase
            .from('qbo_connections')
            .update({
              access_token: data.newAccessToken,
              refresh_token: data.newRefreshToken || connection.refresh_token,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);
        } catch (updateError) {
          console.error("Error updating token:", updateError);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Error testing connection:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
  
  /**
   * Make a QBO data operation via Edge Function
   */
  async makeDataOperation(params: {
    accessToken: string;
    realmId: string;
    endpoint: string;
    method?: string;
    data?: any;
  }) {
    try {
      console.log(`Making ${params.method || 'GET'} request to QBO endpoint: ${params.endpoint}`);
      
      const { data, error } = await supabase.functions.invoke('qbo-data-operation', {
        body: params
      });
      
      if (error) {
        throw new Error(`Failed QBO operation: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error in QBO data operation:`, error);
      throw error;
    }
  }
  
  /**
   * Get entity reference from the database
   */
  async getEntityReference(entityType: string, entityId: string): Promise<{ qbo_id: any; } | null> {
    try {
      console.log(`Getting QBO reference for ${entityType} with ID ${entityId}`);
      
      const { data, error } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();
      
      if (error) {
        console.error("Error getting QBO reference:", error);
        return null;
      }
      
      return data as { qbo_id: any; } || null;
    } catch (error) {
      console.error("Error getting QBO reference:", error);
      return null;
    }
  }
  
  /**
   * Store entity reference in the database
   */
  async storeEntityReference(entityType: string, entityId: string, qboId: string): Promise<boolean> {
    try {
      console.log(`Storing QBO reference for ${entityType} with ID ${entityId} -> QBO ID: ${qboId}`);
      
      // Check if reference already exists
      const { data: existingRef } = await supabase
        .from('qbo_references')
        .select('id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();
      
      if (existingRef) {
        // Update existing reference
        const { error } = await supabase
          .from('qbo_references')
          .update({ qbo_id: qboId })
          .eq('id', existingRef.id);
        
        if (error) {
          throw new Error(`Failed to update QBO reference: ${error.message}`);
        }
      } else {
        // Create new reference
        const { error } = await supabase
          .from('qbo_references')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            qbo_id: qboId
          });
        
        if (error) {
          throw new Error(`Failed to create QBO reference: ${error.message}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error storing QBO reference:", error);
      return false;
    }
  }
}
