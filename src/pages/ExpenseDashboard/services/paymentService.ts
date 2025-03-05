
import { supabase } from "@/integrations/supabase/client";
import { PaymentDetailsData } from "@/components/project/expense/types";

interface CreatePaymentParams {
  expenseId: string;
  paymentDetails: PaymentDetailsData;
  expensesTable: 'expenses' | 'homeowner_expenses';
}

/**
 * Creates a payment for an expense
 */
export async function createExpensePayment({
  expenseId,
  paymentDetails,
  expensesTable
}: CreatePaymentParams) {
  console.log('Creating payment for expense:', expenseId, paymentDetails);
  const paymentAmount = parseFloat(paymentDetails.amount);
  
  // Get the expense to determine the gc_account_id
  const { data: expense, error: expenseError } = await supabase
    .from(expensesTable)
    .select('gc_account_id')
    .eq('id', expenseId)
    .single();
    
  if (expenseError) {
    console.error(`Error fetching expense for payment:`, expenseError);
    throw expenseError;
  }
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      expense_id: expenseId,
      payment_method_code: paymentDetails.payment_method_code,
      payment_date: paymentDetails.payment_date,
      amount: paymentAmount,
      notes: paymentDetails.notes || '',
      direction: 'outgoing',
      status: 'completed',
      gc_account_id: expense.gc_account_id
    })
    .select();

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }
  
  console.log('Payment created successfully:', payment);
  return payment;
}

/**
 * Updates an expense's payment status and amount due
 */
export async function updateExpenseAfterPayment(
  expenseId: string,
  expenseAmount: number,
  paymentAmount: number,
  expensesTable: 'expenses' | 'homeowner_expenses'
) {
  const newAmountDue = expenseAmount - paymentAmount;
  const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;
  
  const { error: updateError } = await supabase
    .from(expensesTable)
    .update({
      payment_status: newStatus,
      amount_due: Math.max(0, newAmountDue)
    })
    .eq('id', expenseId);
    
  if (updateError) {
    console.error(`Error updating expense after payment:`, updateError);
    throw updateError;
  }
  
  return { newStatus, newAmountDue: Math.max(0, newAmountDue) };
}
