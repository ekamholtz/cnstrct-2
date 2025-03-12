
import { CustomerVendorService } from "./services/CustomerVendorService";
import { AccountService } from "./services/AccountService";
import { BillService } from "./services/BillService";
import { InvoiceService } from "./services/InvoiceService";
import { EntityReferenceService } from "./services/EntityReferenceService";

export class QBOService {
  private customerVendorService: CustomerVendorService;
  private accountService: AccountService;
  private billService: BillService;
  private invoiceService: InvoiceService;
  private entityReferenceService: EntityReferenceService;
  
  constructor() {
    this.customerVendorService = new CustomerVendorService();
    this.accountService = new AccountService();
    this.billService = new BillService();
    this.invoiceService = new InvoiceService();
    this.entityReferenceService = new EntityReferenceService();
  }
  
  /**
   * Get user's QBO connection
   */
  async getUserConnection() {
    return this.customerVendorService.getUserConnection();
  }
  
  /**
   * Check if a customer exists in QBO by email
   */
  async findCustomerByEmail(email: string): Promise<any | null> {
    return this.customerVendorService.findCustomerByEmail(email);
  }
  
  /**
   * Create a new customer in QBO
   */
  async createCustomer(customerData: any): Promise<any> {
    return this.customerVendorService.createCustomer(customerData);
  }
  
  /**
   * Get GL accounts from QBO by account type
   */
  async getAccounts(accountType?: string): Promise<any[]> {
    return this.accountService.getAccounts(accountType);
  }
  
  /**
   * Create a bill in QBO
   */
  async createBill(billData: any): Promise<any> {
    return this.billService.createBill(billData);
  }
  
  /**
   * Create a bill payment in QBO
   */
  async createBillPayment(billPaymentData: any): Promise<any> {
    return this.billService.createBillPayment(billPaymentData);
  }
  
  /**
   * Create an invoice in QBO
   */
  async createInvoice(invoiceData: any): Promise<any> {
    return this.invoiceService.createInvoice(invoiceData);
  }
  
  /**
   * Record a payment in QBO
   */
  async recordPayment(paymentData: any): Promise<any> {
    return this.invoiceService.recordPayment(paymentData);
  }
  
  /**
   * Get the vendor ID for an expense
   */
  async getVendorIdForExpense(expenseId: string): Promise<string> {
    return this.billService.getVendorIdForExpense(expenseId, this.entityReferenceService);
  }
  
  /**
   * Get the customer ID for an invoice
   */
  async getCustomerIdForInvoice(invoiceId: string): Promise<string> {
    return this.invoiceService.getCustomerIdForInvoice(invoiceId, this.entityReferenceService);
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
    return this.entityReferenceService.storeEntityReference(
      localEntityId,
      localEntityType,
      qboEntityId,
      qboEntityType
    );
  }
  
  /**
   * Get a QBO entity reference from our database
   */
  async getEntityReference(localEntityId: string, localEntityType: string): Promise<any | null> {
    return this.entityReferenceService.getEntityReference(localEntityId, localEntityType);
  }
}
