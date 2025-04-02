
import { BaseQBOEdgeFunction } from "./services/BaseQBOEdgeFunction";
import { AccountServiceProxy } from "./services/AccountServiceProxy";
import { CustomerVendorServiceProxy } from "./services/CustomerVendorServiceProxy";
import { BillServiceProxy } from "./services/BillServiceProxy";
import { InvoiceServiceProxy } from "./services/InvoiceServiceProxy";
import { EntityReferenceServiceProxy } from "./services/EntityReferenceServiceProxy";
import { supabase } from "../supabase/client";

/**
 * QBOService coordinates all QuickBooks Online API interactions
 * by utilizing specialized service classes for different entity types
 * This version uses Supabase Edge Functions instead of a CORS proxy
 */
export class QBOService {
  private accountService: AccountServiceProxy;
  private customerVendorService: CustomerVendorServiceProxy;
  private billService: BillServiceProxy;
  private invoiceService: InvoiceServiceProxy;
  private entityRefService: EntityReferenceServiceProxy;
  private baseService: BaseQBOEdgeFunction;
  
  constructor() {
    console.warn("QBOService is being instantiated using Supabase Edge Functions");
    this.baseService = new BaseQBOEdgeFunction();
    
    // Create service instances with the base service
    this.customerVendorService = new CustomerVendorServiceProxy(this.baseService);
    this.accountService = new AccountServiceProxy(this.baseService);
    this.billService = new BillServiceProxy(this.baseService);
    this.invoiceService = new InvoiceServiceProxy(this.baseService);
    this.entityRefService = new EntityReferenceServiceProxy(this.baseService);
    
    console.log("QBOService initialized with Edge Function-backed services");
  }

  /**
   * Get the current user's QBO connection
   */
  async getUserConnection() {
    return this.baseService.getUserConnection();
  }

  // Account related methods
  async getAccounts(accountType: string) {
    console.log("QBOService: Getting accounts of type:", accountType);
    return this.accountService.getAccounts(accountType);
  }

  // Entity reference methods
  async getEntityReference(entityType: string, entityId: string) {
    console.log("QBOService: Getting entity reference for:", entityType, entityId);
    return this.entityRefService.getEntityReference(entityType, entityId);
  }

  async storeEntityReference(entityType: string, entityId: string, qboId: string): Promise<boolean> {
    console.log("QBOService: Storing entity reference:", entityType, entityId, qboId);
    const result = await this.entityRefService.storeEntityReference(entityType, entityId, qboId);
    return result.success;
  }

  // Vendor/Customer methods
  async getVendorIdForExpense(vendorName: string) {
    console.log("QBOService: Getting vendor ID for expense:", vendorName);
    return this.customerVendorService.getVendorIdForExpense(vendorName);
  }

  async findVendor(vendorName: string) {
    console.log("QBOService: Finding vendor:", vendorName);
    return this.customerVendorService.findVendor(vendorName);
  }

  async createVendor(vendorData: any) {
    console.log("QBOService: Creating vendor:", vendorData);
    return this.customerVendorService.createVendor(vendorData);
  }
  
  async findCustomer(customerName: string) {
    console.log("QBOService: Finding customer by name:", customerName);
    return this.customerVendorService.findCustomer(customerName);
  }
  
  async findCustomerByEmail(email: string) {
    console.log("QBOService: Finding customer by email:", email);
    return this.customerVendorService.findCustomerByEmail(email);
  }
  
  /**
   * Create a customer in QBO
   */
  async createCustomer(customerData: any) {
    console.log("QBOService: Creating customer in QBO via Edge Function...", JSON.stringify(customerData));
    return this.customerVendorService.createCustomer(customerData);
  }
  
  // Bill methods
  async createBill(billData: any) {
    console.log("QBOService: Creating bill:", billData);
    return this.billService.createBill(billData);
  }
  
  async createBillPayment(paymentData: any) {
    console.log("QBOService: Creating bill payment:", paymentData);
    return this.billService.createBillPayment(paymentData);
  }
  
  // Invoice methods
  async createInvoice(invoiceData: any) {
    console.log("QBOService: Creating invoice using Edge Function:", invoiceData);
    return this.invoiceService.createInvoice(invoiceData);
  }
  
  async recordPayment(paymentData: any) {
    console.log("QBOService: Recording payment:", paymentData);
    return this.invoiceService.recordPayment(paymentData);
  }
  
  /**
   * Get a list of QBO transactions
   */
  async getTransactions(type = 'ALL', startDate?: string, endDate?: string) {
    console.log("QBOService: Getting transactions:", type, startDate, endDate);
    
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Construct the query
      let query = 'SELECT * FROM Transaction';
      
      if (type !== 'ALL') {
        query += ` WHERE Type = '${type}'`;
      }
      
      if (startDate) {
        query += type === 'ALL' ? ' WHERE ' : ' AND ';
        query += `TxnDate >= '${startDate}'`;
      }
      
      if (endDate) {
        query += (!startDate && type === 'ALL') ? ' WHERE ' : ' AND ';
        query += `TxnDate <= '${endDate}'`;
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: { query }
      });
      
      // Check for QueryResponse in the data
      if (response.QueryResponse) {
        return {
          success: true,
          data: response.QueryResponse
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error("Error getting QBO transactions:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
