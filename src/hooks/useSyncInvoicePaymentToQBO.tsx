
import { useState } from "react";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";
import { toast } from "sonner";

export function useSyncInvoicePaymentToQBO() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const syncPaymentToQBO = async (
    payment: any,
    invoiceId: string,
    qboInvoiceId?: string,
    paymentMethod?: string
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
        'invoice_payment'
      );
      
      if (existingRef) {
        toast.success("Payment is already synced with QuickBooks");
        setIsLoading(false);
        return existingRef.qbo_entity_id;
      }
      
      // Step 2: Get the invoice ID if not provided
      let qboInvoiceIdToUse = qboInvoiceId;
      if (!qboInvoiceIdToUse) {
        const invoiceRef = await qboService.getEntityReference(
          invoiceId,
          'invoice'
        );
        if (!invoiceRef) {
          throw new Error("Invoice not synced to QBO. Please sync the invoice first.");
        }
        qboInvoiceIdToUse = invoiceRef.qbo_entity_id;
      }
      
      // Step 3: Get the customer ID for the invoice
      const customerId = await qboService.getCustomerIdForInvoice(invoiceId);
      
      // Step 4: Create the payment in QBO
      const paymentData = mappingService.mapInvoicePaymentToPayment(
        payment,
        customerId,
        qboInvoiceIdToUse,
        paymentMethod
      );
      
      const qboPayment = await qboService.recordPayment(paymentData);
      
      // Step 5: Store the reference to the QBO payment
      await qboService.storeEntityReference(
        payment.id,
        'invoice_payment',
        qboPayment.Id,
        'payment'
      );
      
      toast.success("Payment successfully synced with QuickBooks");
      return qboPayment.Id;
    } catch (error) {
      console.error("Error syncing invoice payment to QBO:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to sync payment with QuickBooks");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { syncPaymentToQBO, isLoading, error };
}
