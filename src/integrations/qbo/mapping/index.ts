
import { CustomerMapper } from "./CustomerMapper";
import { ProjectMapper } from "./ProjectMapper";
import { ExpenseMapper } from "./ExpenseMapper";
import { InvoiceMapper } from "./InvoiceMapper";
import { AccountMapper } from "./AccountMapper";

export * from "./types";

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
  
  // Method references
  public mapClientToCustomer: (client: any) => any;
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
    
    // Then bind all methods
    this.mapClientToCustomer = this.customerMapper.mapClientToCustomer.bind(this.customerMapper);
    this.mapProjectToTagName = this.projectMapper.mapProjectToTagName.bind(this.projectMapper);
    this.mapExpenseToBill = this.expenseMapper.mapExpenseToBill.bind(this.expenseMapper);
    this.mapExpensePaymentToBillPayment = this.expenseMapper.mapExpensePaymentToBillPayment.bind(this.expenseMapper);
    this.mapInvoiceToInvoice = this.invoiceMapper.mapInvoiceToInvoice.bind(this.invoiceMapper);
    this.mapInvoicePaymentToPayment = this.invoiceMapper.mapInvoicePaymentToPayment.bind(this.invoiceMapper);
    this.mapAccountsToSelectOptions = this.accountMapper.mapAccountsToSelectOptions.bind(this.accountMapper);
  }
}
