
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { useExpenses } from "./hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectExpensesProps {
  projectId: string;
  expenses: any[];
}

export function ProjectExpenses({ projectId, expenses }: ProjectExpensesProps) {
  const { createExpense, createPayment } = useExpenses(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      // Create the expense with normalized status
      const expense = await createExpense({
        ...data,
        payment_status: status.toLowerCase() as 'due' | 'paid' | 'partially_paid'
      });
      
      // If payment details are provided, create a payment record
      if (paymentDetails && expense) {
        await createPayment({
          expenseId: expense.id,
          paymentData: paymentDetails
        });
      }

      // Invalidate relevant queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex justify-end mb-4">
        <ExpenseForm onSubmit={handleCreateExpense} defaultProjectId={projectId} />
      </div>
      <ExpenseList expenses={expenses ?? []} />
    </div>
  );
}
