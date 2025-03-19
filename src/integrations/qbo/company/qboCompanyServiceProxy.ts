import { supabase } from "@/integrations/supabase/client";
import { QBOConfig } from "../config/qboConfig";
import axios from "axios";

/**
 * Service for QBO company operations with proxy support
 */
export class QBOCompanyServiceProxy {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    // Use the singleton instance to ensure consistent configuration
    this.config = QBOConfig.getInstance();
    
    // Get proxy URL dynamically based on environment
    this.proxyUrl = this.getProxyUrl();
    
    console.log("QBOCompanyServiceProxy initialized with client ID:", this.config.clientId);
    console.log("QBOCompanyServiceProxy using proxy URL:", this.proxyUrl);
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
   * Get company information from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<any> {
    try {
      console.log("Getting company info for realmId:", realmId);
      
      // Use the proxy for data operations
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken,
        realmId,
        endpoint: `company/${realmId}/companyinfo/${realmId}`,
        method: 'get'
      });
      
      console.log("Company info retrieved successfully");
      return response.data.CompanyInfo;
    } catch (error: any) {
      console.error("Error getting company info:", error);
      
      if (error.response) {
        console.error("API response error:", error.response.data);
        console.error("API response status:", error.response.status);
      }
      
      throw new Error(`Failed to get company information: ${error.message}`);
    }
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection(userId: string) {
    return await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', userId)
      .single();
  }
  
  /**
   * Delete user's QBO connection
   */
  async deleteUserConnection(userId: string) {
    return await supabase
      .from('qbo_connections')
      .delete()
      .eq('user_id', userId);
  }
  
  /**
   * Test connection to QBO
   */
  async testConnection(accessToken: string, realmId: string): Promise<boolean> {
    try {
      console.log("Testing QBO connection for realmId:", realmId);
      
      // Use the test-connection endpoint of the proxy
      const response = await axios.post(`${this.proxyUrl}/test-connection`, {
        accessToken,
        realmId
      });
      
      console.log("Connection test result:", response.data);
      return response.data.success;
    } catch (error: any) {
      console.error("Error testing connection:", error);
      
      if (error.response) {
        console.error("API response error:", error.response.data);
      }
      
      return false;
    }
  }
}
