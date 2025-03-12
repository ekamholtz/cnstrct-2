
import { useMutation } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mappingService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/database.types";

interface SyncInvoicePaymentToQBOParams {
  invoiceId: string;
  paymentId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod?: "cc" | "check" | "transfer" | "cash";
  paymentReference?: string;
  notes?: string;
}

export function useSyncInvoicePaymentToQBO() {
  const { toast } = useToast();
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      paymentId,
      paymentAmount, 
      paymentDate,
      paymentMethod,
      paymentReference,
      notes 
    }: SyncInvoicePaymentToQBOParams) => {
      try {
        // Get QBO connection
        const connection = await qboService.getUserConnection();
        if (!connection) {
          throw new Error("No active QuickBooks Online connection found");
        }
        
        // Check if the invoice has been synced to QBO
        const invoiceRef = await qboService.getEntityReference(invoiceId, 'invoice');
        if (!invoiceRef) {
          throw new Error("Cannot sync payment: The invoice hasn't been synced to QuickBooks Online yet");
        }
        
        // Get the customer ID for this invoice
        const customerId = await qboService.getCustomerIdForInvoice(invoiceId);
        
        // Map payment method to QBO payment type
        const paymentTypeMap = {
          cc: "CreditCard",
          check: "Check",
          transfer: "EFT",
          cash: "Cash"
        };
        
        // Create a QBO payment
        const payment = {
          CustomerRef: {
            value: customerId
          },
          TotalAmt: paymentAmount,
          PaymentType: paymentMethod ? paymentTypeMap[paymentMethod] : "Check",
          TxnDate: paymentDate,
          PaymentRefNum: paymentReference,
          PrivateNote: notes || `Payment from CNSTRCT - ID: ${paymentId}`,
          Line: [
            {
              Amount: paymentAmount,
              LinkedTxn: [
                {
                  TxnId: invoiceRef.qbo_entity_id,
                  TxnType: "Invoice"
                }
              ]
            }
          ]
        };
        
        // Create the payment in QBO
        const createdPayment = await qboService.recordPayment(payment);
        
        // Store the reference to the QBO entity
        await qboService.storeEntityReference(
          paymentId,
          'payment',
          createdPayment.Id,
          'payment'
        );
        
        // Log the sync
        if (user) {
          await supabase.from('qbo_sync_logs').insert({
            user_id: user.id,
            qbo_reference_id: (await qboService.getEntityReference(paymentId, 'payment'))?.id,
            action: 'create',
            status: 'success',
            payload: payment as unknown as Json,
            response: createdPayment as unknown as Json
          });
        }
        
        // Display success toast
        toast({
          title: "Payment Synced to QuickBooks",
          description: "The payment has been successfully synced to your QuickBooks Online account.",
          variant: "default"
        });
      } catch (error) {
        console.error("Error syncing payment to QBO:", error);
        
        // Log the error
        if (user && paymentId) {
          await supabase.from('qbo_sync_logs').insert({
            user_id: user.id,
            action: 'create',
            status: 'error',
            error_message: error instanceof Error ? error.message : String(error),
            payload: { payment_id: paymentId } as unknown as Json
          });
        }
        
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync payment to QuickBooks Online",
        variant: "destructive"
      });
    }
  });
}
