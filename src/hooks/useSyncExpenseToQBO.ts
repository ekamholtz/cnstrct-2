import { useMutation } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mappingService";
import { Expense } from "@/components/project/expense/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Json } from "@/integrations/supabase/database.types";
import { useAuth } from "@/hooks/useAuth";

interface SyncExpenseToQBOParams {
  expense: Expense;
  glAccountId: string;
}

export function useSyncExpenseToQBO() {
  const { toast } = useToast();
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  const { user } = useAuth();
  
  return useMutation<void, Error, SyncExpenseToQBOParams>({
    mutationFn: async ({ expense, glAccountId }) => {
      try {
        // Get QBO connection
        const connection = await qboService.getUserConnection();
        if (!connection) {
          throw new Error("No active QuickBooks Online connection found");
        }
        
        // Check if the expense is already synced to QBO
        const existingRef = await qboService.getEntityReference(expense.id, 'expense');
        if (existingRef) {
          throw new Error("This expense is already synced to QuickBooks Online");
        }
        
        // Find or create the vendor in QBO
        let vendorId: string;
        
        // For simplicity, we'll use the vendor name as the email - in a real app
        // you'd want to look up the actual contractor/vendor record
        const vendorEmail = expense.payee || 'unknown@example.com';
        
        const existingVendor = await qboService.findCustomerByEmail(vendorEmail);
        if (existingVendor) {
          vendorId = existingVendor.Id;
        } else {
          // Create new vendor
          const newVendor = {
            DisplayName: expense.payee || 'Unknown Vendor',
            PrimaryEmailAddr: {
              Address: vendorEmail
            }
          };
          
          const createdVendor = await qboService.createCustomer(newVendor);
          vendorId = createdVendor.Id;
        }
        
        // Map the expense to a QBO bill
        const bill = mappingService.mapExpenseToBill(expense, vendorId, glAccountId);
        
        // Create the bill in QBO
        const createdBill = await qboService.createBill(bill);
        
        // Store the reference to the QBO entity
        await qboService.storeEntityReference(
          expense.id,
          'expense',
          createdBill.Id,
          'bill'
        );
        
        // Log the sync
        if (user) {
          await supabase.from('qbo_sync_logs').insert({
            user_id: user.id,
            qbo_reference_id: (await qboService.getEntityReference(expense.id, 'expense'))?.id,
            action: 'create',
            status: 'success',
            payload: bill as unknown as Json,
            response: createdBill as unknown as Json
          });
        }
        
        // Display success toast
        toast({
          title: "Expense Synced to QuickBooks",
          description: "The expense has been successfully synced to your QuickBooks Online account.",
          variant: "default"
        });
      } catch (error) {
        console.error("Error syncing expense to QBO:", error);
        
        // Log the error
        if (expense?.id && user) {
          await supabase.from('qbo_sync_logs').insert({
            user_id: user.id,
            action: 'create',
            status: 'error',
            error_message: error instanceof Error ? error.message : String(error),
            payload: { expense_id: expense.id, gl_account_id: glAccountId } as unknown as Json
          });
        }
        
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync expense to QuickBooks Online",
        variant: "destructive"
      });
    }
  });
}
