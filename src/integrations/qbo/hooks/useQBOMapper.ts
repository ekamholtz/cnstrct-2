
import { useCallback } from 'react';

// Define QBO entity types
export interface QBOCustomer {
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
}

export interface QBOVendor {
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
}

export interface QBOPayment {
  CustomerRef: { value: string };
  TotalAmt: number;
  TxnDate: string;
  PaymentMethodRef?: { value: string };
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOBillPayment {
  VendorRef: { value: string };
  TotalAmt: number;
  TxnDate: string;
  PaymentType: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
}

export interface QBOInvoice {
  CustomerRef: { value: string };
  Line: Array<{
    DetailType: string;
    Amount: number;
    Description?: string;
    SalesItemLineDetail?: {
      ItemRef: { value: string };
    };
  }>;
  TxnDate: string;
  DueDate?: string;
}

/**
 * Hook that provides mappers for converting app entities to QBO entities
 */
export const useQBOMapper = () => {
  /**
   * Map a client to a QBO customer
   */
  const mapClientToCustomer = useCallback((client: {
    name: string;
    email?: string;
    address?: string;
  }): QBOCustomer => {
    const customer: QBOCustomer = {
      DisplayName: client.name,
      CompanyName: client.name,
    };

    if (client.email) {
      customer.PrimaryEmailAddr = { Address: client.email };
    }

    if (client.address) {
      customer.BillAddr = {
        Line1: client.address
      };
    }

    return customer;
  }, []);
  
  /**
   * Map a vendor to a QBO vendor
   */
  const mapVendorToQBOVendor = useCallback((vendor: {
    name: string;
    email?: string;
    address?: string;
  }): QBOVendor => {
    const qboVendor: QBOVendor = {
      DisplayName: vendor.name,
      CompanyName: vendor.name,
    };

    if (vendor.email) {
      qboVendor.PrimaryEmailAddr = { Address: vendor.email };
    }

    return qboVendor;
  }, []);
  
  /**
   * Map an invoice payment to a QBO payment
   */
  const mapInvoicePaymentToPayment = useCallback(({
    invoiceId,
    amount,
    date,
    paymentMethod
  }: {
    invoiceId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }): QBOPayment => {
    return {
      CustomerRef: { value: "1" }, // This should be dynamically set
      TotalAmt: amount,
      TxnDate: date.toISOString().split('T')[0],
      PaymentMethodRef: { value: mapPaymentMethod(paymentMethod) },
      Line: [
        {
          Amount: amount,
          LinkedTxn: [
            {
              TxnId: invoiceId,
              TxnType: "Invoice"
            }
          ]
        }
      ]
    };
  }, []);
  
  /**
   * Map an expense payment to a QBO bill payment
   */
  const mapExpensePaymentToBillPayment = useCallback(({
    billId,
    amount,
    date,
    paymentMethod
  }: {
    billId: string;
    amount: number;
    date: Date;
    paymentMethod: string;
  }): QBOBillPayment => {
    return {
      VendorRef: { value: "1" }, // This should be dynamically set
      TotalAmt: amount,
      TxnDate: date.toISOString().split('T')[0],
      PaymentType: mapPaymentTypeForBill(paymentMethod),
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
      ]
    };
  }, []);

  /**
   * Map an invoice to a QBO invoice
   */
  const mapInvoiceToInvoice = useCallback((
    invoice: any,
    customerId: string,
    incomeAccountId: string
  ): QBOInvoice => {
    return {
      CustomerRef: { value: customerId },
      Line: invoice.line_items?.map((item: any) => ({
        DetailType: "SalesItemLineDetail",
        Amount: item.amount,
        Description: item.description,
        SalesItemLineDetail: {
          ItemRef: { value: incomeAccountId }
        }
      })) || [
        {
          DetailType: "SalesItemLineDetail",
          Amount: invoice.amount || 0,
          Description: invoice.name || "Invoice",
          SalesItemLineDetail: {
            ItemRef: { value: incomeAccountId }
          }
        }
      ],
      TxnDate: new Date(invoice.issue_date || new Date()).toISOString().split('T')[0],
      DueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : undefined
    };
  }, []);
  
  /**
   * Map an expense to a QBO bill
   */
  const mapExpenseToBill = useCallback((
    expense: any,
    vendorId: string,
    expenseAccountId: string
  ) => {
    return {
      VendorRef: {
        value: vendorId
      },
      Line: [
        {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: expense.amount,
          Description: expense.name,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: expenseAccountId
            },
            ...(expense.projects?.id ? { 
              ProjectRef: { value: expense.projects.id }
            } : {})
          }
        }
      ],
      TxnDate: expense.expense_date
    };
  }, []);
  
  /**
   * Map a payment method to a QBO payment method reference
   */
  const mapPaymentMethod = (methodCode: string): string => {
    // These should be mapped to actual QBO payment method IDs
    switch (methodCode) {
      case 'cc': return '1'; // Credit Card
      case 'check': return '2'; // Check
      case 'cash': return '3'; // Cash
      case 'transfer': return '4'; // Bank Transfer
      default: return '1'; // Default to Credit Card
    }
  };
  
  /**
   * Map a payment type for a bill payment
   */
  const mapPaymentTypeForBill = (methodCode: string): string => {
    switch (methodCode) {
      case 'cc': return 'CreditCard';
      case 'check': return 'Check';
      case 'transfer': return 'EFT';
      default: return 'Check'; // Default to Check
    }
  };
  
  return {
    mapClientToCustomer,
    mapVendorToQBOVendor,
    mapInvoicePaymentToPayment,
    mapExpensePaymentToBillPayment,
    mapInvoiceToInvoice,
    mapExpenseToBill
  };
};
