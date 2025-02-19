
import { ExpenseForm } from "./expense/ExpenseForm";
import { ExpenseList } from "./expense/ExpenseList";
import { useExpenses } from "./expense/hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "./expense/types";
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
