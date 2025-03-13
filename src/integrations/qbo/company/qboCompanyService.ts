import axios from "axios";
import { QBOConfig } from "../config/qboConfig";

/**
 * Service for QBO company-related operations
 * @deprecated Use QBOCompanyServiceProxy instead to avoid CORS issues
 */
export class QBOCompanyService {
  private config: QBOConfig;
  private proxyUrl: string;
  
  constructor() {
    this.config = new QBOConfig();
    this.proxyUrl = "http://localhost:3030/proxy";
    console.warn("WARNING: Using deprecated QBOCompanyService. Please use QBOCompanyServiceProxy instead.");
  }
  
  /**
   * Get company information from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<{
    companyName: string;
    [key: string]: any;
  }> {
    try {
      console.log("Getting company info from QBO via proxy...");
      
      // Use the proxy for the company info request
      const response = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken: accessToken,
        realmId: realmId,
        endpoint: `companyinfo/${realmId}`,
        method: "get"
      });
      
      console.log("Company info retrieved successfully");
      
      return {
        companyName: response.data.CompanyInfo.CompanyName,
        ...response.data.CompanyInfo
      };
    } catch (error) {
      console.error("Error getting company info:", error);
      throw error;
    }
  }
}
