
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
  const { mutateAsync: processPayment, isPending: isProcessingPayment } = useProcessPayment();

  // Log any fetch errors
  if (fetchError) {
    console.error('Error fetching expenses in useExpenses:', fetchError);
  }

  const validateAndCreateExpense = async (data: any) => {
    console.log('Validating expense data before creation:', data);
    
    // Ensure projectId is set
    if (!projectId && !data.project_id) {
      const error = "Missing project ID. Cannot create expense without a project ID.";
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
      return null;
    }
    
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
        project_id: data.project_id || projectId, // Use data.project_id if provided, otherwise use projectId from props
      };
      
      console.log('Creating expense after validation passed:', expenseData);
      const result = await createExpense(expenseData);
      
      if (result) {
        console.log('Expense created successfully:', result);
        // Invalidate queries to ensure UI is updated
        queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
        return result;
      } else {
        console.error('Expense creation returned null result');
        return null;
      }
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
