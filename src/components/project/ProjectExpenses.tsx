
import { ExpenseForm } from "./expense/ExpenseForm";
import { ExpenseList } from "./expense/ExpenseList";
import { useExpenses } from "./expense/hooks/useExpenses";
import type { ExpenseFormStage1Data, PaymentDetailsData } from "./expense/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/profile/useUserRole";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

interface ProjectExpensesProps {
  projectId: string;
  expenses: any[];
}

export function ProjectExpenses({ projectId, expenses }: ProjectExpensesProps) {
  const { createExpense, createPayment } = useExpenses(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userRole = useUserRole();
  const { currentUserProfile } = useCurrentUserProfile();

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      console.log('Creating expense from ProjectExpenses component:');
      console.log('- Data:', data);
      console.log('- Status:', status);
      console.log('- Payment details:', paymentDetails);
      console.log('- Project ID:', projectId);
      console.log('- User role:', userRole);
      console.log('- Current user profile:', currentUserProfile);
      
      // Make sure project_id is set correctly in the data
      const expenseData = {
        ...data,
        project_id: projectId, // Explicitly set the project ID from props
      };
      
      console.log('Final expense data being sent to createExpense:', expenseData);
      
      // Create the expense
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
