
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
  }

  // Customer mapping methods
  mapClientToCustomer = this.customerMapper.mapClientToCustomer;

  // Project mapping methods
  mapProjectToTagName = this.projectMapper.mapProjectToTagName;

  // Expense mapping methods
  mapExpenseToBill = this.expenseMapper.mapExpenseToBill;
  mapExpensePaymentToBillPayment = this.expenseMapper.mapExpensePaymentToBillPayment;

  // Invoice mapping methods
  mapInvoiceToInvoice = this.invoiceMapper.mapInvoiceToInvoice;
  mapInvoicePaymentToPayment = this.invoiceMapper.mapInvoicePaymentToPayment;

  // Account mapping methods
  mapAccountsToSelectOptions = this.accountMapper.mapAccountsToSelectOptions;
}
