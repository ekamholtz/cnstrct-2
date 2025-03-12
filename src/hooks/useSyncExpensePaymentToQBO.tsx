
import { useState } from "react";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { toast } from "sonner";

export function useSyncExpensePaymentToQBO() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const syncPaymentToQBO = async (
    payment: any,
    expenseId: string,
    billId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if QBO connection exists
      const connection = await qboService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found. Please connect in Settings.");
      }
      
      // Step 1: Check if the payment is already synced
      const existingRef = await qboService.getEntityReference(
        payment.id,
        'expense_payment'
      );
      
      if (existingRef) {
        toast.success("Payment is already synced with QuickBooks");
        setIsLoading(false);
        return existingRef.qbo_entity_id;
      }
      
      // Step 2: Get the bill ID if not provided
      let qboBillId = billId;
      if (!qboBillId) {
        const expenseRef = await qboService.getEntityReference(
          expenseId,
          'expense'
        );
        if (!expenseRef) {
          throw new Error("Expense not synced to QBO. Please sync the expense first.");
        }
        qboBillId = expenseRef.qbo_entity_id;
      }
      
      // Step 3: Get the vendor ID for the bill
      const vendorId = await qboService.getVendorIdForExpense(expenseId);
      
      // Step 4: Create the bill payment in QBO
      const billPaymentData = mappingService.mapExpensePaymentToBillPayment(
        payment,
        vendorId,
        qboBillId
      );
      
      const billPayment = await qboService.createBillPayment(billPaymentData);
      
      // Step 5: Store the reference to the QBO bill payment
      await qboService.storeEntityReference(
        payment.id,
        'expense_payment',
        billPayment.Id,
        'billpayment'
      );
      
      toast.success("Payment successfully synced with QuickBooks");
      return billPayment.Id;
    } catch (error) {
      console.error("Error syncing expense payment to QBO:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to sync payment with QuickBooks");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { syncPaymentToQBO, isLoading, error };
}
