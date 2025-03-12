
import type { Client } from "@/types/client-types";
import type { ClientProject } from "@/types/project-types";
import type { Expense, Payment } from "@/components/project/expense/types";
import type { Invoice } from "@/types/invoice-types";

export interface QBOCustomer {
  Id?: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Notes?: string;
}

export interface QBOVendor {
  Id?: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Notes?: string;
}

export interface QBOBill {
  VendorRef: {
    value: string;
  };
  Line: Array<{
    DetailType: string;
    Amount: number;
    AccountBasedExpenseLineDetail?: {
      AccountRef: {
        value: string;
      };
      Description?: string;
      TaxCodeRef?: {
        value: string;
      };
    }
  }>;
  TxnDate: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
}

export interface QBOBillPayment {
  VendorRef: {
    value: string;
  };
  TotalAmt: number;
  PayType?: string;
  TxnDate: string;
  DocNumber?: string;
  PrivateNote?: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOInvoice {
  CustomerRef: {
    value: string;
  };
  Line: Array<{
    DetailType: string;
    Amount: number;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
      };
      TaxCodeRef?: {
        value: string;
      };
    };
    Description?: string;
  }>;
  TxnDate: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
}

export interface QBOPayment {
  CustomerRef: {
    value: string;
  };
  TotalAmt: number;
  TxnDate: string;
  PaymentRefNum?: string;
  PrivateNote?: string;
  PaymentType?: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
  AcctNum?: string;
}

export class QBOMappingService {
  /**
   * Map a client from our platform to a QBO customer
   */
  mapClientToCustomer(client: Client): QBOCustomer {
    // Create a display name for the customer
    const displayName = client.company_name || 
      (client.first_name && client.last_name 
        ? `${client.first_name} ${client.last_name}`
        : client.email);

    // Basic customer data mapping
    const customer: QBOCustomer = {
      DisplayName: displayName
    };

    // Add email if available
    if (client.email) {
      customer.PrimaryEmailAddr = {
        Address: client.email
      };
    }

    // Add address if available
    if (client.address) {
      customer.BillAddr = {
        Line1: client.address.line1,
        Line2: client.address.line2,
        City: client.address.city,
        CountrySubDivisionCode: client.address.state,
        PostalCode: client.address.postal_code,
        Country: client.address.country
      };
    }

    // Add any notes
    if (client.notes) {
      customer.Notes = client.notes;
    }

    return customer;
  }

  /**
   * Map a project to a QBO tag/class name
   */
  mapProjectToTagName(project: ClientProject): string {
    // In QBO, tags/classes need to be unique and descriptive
    // Format: ProjectName_ProjectID
    return `${project.name}_${project.id.slice(0, 6)}`;
  }

