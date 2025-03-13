import { BaseQBOService } from "./BaseQBOService";
import axios from "axios";

export class InvoiceService {
  private baseService: BaseQBOService;
  private proxyUrl: string;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
    this.proxyUrl = "http://localhost:3030/proxy";
    console.log("InvoiceService initialized with proxy URL:", this.proxyUrl);
  }

  /**
   * Create an invoice in QBO
   */
  async createInvoice(invoiceData: any) {
    try {
      console.log("Creating invoice in QBO using proxy...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      
      // Use the proxy for the create operation
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "invoice",
        method: "post",
        data: invoiceData
      });
      
      console.log("Invoice created successfully:", response.data);
      
      return {
        success: true,
        data: response.data.Invoice
      };
    } catch (error) {
      console.error("Error creating QBO invoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record a payment for an invoice in QBO
   */
  async recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }) {
    try {
      console.log("Recording payment in QBO using proxy...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Format the payment data for QBO
      const qboPaymentData = {
        TotalAmt: paymentData.amount,
        PayType: "Cash", // Default to cash payment
        TxnDate: paymentData.date.toISOString().split('T')[0],
        Line: [
          {
            Amount: paymentData.amount,
            LinkedTxn: [
              {
                TxnId: paymentData.invoiceId,
                TxnType: "Invoice"
              }
            ]
          }
        ]
      };
      
      // Use the proxy for the create operation
      const response = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "payment",
        method: "post",
        data: qboPaymentData
      });
      
      console.log("Payment recorded successfully:", response.data);
      
      return {
        success: true,
        data: response.data.Payment
      };
    } catch (error) {
      console.error("Error recording payment in QBO:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
