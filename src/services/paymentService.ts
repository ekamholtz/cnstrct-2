
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a payment for an expense in the database
 */
export const createPayment = async (paymentData: {
  expense_id: string;
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
  direction: 'outgoing';
  status: 'completed';
}) => {
  console.log('Creating payment with data:', paymentData);
  
  if (!paymentData.expense_id) {
    throw new Error('Missing expense_id in payment data');
  }
  
  // Validate the expense exists before creating payment
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .select('id, amount, gc_account_id')
    .eq('id', paymentData.expense_id)
    .single();
    
  if (expenseError) {
    console.error('Error validating expense before payment:', expenseError);
    throw new Error(`Cannot create payment: ${expenseError.message}`);
  }
  
  if (!expense) {
    throw new Error(`Cannot create payment: Expense with ID ${paymentData.expense_id} not found`);
  }
  
  // Add gc_account_id to payment data
  const fullPaymentData = {
    ...paymentData,
    gc_account_id: expense.gc_account_id
  };
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert(fullPaymentData)
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }
  
  console.log('Payment created successfully:', payment);
  return payment;
};
