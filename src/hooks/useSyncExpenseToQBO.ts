
import { useMutation } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { toast } from "sonner";
import { makeMutationCompatible } from "@/utils/queryCompatibility";

interface SyncExpenseParams {
  expense: any;
  glAccountId: string;
}

export function useSyncExpenseToQBO() {
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const mutation = useMutation({
    mutationFn: async ({ expense, glAccountId }: SyncExpenseParams) => {
      try {
        // Check if QBO connection exists
        const connection = await qboService.getUserConnection();
        if (!connection) {
          throw new Error("No QBO connection found. Please connect in Settings.");
        }
        
        // Get the payee email - in a real implementation, we would have this data
        // For now, we'll use a placeholder or fallback
        const payeeEmail = expense.payee_email || `${expense.payee.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        
        // Step 1: Check if the expense is already synced
        const existingRef = await qboService.getEntityReference(
          expense.id,
          'expense'
        );
        
        if (existingRef) {
          toast.success("Expense is already synced with QuickBooks");
          return existingRef.qbo_entity_id;
        }
        
        // Step 2: Find or create the vendor in QBO
        let vendor = await qboService.findCustomerByEmail(payeeEmail);
        if (!vendor) {
          // Create a simple vendor record based on what we know
          const vendorData = {
            DisplayName: expense.payee,
            PrimaryEmailAddr: {
              Address: payeeEmail
            }
          };
          vendor = await qboService.createCustomer(vendorData);
        }
        
        // Step 3: Create the bill in QBO
        const billData = mappingService.mapExpenseToBill(
          expense,
          vendor.Id,
          glAccountId
        );
        
        const bill = await qboService.createBill(billData);
        
        // Step 4: Store the reference to the QBO bill
        await qboService.storeEntityReference(
          expense.id,
          'expense',
          bill.Id,
          'bill'
        );
        
        toast.success("Expense successfully synced with QuickBooks");
        return bill.Id;
      } catch (error) {
        console.error("Error syncing expense to QBO:", error);
        toast.error("Failed to sync expense with QuickBooks");
        throw error;
      }
    }
  });
  
  // Make the mutation compatible with both v3 and v4 of React Query
  return makeMutationCompatible(mutation);
}
