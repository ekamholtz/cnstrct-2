
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { useExpenses } from "./hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "./types";
import { useToast } from "@/hooks/use-toast";

interface ProjectExpensesProps {
  projectId: string;
}

export function ProjectExpenses({ projectId }: ProjectExpensesProps) {
  const { expenses, isLoading, createExpense, createPayment } = useExpenses(projectId);
  const { toast } = useToast();

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      const expense = await createExpense(data);
      
      if (paymentDetails && expense) {
        await createPayment({
          expenseId: expense.id,
          paymentData: paymentDetails
        });
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExpenseForm onSubmit={handleCreateExpense} defaultProjectId={projectId} />
      </div>
      <ExpenseList expenses={expenses ?? []} />
    </div>
  );
}
