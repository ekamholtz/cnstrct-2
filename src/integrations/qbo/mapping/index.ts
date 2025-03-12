
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

  constructor() {
    this.customerMapper = new CustomerMapper();
    this.projectMapper = new ProjectMapper();
    this.expenseMapper = new ExpenseMapper();
    this.invoiceMapper = new InvoiceMapper();
    this.accountMapper = new AccountMapper();
    
    // Initialize method bindings after the mappers are created
    this.mapClientToCustomer = this.customerMapper.mapClientToCustomer.bind(this.customerMapper);
    this.mapProjectToTagName = this.projectMapper.mapProjectToTagName.bind(this.projectMapper);
    this.mapExpenseToBill = this.expenseMapper.mapExpenseToBill.bind(this.expenseMapper);
    this.mapExpensePaymentToBillPayment = this.expenseMapper.mapExpensePaymentToBillPayment.bind(this.expenseMapper);
    this.mapInvoiceToInvoice = this.invoiceMapper.mapInvoiceToInvoice.bind(this.invoiceMapper);
    this.mapInvoicePaymentToPayment = this.invoiceMapper.mapInvoicePaymentToPayment.bind(this.invoiceMapper);
    this.mapAccountsToSelectOptions = this.accountMapper.mapAccountsToSelectOptions.bind(this.accountMapper);
  }

  // Method references with appropriate bindings
  mapClientToCustomer: (client: any) => any;
  mapProjectToTagName: (project: any) => string;
  mapExpenseToBill: (expense: any, payeeQBOId: string, glAccountId: string) => any;
  mapExpensePaymentToBillPayment: (payment: any, vendorId: string, billId: string) => any;
  mapInvoiceToInvoice: (invoice: any, customerQBOId: string) => any;
  mapInvoicePaymentToPayment: (payment: any, customerQBOId: string, invoiceQBOId: string) => any;
  mapAccountsToSelectOptions: (accounts: any[]) => any[];
}
