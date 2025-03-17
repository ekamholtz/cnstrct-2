
import { useState } from "react";
import { useSyncExpenseToQBO } from "@/hooks/useSyncExpenseToQBO";
import { useQBOConnection } from "@/hooks/useQBOConnection";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: string;
  name: string;
  expense_date: string;
  amount: number;
  expense_type: string;
  payee: string;
  project_id: string;
  notes?: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

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
      // Call the syncExpenseToQBO method with the expense ID
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
    isSyncing: syncExpenseMutation.isSyncing,
  };
}
