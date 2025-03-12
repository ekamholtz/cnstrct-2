
import { BaseQBOService } from "./BaseQBOService";

export class InvoiceService extends BaseQBOService {
  /**
   * Create an invoice in QBO
   */
  async createInvoice(invoiceData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Create the invoice
      const response = await client.post('/invoice', invoiceData);
      
      return response.data.Invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }
  
  /**
   * Record a payment in QBO
   */
  async recordPayment(paymentData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Record the payment
      const response = await client.post('/payment', paymentData);
      
      return response.data.Payment;
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  }
  
  /**
   * Get the customer ID for an invoice
   */
  async getCustomerIdForInvoice(invoiceId: string, entityService: any): Promise<string> {
    try {
      // First, get the invoice reference in QBO
      const invoiceRef = await entityService.getEntityReference(invoiceId, 'invoice');
      if (!invoiceRef) {
        throw new Error("Invoice not synced to QBO yet");
      }
      
      // Then, get the invoice from QBO to find the customer ID
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Query for the invoice
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Invoice WHERE Id = '${invoiceRef.qbo_entity_id}'`
        }
      });
      
      const invoices = response.data.QueryResponse.Invoice;
      if (!invoices || invoices.length === 0) {
        throw new Error("Invoice not found in QBO");
      }
      
      // Return the customer ID
      return invoices[0].CustomerRef.value;
    } catch (error) {
      console.error("Error getting customer ID for invoice:", error);
      throw error;
    }
  }
}
