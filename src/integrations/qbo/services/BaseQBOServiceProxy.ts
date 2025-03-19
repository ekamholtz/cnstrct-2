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
    this.proxyUrl = this.getProxyUrl();
      
    console.log("BaseQBOServiceProxy initialized with baseUrl:", this.baseUrl);
    console.log("Using CORS proxy at:", this.proxyUrl);
  }
  
  /**
   * Get the appropriate proxy URL based on environment
   */
  private getProxyUrl(): string {
    if (typeof window === 'undefined') {
      return "/api/proxy";
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return "http://localhost:3030/proxy";
    }
    // For production, use the relative path to Vercel serverless functions
    return "/api/proxy";
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
      let connection;
      
      if (connectionId && companyId) {
        // Get specific connection
        const { data, error } = await supabase
          .from('qbo_connections')
          .select('*')
          .eq('id', connectionId)
          .single();
          
        if (error || !data) {
          console.error("Connection not found:", connectionId, error);
          return { success: false, error: "Connection not found" };
        }
        
        connection = data;
      } else {
        // Get current user's connection
        connection = await this.getUserConnection();
      }
      
      if (!connection) {
        return { success: false, error: "No QuickBooks Online connection found" };
      }
      
      console.log("Testing QBO connection for company ID:", connection.company_id);
      
      // Use the test-connection endpoint
      const response = await axios.post(`${this.proxyUrl}/test-connection`, {
        accessToken: connection.access_token,
        realmId: connection.company_id
      });
      
      console.log("Connection test result:", response.data);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error: any) {
      console.error("Error testing QBO connection:", error);
      
      if (error.response) {
        console.error("API response error:", error.response.data);
        console.error("Status:", error.response.status);
      }
      
      return {
        success: false,
        error: error.message || "Failed to test QuickBooks Online connection"
      };
    }
  }
  
  /**
   * Make a data operation request to QBO via the proxy
   */
  protected async makeRequest<T>(
    connection: any,
    endpoint: string,
    method: string = 'get',
    data: any = null
  ): Promise<T> {
    try {
      if (!connection || !connection.access_token) {
        throw new Error("Invalid QBO connection - missing access token");
      }
      
      console.log(`Making ${method} request to QBO endpoint: ${endpoint}`);
      
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint,
        method,
        data
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error making ${method} request to ${endpoint}:`, error);
      
      if (error.response?.data) {
        console.error("API response error:", error.response.data);
        console.error("Status:", error.response.status);
        
        // Check for token expiration
        if (error.response.status === 401) {
          console.error("Token expired - attempting refresh...");
          // In a real implementation, you would handle token refresh here
        }
      }
      
      throw new Error(`QBO API request failed: ${error.message}`);
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
