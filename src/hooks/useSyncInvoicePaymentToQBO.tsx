
import { useMutation } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { toast } from "sonner";
import { makeMutationCompatible } from "@/utils/queryCompatibility";

interface SyncInvoicePaymentParams {
  invoiceId: string;
  payment: any;
  customerId: string;
}

export function useSyncInvoicePaymentToQBO() {
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const mutation = useMutation({
    mutationFn: async ({ invoiceId, payment, customerId }: SyncInvoicePaymentParams) => {
      try {
        // Check if QBO connection exists
        const connection = await qboService.getUserConnection();
        if (!connection) {
          throw new Error("No QBO connection found. Please connect in Settings.");
        }
        
        // Step a: Check if the invoice exists in QBO
        const invoiceRef = await qboService.getEntityReference(
          invoiceId,
          'invoice'
        );
        
        if (!invoiceRef) {
          throw new Error("Invoice hasn't been synced to QuickBooks yet");
        }
        
        // Step b: Create payment in QBO
        const paymentData = mappingService.mapInvoicePaymentToPayment(
          payment,
          customerId, 
          invoiceRef.qbo_entity_id
        );
        
        const qboPayment = await qboService.createPayment(paymentData);
        
        // Step c: Store the reference to the QBO payment
        await qboService.storeEntityReference(
          payment.id,
          'payment',
          qboPayment.Id,
          'payment'
        );
        
        toast.success("Payment successfully synced with QuickBooks");
        return qboPayment.Id;
      } catch (error) {
        console.error("Error syncing payment to QBO:", error);
        toast.error("Failed to sync payment with QuickBooks");
        throw error;
      }
    }
  });
  
  // Make the mutation compatible with both v3 and v4 of React Query
  return makeMutationCompatible(mutation);
}
