
import type { Expense, Payment } from "@/components/project/expense/types";
import { QBOBill, QBOBillPayment } from "./types";

export class ExpenseMapper {
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
}
