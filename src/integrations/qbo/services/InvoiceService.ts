
import { BaseQBOService } from "./BaseQBOService";

export class InvoiceService {
  private baseService: BaseQBOService;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
  }

  /**
   * Create an invoice in QBO
   */
  async createInvoice(invoiceData: any) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      const response = await client.post('/invoice', invoiceData);
      
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
  async recordPayment({ invoiceId, amount, date, paymentMethod }: {
    invoiceId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }) {
    try {
      console.log("Recording payment in QBO:", { invoiceId, amount, date, paymentMethod });
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      // Format the date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // Create the payment data
      const paymentData = {
        TotalAmt: amount,
        TxnDate: formattedDate,
        PaymentMethodRef: {
          value: paymentMethod || "1" // Default to cash if no method specified
        },
        Line: [
          {
            Amount: amount,
            LinkedTxn: [
              {
                TxnId: invoiceId,
                TxnType: "Invoice"
              }
            ]
          }
        ]
      };
      
      console.log("Sending payment data to QBO:", paymentData);
      
      const response = await client.post('/payment', paymentData);
      
      console.log("QBO payment created successfully:", response.data);
      
      return {
        success: true,
        data: response.data.Payment
      };
    } catch (error: any) {
      console.error("Error recording QBO payment:", error);
      const errorMessage = error.response?.data?.Fault?.Error?.[0]?.Message || 
                          error.message || 
                          'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
