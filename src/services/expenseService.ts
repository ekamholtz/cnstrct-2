
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data } from "@/components/project/expense/types";

/**
 * Creates a GC expense
 */
export async function createGCExpense({
  data,
  status,
  expenseNumber
}: {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  expenseNumber: string;
}) {
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
      expense_number: expenseNumber
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
 * Creates a homeowner expense
 */
export async function createHomeownerExpense({
  data,
  status,
  userId,
  expenseNumber
}: {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  userId: string;
  expenseNumber: string;
}) {
  const amount = parseFloat(data.amount);
  
  // First get project info to get gc_account_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('gc_account_id')
    .eq('id', data.project_id)
    .single();

  if (projectError) {
    console.error('Error fetching project for homeowner expense creation:', projectError);
    throw projectError;
  }

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
      expense_number: expenseNumber,
      gc_account_id: project.gc_account_id
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
 * Creates a payment for an expense
 */
export async function createExpensePayment({
  expenseId,
  paymentDetails,
  expensesTable
}: {
  expenseId: string;
  paymentDetails: {
    payment_method_code: string;
    payment_date: string;
    amount: number;
    notes?: string;
  };
  expensesTable: 'expenses' | 'homeowner_expenses';
}) {
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

  const paymentAmount = typeof paymentDetails.amount === 'string' 
    ? parseFloat(paymentDetails.amount) 
    : paymentDetails.amount;
  
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

/**
 * Generates a unique expense number with timestamp and random string
 */
export const generateExpenseNumber = (): string => {
  return `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
};
