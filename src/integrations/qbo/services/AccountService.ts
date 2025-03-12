
import { BaseQBOService } from "./BaseQBOService";

export class AccountService {
  private baseService: BaseQBOService;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
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
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Account WHERE AccountType = '${accountType}'`
        }
      });
      
      return {
        success: true,
        data: response.data.QueryResponse.Account || []
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
