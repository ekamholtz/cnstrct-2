import { AuthorizationService } from "./auth/AuthorizationService";
import { APIClientFactory } from "./api/APIClientFactory";
import { QBOConfig } from "../config/qboConfig";
import { QBOConnectionService } from "../connection/qboConnectionService";
import axios from "axios";
import { supabase } from "../../../integrations/supabase/client";

export class BaseQBOServiceProxy {
  protected authService: AuthorizationService;
  protected apiClientFactory: APIClientFactory;
  protected connectionService: QBOConnectionService;
  protected connectionManager: QBOConnectionService;
  protected config: QBOConfig;
  protected baseUrl: string;
  protected proxyUrl: string;
  
  constructor() {
    this.authService = new AuthorizationService();
    this.apiClientFactory = new APIClientFactory();
    this.connectionService = new QBOConnectionService();
    this.connectionManager = this.connectionService;
    
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    this.baseUrl = this.config.apiBaseUrl;
    this.proxyUrl = "http://localhost:3030/proxy";
      
    console.log("BaseQBOServiceProxy initialized with baseUrl:", this.baseUrl);
    console.log("Using CORS proxy at:", this.proxyUrl);
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async getClient(connectionId: string, companyId: string) {
    return this.apiClientFactory.createClient(connectionId, companyId);
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
   * Test the connection to QBO
   */
  async testConnection(connectionId?: string, companyId?: string): Promise<
    { success: boolean; status: number; data: any; error?: undefined; } | 
    { success: boolean; error: any; status?: undefined; data?: undefined; }
  > {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const actualConnectionId = connectionId || connection.id;
      const actualCompanyId = companyId || connection.company_id;
      
      // Use the proxy for the test connection
      const response = await axios.post(`${this.proxyUrl}/test-connection`, {
        accessToken: connection.access_token,
        realmId: actualCompanyId
      });
      
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error("Error testing QBO connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