  /**
   * Map an expense to a QBO bill
   */
  mapExpenseToBill(expense: Expense, payeeQBOId: string, glAccountId: string): QBOBill {
    // Ensure amount is a number
    const amount = typeof expense.amount === 'number' 
      ? expense.amount 
      : parseFloat(String(expense.amount));

    // Format date as YYYY-MM-DD
    const txnDate = expense.expense_date || new Date().toISOString().split('T')[0];

    // Create the bill
    const bill: QBOBill = {
      VendorRef: {
        value: payeeQBOId
      },
      Line: [
        {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: amount,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: glAccountId
            },
            Description: expense.name
          }
        }
      ],
      TxnDate: txnDate,
      PrivateNote: expense.notes || `Expense from CNSTRCT - ID: ${expense.id}`
    };

    // Add doc number if available
    if (expense.expense_number) {
      bill.DocNumber = expense.expense_number;
    }

    return bill;
  }

  /**
   * Map a payment to a QBO bill payment
   */
  mapExpensePaymentToBillPayment(
    payment: Payment, 
    vendorId: string, 
    billId: string
  ): QBOBillPayment {
    // Ensure amount is a number
    const amount = typeof payment.amount === 'number' 
      ? payment.amount 
      : parseFloat(String(payment.amount));

    // Format payment date as YYYY-MM-DD
    const txnDate = payment.payment_date || new Date().toISOString().split('T')[0];

    // Create the bill payment
    const billPayment: QBOBillPayment = {
      VendorRef: {
        value: vendorId
      },
      TotalAmt: amount,
      TxnDate: txnDate,
      PayType: "Check", // Default to Check, can be customized
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: billId,
              TxnType: "Bill"
            }
          ]
        }
      ],
      PrivateNote: payment.notes || `Payment from CNSTRCT - ID: ${payment.id}`
    };

    // Add payment reference number if available
    if (payment.payment_reference) {
      billPayment.DocNumber = payment.payment_reference;
    }

    return billPayment;
  }

  /**
   * Map an invoice to a QBO invoice
   */
  mapInvoiceToInvoice(invoice: Invoice, customerQBOId: string, incomeAccountId: string): QBOInvoice {
    // Ensure amount is a number
    const amount = typeof invoice.amount === 'number' 
      ? invoice.amount 
      : parseFloat(String(invoice.amount));

    // Format date as YYYY-MM-DD
    const txnDate = invoice.invoice_date || new Date().toISOString().split('T')[0];
    const dueDate = invoice.due_date || '';

    // Create the invoice
    const qboInvoice: QBOInvoice = {
      CustomerRef: {
        value: customerQBOId
      },
      Line: [
        {
          DetailType: "SalesItemLineDetail",
          Amount: amount,
          Description: invoice.description || `Invoice ${invoice.invoice_number}`,
          SalesItemLineDetail: {
            ItemRef: {
              value: incomeAccountId
            }
          }
        }
      ],
      TxnDate: txnDate,
      PrivateNote: invoice.notes || `Invoice from CNSTRCT - ID: ${invoice.id}`
    };

    // Add additional fields if available
    if (dueDate) {
      qboInvoice.DueDate = dueDate;
    }

    if (invoice.invoice_number) {
      qboInvoice.DocNumber = invoice.invoice_number;
    }

    return qboInvoice;
  }

  /**
   * Map a payment to a QBO payment
   */
  mapInvoicePaymentToPayment(
    payment: any, 
    customerQBOId: string, 
    invoiceQBOId: string, 
    paymentMethod?: string
  ): QBOPayment {
    // Ensure amount is a number
    const amount = typeof payment.amount === 'number' 
      ? payment.amount 
      : parseFloat(String(payment.amount));

    // Format payment date as YYYY-MM-DD
    const txnDate = payment.payment_date || new Date().toISOString().split('T')[0];

    // Map payment method to QBO payment type
    const paymentTypeMap: Record<string, string> = {
      cc: "CreditCard",
      check: "Check",
      transfer: "EFT",
      cash: "Cash"
    };

    // Create the payment
    const qboPayment: QBOPayment = {
      CustomerRef: {
        value: customerQBOId
      },
      TotalAmt: amount,
      TxnDate: txnDate,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: invoiceQBOId,
              TxnType: "Invoice"
            }
          ]
        }
      ],
      PrivateNote: payment.notes || `Payment from CNSTRCT - ID: ${payment.id}`
    };

    // Add payment reference number if available
    if (payment.payment_reference) {
      qboPayment.PaymentRefNum = payment.payment_reference;
    }

    // Add payment type if available
    if (paymentMethod && paymentTypeMap[paymentMethod]) {
      qboPayment.PaymentType = paymentTypeMap[paymentMethod];
    }

    return qboPayment;
  }

  /**
   * Map QBO accounts to a select-friendly format
   */
  mapAccountsToSelectOptions(accounts: QBOAccount[]) {
    return accounts.map(account => ({
      label: account.AcctNum 
        ? `${account.Name} (${account.AcctNum})` 
        : account.Name,
      value: account.Id,
      type: account.AccountType,
      subType: account.AccountSubType
    }));
  }
}
