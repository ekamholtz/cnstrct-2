
import { BaseQBOEdgeFunction } from "./BaseQBOEdgeFunction";

export class AccountServiceProxy {
  private baseService: BaseQBOEdgeFunction;
  
  constructor(baseService: BaseQBOEdgeFunction) {
    this.baseService = baseService;
    console.log("AccountServiceProxy initialized with Edge Function support");
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
      
      // Use Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM Account WHERE AccountType = '${accountType}'`
        }
      });
      
      return {
        success: true,
        data: response.QueryResponse?.Account || []
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
