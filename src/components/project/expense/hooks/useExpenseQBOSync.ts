
import { useState } from "react";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { useToast } from "@/components/ui/use-toast";
import { Expense } from "../types";

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
      // Create a properly typed Expense object for syncing
      await syncExpenseMutation.mutateAsync({ 
        expense,
        glAccountId 
      });
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
    isSyncing: syncExpenseMutation.isPending,
  };
}
