import axios from "axios";
import { QBOConnectionService } from "./connection/qboConnectionService";
import { supabase } from "@/integrations/supabase/client";
import { QBOEdgeFunctionService } from "@/lib/qbo/qboEdgeFunctionService";

/**
 * Simplified QBO service that uses Supabase Edge Functions for API calls
 * This replaces the previous CORS proxy implementation
 */
export class QBOProxyService {
  private connectionService: QBOConnectionService;
  private edgeFunctionService: QBOEdgeFunctionService;
  
  constructor() {
    this.connectionService = new QBOConnectionService();
    this.edgeFunctionService = new QBOEdgeFunctionService();
    console.log("QBOProxyService initialized with Edge Function");
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    return this.connectionService.getConnection();
  }
  
  /**
   * Test connection to QBO using the Edge Function
   */
  async testConnection() {
    try {
      const result = await this.edgeFunctionService.testConnection();
      
      return {
        success: true,
        status: 200,
        data: result
      };
    } catch (error) {
      console.error("Error testing QBO connection:", error);
      return {
        success: false,
        error: error
      };
    }
  }
  
  /**
   * Make a request to the QBO API through the Edge Function
   */
  async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body: any = null) {
    try {
      const result = await this.edgeFunctionService.makeRequest(endpoint, method, body);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error making QBO request to ${endpoint}:`, error);
      return {
        success: false,
        error: error
      };
    }
  }
}
