import { BaseQBOService } from "./BaseQBOService";
import axios from "axios";

export class AccountService {
  private baseService: BaseQBOService;
  private proxyUrl: string;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
    this.proxyUrl = "http://localhost:3030/proxy";
    console.log("AccountService initialized with proxy URL:", this.proxyUrl);
  }

  /**
   * Get all QBO accounts of a specific type
   */
  async getAccounts(accountType: string) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Getting accounts of type:", accountType);
      
      // Use the proxy for the query operation
      const response = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        params: {
          query: `SELECT * FROM Account WHERE AccountType = '${accountType}'`
        }
      });
      
      return {
        success: true,
        data: response.data.QueryResponse?.Account || []
      };
    } catch (error) {
      console.error("Error getting QBO accounts:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
