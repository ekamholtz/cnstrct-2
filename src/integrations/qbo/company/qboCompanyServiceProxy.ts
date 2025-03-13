import axios from "axios";
import { QBOConfig } from "../config/qboConfigFixed";

/**
 * Service for QBO company-related operations using CORS proxy
 */
export class QBOCompanyService {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    this.config = new QBOConfig();
    // Use local CORS proxy for development
    this.proxyUrl = "http://localhost:3030/proxy";
  }
  
  /**
   * Get company information from QBO via CORS proxy
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<{
    companyName: string;
    [key: string]: any;
  }> {
    try {
      console.log("Getting company info from QBO via CORS proxy...");
      
      // Instead of direct API call, use the proxy
      const proxyResponse = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken,
        realmId
      });
      
      console.log("Company info retrieved successfully via proxy");
      
      // If we got a successful response from the proxy
      if (proxyResponse.data && proxyResponse.data.CompanyInfo) {
        return {
          companyName: proxyResponse.data.CompanyInfo.CompanyName || 'Unknown Company',
          ...proxyResponse.data.CompanyInfo
        };
      }
      
      return { companyName: 'Unknown Company' };
    } catch (error) {
      console.error("Error getting company info via proxy:", error);
      return { companyName: 'Unknown Company' };
    }
  }
  
  /**
   * Test connection to QBO via CORS proxy
   */
  async testConnection(accessToken: string, realmId: string): Promise<boolean> {
    try {
      console.log("Testing QBO connection via CORS proxy...");
      
      // Use the proxy for the test connection
      const response = await axios.post(`${this.proxyUrl}/test-connection`, {
        accessToken,
        realmId
      });
      
      return response.status === 200;
    } catch (error) {
      console.error("QBO connection test failed:", error);
      return false;
    }
  }
}
