import { CustomerMapper } from "./CustomerMapper";
import { ProjectMapper } from "./ProjectMapper";
import { ExpenseMapper } from "./ExpenseMapper";
import { InvoiceMapper } from "./InvoiceMapper";
import { AccountMapper } from "./AccountMapper";
import { CustomerVendorMapper } from "./CustomerVendorMapper";
import { BillMapper } from "./BillMapper";

export * from "./types";
export * from "./CustomerMapper";
export * from "./ProjectMapper";
export * from "./ExpenseMapper";
export * from "./InvoiceMapper";
export * from "./AccountMapper";
export * from "./CustomerVendorMapper";
export * from "./BillMapper";

/**
 * QBOMappingService combines all the individual mappers
 * to provide a unified interface for QBO mapping operations
 */
export class QBOMappingService {
  private customerMapper: CustomerMapper;
  private projectMapper: ProjectMapper;
  private expenseMapper: ExpenseMapper;
  private invoiceMapper: InvoiceMapper;
  private accountMapper: AccountMapper;
  private customerVendorMapper: CustomerVendorMapper;
  private billMapper: BillMapper;
  
  // Method references
  public mapClientToCustomer: (client: any) => any;
  public mapVendorToVendor: (vendor: any) => any;
  public mapProjectToTagName: (project: any) => string;
  public mapExpenseToBill: (expense: any, payeeQBOId: string, glAccountId: string) => any;
  public mapExpensePaymentToBillPayment: (payment: any, vendorId: string, billId: string) => any;
  public mapInvoiceToInvoice: (invoice: any, customerQBOId: string) => any;
  public mapInvoicePaymentToPayment: (payment: any, customerQBOId: string, invoiceQBOId: string) => any;
  public mapAccountsToSelectOptions: (accounts: any[]) => any[];

  constructor() {
    // Initialize all mappers first
    this.customerMapper = new CustomerMapper();
    this.projectMapper = new ProjectMapper();
    this.expenseMapper = new ExpenseMapper();
    this.invoiceMapper = new InvoiceMapper();
    this.accountMapper = new AccountMapper();
    this.customerVendorMapper = new CustomerVendorMapper();
    this.billMapper = new BillMapper();
    
    // Then bind all methods
    this.mapClientToCustomer = this.customerVendorMapper.mapClientToCustomer.bind(this.customerVendorMapper);
    this.mapVendorToVendor = this.customerVendorMapper.mapVendorToVendor.bind(this.customerVendorMapper);
    this.mapProjectToTagName = this.projectMapper.mapProjectToTagName.bind(this.projectMapper);
    this.mapExpenseToBill = this.expenseMapper.mapExpenseToBill.bind(this.expenseMapper);
    this.mapExpensePaymentToBillPayment = this.expenseMapper.mapExpensePaymentToBillPayment.bind(this.expenseMapper);
    this.mapInvoiceToInvoice = this.invoiceMapper.mapInvoiceToInvoice.bind(this.invoiceMapper);
    this.mapInvoicePaymentToPayment = this.invoiceMapper.mapInvoicePaymentToPayment.bind(this.invoiceMapper);
    this.mapAccountsToSelectOptions = this.accountMapper.mapAccountsToSelectOptions.bind(this.accountMapper);
  }
}
