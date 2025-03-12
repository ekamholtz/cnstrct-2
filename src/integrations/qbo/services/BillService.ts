
import { BaseQBOService } from "./BaseQBOService";

export class BillService {
  private baseService: BaseQBOService;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
  }

  /**
   * Create a bill in QBO
   */
  async createBill(billData: any) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      const response = await client.post('/bill', billData);
      
      return {
        success: true,
        data: response.data.Bill
      };
    } catch (error) {
      console.error("Error creating QBO bill:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a bill payment in QBO
   */
  async createBillPayment(billPaymentData: any) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      const response = await client.post('/billpayment', billPaymentData);
      
      return {
        success: true,
        data: response.data.BillPayment
      };
    } catch (error) {
      console.error("Error creating QBO bill payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
