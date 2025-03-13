
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQBOService } from "@/integrations/qbo/hooks/useQBOService";
import { useToast } from "@/components/ui/use-toast";
import { useQBOMapper } from "@/integrations/qbo/hooks/useQBOMapper";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseData {
  id: string;
  name: string;
  expense_date: string;
  amount: number;
  expense_type: string;
  vendor_name: string;
  project_id: string;
  notes?: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

export const useSyncExpenseToQBO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const qboService = useQBOService();
  const mapper = useQBOMapper();
  
  const syncMutation = useMutation({
    mutationFn: async (expense: ExpenseData) => {
      try {
        // Check if expense has already been synced
        if (expense.qbo_sync_status === 'synced' && expense.qbo_entity_id) {
          toast({
            title: "Already Synced",
            description: "This expense has already been synced to QuickBooks Online.",
            variant: "default"
          });
          return expense;
        }
        
        // Step 1: Find or create vendor
        const vendorId = await qboService.getVendorIdForExpense(expense.vendor_name);
        
        // Step 2: Get QBO entity reference for project
        const projectQBOId = await qboService.getEntityReference('project', expense.project_id);
        
        // Step 3: Create bill in QBO
        const billData = mapper.mapExpenseToBill(
          expense,
          vendorId,
          "63" // Example account ID - should be dynamic in production
        );
        
        const billResponse = await qboService.createBill(billData);
        
        if (!billResponse.success) {
          throw new Error(billResponse.error || "Failed to create bill in QuickBooks");
        }
        
        const billId = billResponse.data.Id;
        
        // Step 4: Store the reference in our database
        await qboService.storeEntityReference('expense', expense.id, billId);
        
        // Update local state
        const updatedExpense = {
          ...expense,
          qbo_sync_status: 'synced',
          qbo_entity_id: billId
        };
        
        toast({
          title: "Expense Synced",
          description: "Successfully synced expense to QuickBooks Online.",
          variant: "default"
        });
        
        return updatedExpense;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error syncing expense to QBO:", errorMessage);
        
        toast({
          title: "Sync Failed",
          description: `Error syncing to QuickBooks: ${errorMessage}`,
          variant: "destructive"
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
  
  return {
    ...syncMutation,
    syncExpenseToQBO: syncMutation.mutateAsync,
    isLoading: syncMutation.isPending,
  };
};
