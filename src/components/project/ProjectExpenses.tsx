
import React, { useState } from "react";
import { ExpenseForm } from "./expense/ExpenseForm";
import { ExpenseList } from "./expense/ExpenseList";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenses } from "./expense/hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import type { Expense, DatabaseExpense } from "@/components/project/expense/types";
import type { Payment } from "@/components/payments/types";

interface ProjectExpensesProps {
  projectId: string;
  expenses?: DatabaseExpense[];
}

// Fallback UI for errors
const ErrorDisplay = ({ error, resetError }: { error: Error | null, resetError: () => void }) => (
  <Alert variant="destructive" className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription>
      {error?.message || "An unexpected error occurred while loading expenses."}
    </AlertDescription>
    <div className="mt-4">
      <Button variant="outline" onClick={resetError}>
        Try Again
      </Button>
    </div>
  </Alert>
);

export function ProjectExpenses({ projectId, expenses = [] }: ProjectExpensesProps) {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use our custom hook for expenses
  const { 
    expenses: fetchedExpenses, 
    isLoading, 
    handleCreateExpense,
    error: hookError 
  } = useExpenses(projectId);
  
  // Ensure expenses is always a valid array
  const safeExpenses = React.useMemo(() => {
    try {
      return Array.isArray(expenses) ? expenses.filter(Boolean) : [];
    } catch (e) {
      console.error("Error processing expenses array:", e);
      return [];
    }
  }, [expenses]);

  // Reset error state
  const resetError = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
  };

  // Function to create an expense with optional payment
  const handleExpenseSubmit = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      await handleCreateExpense(data, status, paymentDetails);
    } catch (error) {
      console.error('Error submitting expense:', error);
      throw error;
    }
  };

  // Convert DatabaseExpense[] to Expense[] for the ExpenseList component
  const expensesForList: Expense[] = fetchedExpenses.length > 0 
    ? fetchedExpenses 
    : safeExpenses.map(expense => ({
        id: expense.id,
        project_id: expense.project_id || projectId,
        name: expense.name || '',
        payee: expense.payee || '',
        amount: typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount)) || 0,
        amount_due: expense.amount_due,
        expense_date: expense.expense_date || '',
        expense_type: expense.expense_type as "labor" | "materials" | "subcontractor" | "other" | undefined,
        payment_status: expense.payment_status as "due" | "partially_paid" | "paid" | undefined,
        expense_number: expense.expense_number,
        notes: expense.notes,
        created_at: expense.created_at,
        updated_at: expense.updated_at,
        payments: expense.payments,
        project: expense.project
      }));

  return (
    <div className="space-y-6">
      {(error || hookError) && <ErrorDisplay error={error || hookError} resetError={resetError} />}
      
      <ExpenseForm 
        onSubmit={handleExpenseSubmit}
        defaultProjectId={projectId}
      />
      
      <ExpenseList 
        expenses={expensesForList}
        loading={isLoading}
      />
    </div>
  );
}
