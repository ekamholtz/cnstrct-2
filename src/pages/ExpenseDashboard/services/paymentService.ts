
import { supabase } from "@/integrations/supabase/client";
import { PaymentDetailsData } from "@/components/project/expense/types";

interface CreateExpensePaymentParams {
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
}: CreateExpensePaymentParams) {
  console.log('Creating payment for expense:', expenseId);
  console.log('Payment details:', paymentDetails);
  console.log('Using expenses table:', expensesTable);
  
  // First get the expense to get its gc_account_id
  const { data: expense, error: expenseError } = await supabase
    .from(expensesTable)
    .select('gc_account_id')
    .eq('id', expenseId)
    .single();

  if (expenseError) {
    console.error('Error fetching expense for payment:', expenseError);
    throw expenseError;
  }

  if (!expense || !expense.gc_account_id) {
    throw new Error('Expense not found or missing gc_account_id');
  }

  const paymentAmount = parseFloat(paymentDetails.amount);
  
  // Create the payment record
  const { data: payment, error } = await supabase
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
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
  
  console.log('Payment created successfully:', payment);
  return payment;
}

/**
 * Updates an expense after a payment is made
 */
export async function updateExpenseAfterPayment(
  expenseId: string,
  totalAmount: number,
  paymentAmount: number,
  expensesTable: 'expenses' | 'homeowner_expenses'
) {
  console.log('Updating expense after payment:', {
    expenseId,
    totalAmount,
    paymentAmount,
    expensesTable
  });
  
  const remainingAmount = totalAmount - paymentAmount;
  const newStatus = remainingAmount <= 0 ? 'paid' : (remainingAmount < totalAmount ? 'partially_paid' : 'due');
  
  const { data, error } = await supabase
    .from(expensesTable)
    .update({
      amount_due: Math.max(0, remainingAmount),
      payment_status: newStatus
    })
    .eq('id', expenseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense after payment:', error);
    throw error;
  }
  
  console.log('Expense updated successfully after payment:', data);
  return data;
}
