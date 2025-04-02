
import { BaseQBOEdgeFunction } from "./BaseQBOEdgeFunction";

export class BillServiceProxy {
  private baseService: BaseQBOEdgeFunction;
  
  constructor(baseService: BaseQBOEdgeFunction) {
    this.baseService = baseService;
    console.log("BillServiceProxy initialized with Edge Function support");
  }

  /**
   * Create a bill in QBO
   */
  async createBill(billData: any) {
    try {
      console.log("Creating bill in QBO using Edge Function...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      
      // Use the Edge Function for the create operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "bill",
        method: "post",
        data: billData
      });
      
      console.log("Bill created successfully:", response);
      
      return {
        success: true,
        data: response.Bill
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
      console.log("Creating bill payment in QBO using Edge Function...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the Edge Function for the create operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "billpayment",
        method: "post",
        data: billPaymentData
      });
      
      console.log("Bill payment created successfully:", response);
      
      return {
        success: true,
        data: response.BillPayment
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
