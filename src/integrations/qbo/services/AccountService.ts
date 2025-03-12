
import { BaseQBOService } from "./BaseQBOService";

export class AccountService extends BaseQBOService {
  /**
   * Get GL accounts from QBO by account type
   */
  async getAccounts(accountType?: string): Promise<any[]> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Query for accounts
      let query = 'SELECT * FROM Account';
      if (accountType) {
        query += ` WHERE AccountType = '${accountType}'`;
      }
      query += ' ORDER BY Name';
      
      const response = await client.get('/query', {
        params: { query }
      });
      
      const accounts = response.data.QueryResponse.Account;
      return accounts || [];
    } catch (error) {
      console.error("Error getting accounts:", error);
      return [];
    }
  }
}
