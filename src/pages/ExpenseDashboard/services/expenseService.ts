
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import { generateExpenseNumber } from "../utils/expenseUtils";

interface CreateHomeownerExpenseParams {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  userId: string;
  expenseNumber: string;
}

interface CreateGCExpenseParams {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  expenseNumber: string;
}

interface CreatePaymentParams {
  expenseId: string;
  paymentDetails: PaymentDetailsData;
  expensesTable: 'expenses' | 'homeowner_expenses';
}

/**
 * Creates a homeowner expense
 */
export async function createHomeownerExpense({
  data,
  status,
  userId,
  expenseNumber
}: CreateHomeownerExpenseParams) {
  const amount = parseFloat(data.amount);
  
  const { data: homeownerExpense, error } = await supabase
    .from('homeowner_expenses')
    .insert({
      name: data.name,
      amount: amount,
      amount_due: amount,
      payee: data.payee,
      expense_date: data.expense_date,
      expense_type: data.expense_type,
      project_id: data.project_id,
      notes: data.notes,
      homeowner_id: userId,
      payment_status: status,
      expense_number: expenseNumber
    })
    .select()
    .single();

  if (error) {
    console.error('Error during homeowner expense creation:', error);
    throw error;
  }
  
  console.log('Homeowner expense created successfully:', homeownerExpense);
  return homeownerExpense;
}

/**
 * Creates a GC expense
 */
export async function createGCExpense({
  data,
  status,
  expenseNumber
}: CreateGCExpenseParams) {
  // First get project info to get gc_account_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('gc_account_id')
    .eq('id', data.project_id)
    .single();

  if (projectError) {
    console.error('Error fetching project for expense creation:', projectError);
    throw projectError;
  }

  if (!project || !project.gc_account_id) {
    throw new Error('Project not found or missing gc_account_id');
  }

  // Get the current user to use as contractor_id (temporary until schema change)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const amount = parseFloat(data.amount);
  
  const { data: gcExpense, error } = await supabase
    .from('expenses')
    .insert({
      name: data.name,
      amount: amount,
      amount_due: amount,
      payee: data.payee,
      expense_date: data.expense_date,
      expense_type: data.expense_type,
      project_id: data.project_id,
      notes: data.notes || '',
      gc_account_id: project.gc_account_id,
      payment_status: status,
      expense_number: expenseNumber,
      contractor_id: user.id // Keep contractor_id until schema update
    })
    .select()
    .single();

  if (error) {
    console.error('Error during expense creation:', error);
    throw error;
  }
  
  console.log('GC/PM expense created successfully:', gcExpense);
  return gcExpense;
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
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      expense_id: expenseId,
      payment_method_code: paymentDetails.payment_method_code,
      payment_date: paymentDetails.payment_date,
      amount: paymentAmount,
      notes: paymentDetails.notes || '',
      direction: 'outgoing',
      status: 'completed'
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
