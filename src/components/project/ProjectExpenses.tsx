
import { ExpenseForm } from "./expense/ExpenseForm";
import { ExpenseList } from "./expense/ExpenseList";
import { useExpenses } from "./expense/hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "./expense/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/profile/useUserRole";

interface ProjectExpensesProps {
  projectId: string;
  expenses: any[];
}

export function ProjectExpenses({ projectId, expenses }: ProjectExpensesProps) {
  const { createExpense, createPayment } = useExpenses(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userRole = useUserRole();

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      console.log('Creating expense:', data, status, paymentDetails);
      console.log('Project ID:', projectId);
      console.log('User role:', userRole);
      
      // Ensure project_id is set correctly
      const expenseData = {
        ...data,
        project_id: projectId, // Ensure correct project ID is used
        payment_status: status.toLowerCase() as 'due' | 'paid' | 'partially_paid'
      };
      
      // Create the expense with normalized status
      const expense = await createExpense(expenseData);
      
      if (!expense) {
        throw new Error("Failed to create expense - no expense returned");
      }
      
      console.log('Expense created:', expense);
      
      // If payment details are provided, create a payment record
      if (paymentDetails && expense) {
        console.log('Creating payment for expense:', expense.id, paymentDetails);
        const paymentResult = await createPayment({
          expenseId: expense.id,
          paymentData: paymentDetails
        });
        
        console.log('Payment creation result:', paymentResult);
        
        if (!paymentResult) {
          throw new Error("Failed to create payment");
        }
      }

      // Invalidate relevant queries to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast({
        title: "Success",
        description: "Expense created successfully" + (paymentDetails ? " with payment" : ""),
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? `Failed to create expense: ${error.message}` 
          : "Failed to create expense. Please try again.",
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
