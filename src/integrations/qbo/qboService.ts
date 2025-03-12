
import { BaseQBOService } from "./services/BaseQBOService";
import { QBOMappingService } from "./mapping";
import { supabase } from "@/integrations/supabase/client";

export class QBOService extends BaseQBOService {
  private mappingService: QBOMappingService;
  
  constructor() {
    super();
    this.mappingService = new QBOMappingService();
  }

  /**
   * Get all QBO accounts of a specific type
   */
  async getAccounts(accountType: string) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
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

  /**
   * Get entity reference from database
   */
  async getEntityReference(entityType: string, localId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('qbo_entity_refs')
        .select('qbo_id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('local_id', localId)
        .single();
        
      if (error) {
        console.log("QBO entity reference not found", { entityType, localId });
        return null;
      }
      
      return data.qbo_id;
    } catch (error) {
      console.error("Error getting QBO entity reference:", error);
      return null;
    }
  }

  /**
   * Store entity reference mapping
   */
  async storeEntityReference(entityType: string, localId: string, qboId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { error } = await supabase
        .from('qbo_entity_refs')
        .upsert({
          user_id: user.id,
          entity_type: entityType,
          local_id: localId,
          qbo_id: qboId,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO entity reference:", error);
        throw new Error("Failed to store QBO entity reference");
      }
      
      return true;
    } catch (error) {
      console.error("Error storing QBO entity reference:", error);
      return false;
    }
  }

  /**
   * Find a vendor by name in QBO
   */
  async getVendorIdForExpense(vendorName: string) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Try to find the vendor by name
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
        }
      });
      
      const vendors = response.data.QueryResponse.Vendor || [];
      
      if (vendors.length > 0) {
        return vendors[0].Id;
      }
      
      // If vendor not found, create a new one
      const vendorData = {
        DisplayName: vendorName,
        PrintOnCheckName: vendorName,
        Active: true
      };
      
      const createResponse = await client.post('/vendor', vendorData);
      
      return createResponse.data.Vendor.Id;
    } catch (error) {
      console.error("Error getting/creating vendor in QBO:", error);
      throw new Error("Failed to get or create vendor in QuickBooks");
    }
  }

  /**
   * Find a customer by email
   */
  async findCustomerByEmail(email: string) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Try to find the customer by email
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      return {
        success: true,
        data: response.data.QueryResponse.Customer?.[0] || null
      };
    } catch (error) {
      console.error("Error finding QBO customer by email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a customer in QBO
   */
  async createCustomer(customerData: any) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      const response = await client.post('/customer', customerData);
      
      return {
        success: true,
        data: response.data.Customer
      };
    } catch (error) {
      console.error("Error creating QBO customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a bill in QBO
   */
  async createBill(billData: any) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
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
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
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

  /**
   * Create an invoice in QBO
   */
  async createInvoice(invoiceData: any) {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
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
      
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
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
