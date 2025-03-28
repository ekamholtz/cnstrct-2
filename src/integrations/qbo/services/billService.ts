import { BaseQBOService } from "./BaseQBOService";
import axios from "axios";

export class BillService {
  private baseService: BaseQBOService;
  private proxyUrl: string;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
    this.proxyUrl = "http://localhost:3030/proxy";
    console.log("BillService initialized with proxy URL:", this.proxyUrl);
  }

  /**
   * Create a bill in QBO
   */
  async createBill(billData: any) {
    try {
      console.log("Creating bill in QBO using proxy...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      
      // Use the proxy for the create operation
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "bill",
        method: "post",
        data: billData
      });
      
      console.log("Bill created successfully:", response.data);
      
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
      console.log("Creating bill payment in QBO using proxy...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the proxy for the create operation
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "billpayment",
        method: "post",
        data: billPaymentData
      });
      
      console.log("Bill payment created successfully:", response.data);
      
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
