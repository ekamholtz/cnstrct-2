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
    
    // Determine proxy URL based on environment
    const hostname = window.location.hostname.replace('preview--', '');
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      // Local development
      this.proxyUrl = "http://localhost:3030/proxy";
    } else {
      // Production environment - use relative URL to avoid CORS issues
      this.proxyUrl = "/api/proxy";
    }
    
    console.log("QBOCompanyServiceProxy initialized with client ID:", this.config.clientId);
    console.log("QBOCompanyServiceProxy using proxy URL:", this.proxyUrl);
  }
  
  /**
   * Get company information from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<any> {
    try {
      // Force the correct proxy URL based on the environment
      const hostname = window.location.hostname.replace('preview--', '');
      const finalProxyUrl = (hostname === 'localhost' || hostname.includes('127.0.0.1'))
        ? "http://localhost:3030/proxy"
        : "/api/proxy";
        
      console.log("Using proxy URL for company info:", finalProxyUrl);
      
      const response = await axios.get(`${this.config.apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      return response.data.CompanyInfo;
    } catch (error: any) {
      console.error("Error getting company info:", error.response?.data || error.message);
      throw new Error("Failed to get company information");
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
}
