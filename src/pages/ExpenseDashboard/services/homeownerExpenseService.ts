
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data } from "@/components/project/expense/types";

interface CreateHomeownerExpenseParams {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  userId: string;
  expenseNumber: string;
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
