import { useCallback } from 'react';

/**
 * Hook to provide mapping functions for converting CNSTRCT entities to QuickBooks Online entities
 */
export const useQBOMapper = () => {
  /**
   * Map an expense to a QBO bill
   */
  const mapExpenseToBill = useCallback((
    expense: any,
    vendorQBOId: string,
    expenseAccountId: string
  ) => {
    // Format the expense date for QBO
    const expenseDate = new Date(expense.expense_date);
    const formattedDate = expenseDate.toISOString().split('T')[0];
    
    // Create the bill data structure for QBO
    return {
      VendorRef: {
        value: vendorQBOId
      },
      Line: [
        {
          DetailType: 'AccountBasedExpenseLineDetail',
          Amount: expense.amount,
          Description: expense.name || `Expense: ${expense.expense_type || 'General'}`,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: expenseAccountId
            },
            BillableStatus: 'Billable',
            CustomerRef: expense.projects?.clients?.id ? {
              value: expense.projects.clients.id
            } : undefined
          }
        }
      ],
      TxnDate: formattedDate,
      PrivateNote: expense.notes || '',
      DocNumber: `EXP-${expense.id.substring(0, 8)}`
    };
  }, []);

  /**
   * Map an invoice payment to a QBO payment
   */
  const mapInvoicePaymentToQBOPayment = useCallback((
    payment: any,
    invoiceQBOId: string,
    customerQBOId: string
  ) => {
    // Format the payment date for QBO
    const paymentDate = new Date(payment.payment_date);
    const formattedDate = paymentDate.toISOString().split('T')[0];
    
    // Create the payment data structure for QBO
    return {
      CustomerRef: {
        value: customerQBOId
      },
      TotalAmt: payment.amount,
      TxnDate: formattedDate,
      PaymentMethodRef: {
        value: mapPaymentMethodToQBO(payment.payment_method_code)
      },
      Line: [
        {
          Amount: payment.amount,
          LinkedTxn: [
            {
              TxnId: invoiceQBOId,
              TxnType: 'Invoice'
            }
          ]
        }
      ]
    };
  }, []);

  /**
   * Map an expense payment to a QBO bill payment
   */
  const mapExpensePaymentToQBOPayment = useCallback((
    payment: any,
    billQBOId: string,
    vendorQBOId: string
  ) => {
    // Format the payment date for QBO
    const paymentDate = new Date(payment.payment_date);
    const formattedDate = paymentDate.toISOString().split('T')[0];
    
    // Create the bill payment data structure for QBO
    return {
      VendorRef: {
        value: vendorQBOId
      },
      TotalAmt: payment.amount,
      TxnDate: formattedDate,
      PaymentMethodRef: {
        value: mapPaymentMethodToQBO(payment.payment_method_code)
      },
      Line: [
        {
          Amount: payment.amount,
          LinkedTxn: [
            {
              TxnId: billQBOId,
              TxnType: 'Bill'
            }
          ]
        }
      ]
    };
  }, []);

  /**
   * Map a payment method code to a QBO payment method ID
   */
  const mapPaymentMethodToQBO = (paymentMethodCode: string): string => {
    // This mapping should be configured based on your QBO setup
    const paymentMethodMap: Record<string, string> = {
      'credit_card': '1', // Credit Card
      'bank_transfer': '2', // Bank Transfer
      'check': '3', // Check
      'cash': '4', // Cash
      'other': '5'  // Other
    };
    
    return paymentMethodMap[paymentMethodCode] || '5'; // Default to 'Other'
  };

  return {
    mapExpenseToBill,
    mapInvoicePaymentToQBOPayment,
    mapExpensePaymentToQBOPayment
  };
};
