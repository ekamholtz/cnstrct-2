
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchExpenses } from "./useFetchExpenses";
import { useCreateExpense } from "./useCreateExpense";
import { useProcessPayment } from "./useProcessPayment";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: expenses, isLoading } = useFetchExpenses(projectId);
  const { mutateAsync: createExpense } = useCreateExpense(projectId);
  const { mutateAsync: processPayment } = useProcessPayment(projectId);

  return {
    expenses,
    isLoading,
    createExpense,
    createPayment: processPayment,
  };
}
