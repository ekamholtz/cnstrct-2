import { BaseQBOServiceProxy } from "./services/BaseQBOServiceProxy";
import { AccountServiceProxy } from "./services/AccountServiceProxy";
import { CustomerVendorServiceProxy } from "./services/CustomerVendorServiceProxy";
import { BillServiceProxy } from "./services/BillServiceProxy";
import { InvoiceServiceProxy } from "./services/InvoiceServiceProxy";
import { EntityReferenceServiceProxy } from "./services/EntityReferenceServiceProxy";
import axios from "axios";
import { supabase } from "../supabase/client";

/**
 * QBOService coordinates all QuickBooks Online API interactions
 * by utilizing specialized service classes for different entity types
 * This version uses a CORS proxy for browser-based API calls
 */
export class QBOService {
  private accountService: AccountServiceProxy;
  private customerVendorService: CustomerVendorServiceProxy;
  private billService: BillServiceProxy;
  private invoiceService: InvoiceServiceProxy;
  private entityRefService: EntityReferenceServiceProxy;
  private baseService: BaseQBOServiceProxy;
  private proxyUrl: string;
  
  constructor() {
    console.warn("QBOService is being properly instantiated with proxy-aware services - v3");
    this.baseService = new BaseQBOServiceProxy();
    this.proxyUrl = "http://localhost:3030/proxy";
    
    // Create proxy-aware service instances with the base service
    this.customerVendorService = new CustomerVendorServiceProxy(this.baseService);
    this.accountService = new AccountServiceProxy(this.baseService);
    this.billService = new BillServiceProxy(this.baseService);
    this.invoiceService = new InvoiceServiceProxy(this.baseService);
    this.entityRefService = new EntityReferenceServiceProxy(this.baseService);
    
    console.log("QBOService initialized with proxy-aware services");
  }

  /**
   * Get the current user's QBO connection
   */
  async getUserConnection() {
    return this.baseService.getUserConnection();
  }

  // Account related methods
  async getAccounts(accountType: string) {
    console.log("QBOServiceProxy: Getting accounts of type:", accountType);
    return this.accountService.getAccounts(accountType);
  }

  // Entity reference methods
  async getEntityReference(entityType: string, entityId: string) {
    console.log("QBOServiceProxy: Getting entity reference for:", entityType, entityId);
    return this.entityRefService.getEntityReference(entityType, entityId);
  }

  async storeEntityReference(entityType: string, entityId: string, qboId: string): Promise<boolean> {
    console.log("QBOServiceProxy: Storing entity reference:", entityType, entityId, qboId);
    const result = await this.entityRefService.storeEntityReference(entityType, entityId, qboId);
    return result.success;
  }

  // Vendor/Customer methods
  async getVendorIdForExpense(vendorName: string) {
    console.log("QBOServiceProxy: Getting vendor ID for expense:", vendorName);
    return this.customerVendorService.getVendorIdForExpense(vendorName);
  }

  async findVendor(vendorName: string) {
    console.log("QBOServiceProxy: Finding vendor:", vendorName);
    return this.customerVendorService.findVendor(vendorName);
  }

  async createVendor(vendorData: any) {
    console.log("QBOServiceProxy: Creating vendor using proxy:", vendorData);
    return this.customerVendorService.createVendor(vendorData);
  }
  
  async findCustomer(customerName: string) {
    console.log("QBOServiceProxy: Finding customer by name:", customerName);
    return this.customerVendorService.findCustomer(customerName);
  }
  
  async findCustomerByEmail(email: string) {
    console.log("QBOServiceProxy: Finding customer by email:", email);
    return this.customerVendorService.findCustomerByEmail(email);
  }
  
  /**
   * Create a customer in QBO - CRITICAL METHOD
   * MUST use the proxy for the create operation to avoid CORS issues
   */
  async createCustomer(customerData: any) {
    console.log("QBOServiceProxy: Creating customer in QBO via proxy...", JSON.stringify(customerData));
    
    // IMPORTANT: Always use the proxy-aware service to create customers
    // This ensures all API calls go through the CORS proxy
    return this.customerVendorService.createCustomer(customerData);
  }
  
  // Bill methods
  async createBill(billData: any) {
    console.log("QBOServiceProxy: Creating bill:", billData);
    return this.billService.createBill(billData);
  }
  
  async createBillPayment(paymentData: any) {
    console.log("QBOServiceProxy: Creating bill payment:", paymentData);
    return this.billService.createBillPayment(paymentData);
  }
  
  // Invoice methods
  async createInvoice(invoiceData: any) {
    console.log("QBOServiceProxy: Creating invoice using proxy:", invoiceData);
    return this.invoiceService.createInvoice(invoiceData);
  }
  
  async recordPayment(paymentData: any) {
    console.log("QBOServiceProxy: Recording payment:", paymentData);
    return this.invoiceService.recordPayment(paymentData);
  }
  
  /**
   * Get a list of QBO transactions
   */
  async getTransactions(type = 'ALL', startDate?: string, endDate?: string) {
    console.log("QBOServiceProxy: Getting transactions:", type, startDate, endDate);
    
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
      
      // Use the proxy for the query operation
      const response = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        params: {
          query
        }
      });
      
      // Check for QueryResponse in the data
      if (response.data.QueryResponse) {
        return {
          success: true,
          data: response.data.QueryResponse
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
