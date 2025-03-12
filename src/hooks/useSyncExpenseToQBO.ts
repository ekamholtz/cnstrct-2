
import { useState } from "react";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { toast } from "sonner";

export function useSyncExpenseToQBO() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const syncExpenseToQBO = async (
    expense: any,
    payeeEmail: string,
    glAccountId: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if QBO connection exists
      const connection = await qboService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found. Please connect in Settings.");
      }
      
      // Step 1: Check if the expense is already synced
      const existingRef = await qboService.getEntityReference(
        expense.id,
        'expense'
      );
      
      if (existingRef) {
        toast.success("Expense is already synced with QuickBooks");
        setIsLoading(false);
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
      setError(error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to sync expense with QuickBooks");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { syncExpenseToQBO, isLoading, error };
}
