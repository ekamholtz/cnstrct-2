
import { useState } from "react";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { useToast } from "@/components/ui/use-toast";
import { Expense } from "@/components/project/expense/types";

export function useExpenseQBOSync() {
  const [glAccountId, setGlAccountId] = useState<string>("");
  const { connection } = useQBOConnection();
  const syncExpenseMutation = useSyncExpenseToQBO();
  const { toast } = useToast();
  
  const syncExpenseToQBO = async (expense: Expense) => {
    if (!connection || !glAccountId) {
      return;
    }
    
    try {
      // Ensure expense has the required fields
      if (!expense.id || !expense.expense_type) {
        console.error("Cannot sync expense: missing required fields", expense);
        return;
      }
      
      // Call the syncExpenseToQBO method with the expense ID directly
      await syncExpenseMutation.syncExpenseToQBO(expense.id);
    } catch (qboError) {
      console.error("Error syncing to QBO:", qboError);
      toast({
        title: "QBO Sync Failed",
        description: qboError instanceof Error ? qboError.message : "Failed to sync expense to QuickBooks Online",
        variant: "destructive"
      });
      // Even though QBO sync failed, we don't throw as the expense was created successfully
    }
  };
  
  return {
    connection,
    glAccountId,
    setGlAccountId,
    syncExpenseToQBO,
    isSyncing: syncExpenseMutation.isLoading || false,
  };
}
