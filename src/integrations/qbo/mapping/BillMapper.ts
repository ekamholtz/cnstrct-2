/**
 * Mapper for converting between CNSTRCT expenses and QuickBooks bills
 */
export class BillMapper {
  /**
   * Maps a CNSTRCT expense to a QuickBooks bill
   * @param expense The expense to map
   * @param vendorRef Optional vendor reference
   * @returns A QuickBooks bill object
   */
  mapExpenseToBill(expense: any, vendorRef?: any): any {
    if (!expense) return null;
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    return {
      VendorRef: vendorRef || {
        value: expense.vendor_id || expense.contractor_id,
        name: expense.vendor_name || expense.contractor_name || 'Unknown Vendor'
      },
      Line: [
        {
          DetailType: 'AccountBasedExpenseLineDetail',
          Amount: expense.amount,
          Description: expense.description || `Expense ${expense.id}`,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: expense.account_id || '1',
              name: expense.account_name || 'Expense'
            },
            BillableStatus: 'Billable',
            TaxCodeRef: {
              value: 'TAX'
            }
          }
        }
      ],
      TxnDate: expense.date || formattedDate,
      PrivateNote: `CNSTRCT Expense ID: ${expense.id}`
    };
  }

  /**
   * Maps a CNSTRCT expense payment to a QuickBooks bill payment
   * @param payment The payment to map
   * @param billRef Optional bill reference
   * @returns A QuickBooks bill payment object
   */
  mapExpensePaymentToBillPayment(payment: any, billRef?: any): any {
    if (!payment) return null;
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    return {
      VendorRef: {
        value: payment.vendor_id || payment.contractor_id,
        name: payment.vendor_name || payment.contractor_name || 'Unknown Vendor'
      },
      PayType: 'Check',
      TotalAmt: payment.amount,
      Line: [
        {
          LinkedTxn: [
            {
              TxnId: billRef?.Id || payment.bill_id,
              TxnType: 'Bill'
            }
          ],
          Amount: payment.amount
        }
      ],
      TxnDate: payment.date || formattedDate,
      PrivateNote: `CNSTRCT Payment ID: ${payment.id}`
    };
  }
}
