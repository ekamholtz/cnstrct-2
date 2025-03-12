
import axios from "axios";
import { QBOConfig } from "../config/qboConfig";

/**
 * Service for QBO company-related operations
 */
export class QBOCompanyService {
  private config: QBOConfig;
  
  constructor() {
    this.config = new QBOConfig();
  }
  
  /**
   * Get company information from QBO
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<{
    companyName: string;
    [key: string]: any;
  }> {
    try {
      console.log("Getting company info from QBO...");
      
      const url = `${this.config.apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`;
      console.log("Company info URL:", url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log("Company info retrieved successfully");
      
      return {
        companyName: response.data.CompanyInfo.CompanyName,
        ...response.data.CompanyInfo
      };
    } catch (error) {
      console.error("Error getting company info:", error);
      return { companyName: 'Unknown Company' };
    }
  }
}
