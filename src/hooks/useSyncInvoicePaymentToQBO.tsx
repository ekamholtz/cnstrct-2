
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { QBOService } from "@/integrations/qbo/qboService";

interface InvoicePaymentData {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

interface Invoice {
  id: string;
  qbo_entity_id?: string;
}

export const useSyncInvoicePaymentToQBO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const qboService = new QBOService();
  
  return useMutation({
    mutationFn: async ({ 
      payment, 
      invoice 
    }: { 
      payment: InvoicePaymentData; 
      invoice: Invoice 
    }) => {
      try {
        // Check if payment has already been synced
        if (payment.qbo_sync_status === 'synced' && payment.qbo_entity_id) {
          toast({
            title: "Already Synced",
            description: "This payment has already been synced to QuickBooks Online.",
            variant: "default"
          });
          return payment;
        }
        
        // Check if the invoice has been synced
        if (!invoice.qbo_entity_id) {
          throw new Error("Cannot sync payment: Invoice has not been synced to QuickBooks yet");
        }
        
        // Record payment in QBO
        const response = await qboService.recordPayment({
          invoiceId: invoice.qbo_entity_id,
          amount: payment.amount,
          date: new Date(payment.payment_date),
          paymentMethod: payment.payment_method,
        });
        
        if (!response.success) {
          throw new Error(response.error || "Failed to record payment in QuickBooks");
        }
        
        const qboPaymentId = response.data.Id;
        
        // Store the reference in our database
        await qboService.storeEntityReference('invoice_payment', payment.id, qboPaymentId);
        
        // Update local state
        const updatedPayment = {
          ...payment,
          qbo_sync_status: 'synced',
          qbo_entity_id: qboPaymentId
        };
        
        toast({
          title: "Payment Synced",
          description: "Successfully synced payment to QuickBooks Online.",
          variant: "default"
        });
        
        return updatedPayment;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error syncing payment to QBO:", errorMessage);
        
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
      queryClient.invalidateQueries({ queryKey: ['invoicePayments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};
