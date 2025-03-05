
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchExpenses } from "./useFetchExpenses";
import { useCreateExpense } from "./useCreateExpense";
import { useProcessPayment } from "./useProcessPayment";
import { validateExpenseData } from "../utils/expenseUtils";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: expenses, isLoading, error: fetchError } = useFetchExpenses(projectId);
  const { mutateAsync: createExpense, isPending: isCreating } = useCreateExpense(projectId);
  const { mutateAsync: processPayment, isPending: isProcessingPayment } = useProcessPayment(projectId);

  // Log any fetch errors
  if (fetchError) {
    console.error('Error fetching expenses in useExpenses:', fetchError);
  }

  const validateAndCreateExpense = async (data: any) => {
    console.log('Validating expense data before creation:', data);
    
    // Perform validation
    const validationError = validateExpenseData(data);
    if (validationError) {
      console.error('Expense validation failed:', validationError);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validationError,
      });
      return null;
    }
    
    try {
      // Ensure project_id is set correctly
      const expenseData = {
        ...data,
        project_id: projectId, // Always use the projectId from props
      };
      
      console.log('Creating expense after validation passed:', expenseData);
      const result = await createExpense(expenseData);
      return result;
    } catch (error) {
      console.error('Error in validateAndCreateExpense:', error);
      // Toast is handled in the createExpense mutation
      return null;
    }
  };

  return {
    expenses,
    isLoading: isLoading || isCreating || isProcessingPayment,
    createExpense: validateAndCreateExpense,
    createPayment: processPayment,
    error: fetchError,
  };
}
