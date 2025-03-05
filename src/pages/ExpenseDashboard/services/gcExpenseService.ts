
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data } from "@/components/project/expense/types";

interface CreateGCExpenseParams {
  data: ExpenseFormStage1Data;
  status: 'due' | 'paid' | 'partially_paid';
  expenseNumber: string;
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
      // Note: contractor_id is no longer included as it's being phased out
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
