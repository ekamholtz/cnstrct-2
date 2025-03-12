
import { BaseQBOService } from "./services/BaseQBOService";
import { AccountService } from "./services/AccountService";
import { CustomerVendorService } from "./services/CustomerVendorService";
import { BillService } from "./services/BillService";
import { InvoiceService } from "./services/InvoiceService";
import { EntityReferenceService } from "./services/EntityReferenceService";

/**
 * QBOService coordinates all QuickBooks Online API interactions
 * by utilizing specialized service classes for different entity types
 */
export class QBOService extends BaseQBOService {
  private accountService: AccountService;
  private customerVendorService: CustomerVendorService;
  private billService: BillService;
  private invoiceService: InvoiceService;
  private entityRefService: EntityReferenceService;
  
  constructor() {
    super();
    this.accountService = new AccountService(this);
    this.customerVendorService = new CustomerVendorService(this);
    this.billService = new BillService(this);
    this.invoiceService = new InvoiceService(this);
    this.entityRefService = new EntityReferenceService(this);
  }

  // Account related methods
  async getAccounts(accountType: string) {
    return this.accountService.getAccounts(accountType);
  }

  // Entity reference methods
  async getEntityReference(entityType: string, localId: string) {
    return this.entityRefService.getEntityReference(entityType, localId);
  }

  async storeEntityReference(entityType: string, localId: string, qboId: string) {
    return this.entityRefService.storeEntityReference(entityType, localId, qboId);
  }

  // Vendor/Customer methods
  async getVendorIdForExpense(vendorName: string) {
    return this.customerVendorService.getVendorIdForExpense(vendorName);
  }

  async findCustomerByEmail(email: string) {
    return this.customerVendorService.findCustomerByEmail(email);
  }

  async createCustomer(customerData: any) {
    return this.customerVendorService.createCustomer(customerData);
  }

  // Bill methods
  async createBill(billData: any) {
    return this.billService.createBill(billData);
  }

  async createBillPayment(billPaymentData: any) {
    return this.billService.createBillPayment(billPaymentData);
  }

  // Invoice methods
  async createInvoice(invoiceData: any) {
    return this.invoiceService.createInvoice(invoiceData);
  }

  async recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }) {
    return this.invoiceService.recordPayment(paymentData);
  }
}
