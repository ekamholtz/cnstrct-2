
import { BaseQBOService } from "./BaseQBOService";

export class BillService extends BaseQBOService {
  /**
   * Create a bill in QBO
   */
  async createBill(billData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Create the bill
      const response = await client.post('/bill', billData);
      
      return response.data.Bill;
    } catch (error) {
      console.error("Error creating bill:", error);
      throw error;
    }
  }
  
  /**
   * Create a bill payment in QBO
   */
  async createBillPayment(billPaymentData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Create the bill payment
      const response = await client.post('/billpayment', billPaymentData);
      
      return response.data.BillPayment;
    } catch (error) {
      console.error("Error creating bill payment:", error);
      throw error;
    }
  }
  
  /**
   * Get the vendor ID for an expense
   */
  async getVendorIdForExpense(expenseId: string, entityService: any): Promise<string> {
    try {
      // First, get the expense reference in QBO
      const expenseRef = await entityService.getEntityReference(expenseId, 'expense');
      if (!expenseRef) {
        throw new Error("Expense not synced to QBO yet");
      }
      
      // Then, get the bill from QBO to find the vendor ID
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Query for the bill
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Bill WHERE Id = '${expenseRef.qbo_entity_id}'`
        }
      });
      
      const bills = response.data.QueryResponse.Bill;
      if (!bills || bills.length === 0) {
        throw new Error("Bill not found in QBO");
      }
      
      // Return the vendor ID
      return bills[0].VendorRef.value;
    } catch (error) {
      console.error("Error getting vendor ID for expense:", error);
      throw error;
    }
  }
}
