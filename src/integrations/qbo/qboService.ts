
import axios, { AxiosInstance } from "axios";
import { QBOAuthService } from "./authService";
import { supabase } from "@/integrations/supabase/client";

export class QBOService {
  private authService: QBOAuthService;
  private baseUrl: string;
  
  constructor() {
    this.authService = new QBOAuthService();
    // Use sandbox URL for development, production URL for production
    this.baseUrl = "https://sandbox-quickbooks.api.intuit.com/v3";
  }
  
  /**
   * Get an authenticated API client for QBO
   */
  async getClient(connectionId: string, companyId: string): Promise<AxiosInstance> {
    try {
      // Get a fresh token
      const token = await this.authService.refreshToken(connectionId);
      
      // Create and return axios instance
      return axios.create({
        baseURL: `${this.baseUrl}/company/${companyId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error getting QBO client:", error);
      throw new Error("Failed to create QBO client");
    }
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data: connection, error } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error || !connection) {
      return null;
    }
    
    return connection;
  }
  
  /**
   * Check if a customer exists in QBO by email
   */
  async findCustomerByEmail(email: string): Promise<any | null> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Query for customer with matching email
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      const customers = response.data.QueryResponse.Customer;
      if (!customers || customers.length === 0) {
        return null;
      }
      
      return customers[0];
    } catch (error) {
      console.error("Error finding customer by email:", error);
      throw error;
    }
  }
  
  /**
   * Create a new customer in QBO
   */
  async createCustomer(customerData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Create the customer
      const response = await client.post('/customer', customerData);
      
      return response.data.Customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }
  
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
   * Get the vendor ID for an expense
   */
  async getVendorIdForExpense(expenseId: string): Promise<string> {
    try {
      // First, get the expense reference in QBO
      const expenseRef = await this.getEntityReference(expenseId, 'expense');
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
  
  /**
   * Get the customer ID for an invoice
   */
  async getCustomerIdForInvoice(invoiceId: string): Promise<string> {
    try {
      // First, get the invoice reference in QBO
      const invoiceRef = await this.getEntityReference(invoiceId, 'invoice');
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
  
  /**
   * Store a reference to a QBO entity in our database
   */
  async storeEntityReference(
    localEntityId: string,
    localEntityType: string,
    qboEntityId: string,
    qboEntityType: string
  ): Promise<boolean> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('qbo_references')
        .upsert({
          user_id: user.id,
          qbo_company_id: connection.company_id,
          local_entity_id: localEntityId,
          local_entity_type: localEntityType,
          qbo_entity_id: qboEntityId,
          qbo_entity_type: qboEntityType,
          sync_status: 'synced',
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error storing QBO entity reference:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error storing QBO entity reference:", error);
      return false;
    }
  }
  
  /**
   * Get a QBO entity reference from our database
   */
  async getEntityReference(localEntityId: string, localEntityType: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('qbo_references')
        .select('*')
        .eq('local_entity_id', localEntityId)
        .eq('local_entity_type', localEntityType)
        .single();
        
      if (error || !data) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error getting QBO entity reference:", error);
      return null;
    }
  }
}
