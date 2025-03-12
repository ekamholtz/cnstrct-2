
import { useMutation } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mappingService";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/database.types";

interface SyncExpensePaymentToQBOParams {
  expenseId: string;
  paymentId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentReference?: string;
  notes?: string;
}

export function useSyncExpensePaymentToQBO() {
  const { toast } = useToast();
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      expenseId, 
      paymentId,
      paymentAmount, 
      paymentDate,
      paymentReference,
      notes 
    }: SyncExpensePaymentToQBOParams) => {
      try {
        // Get QBO connection
        const connection = await qboService.getUserConnection();
        if (!connection) {
          throw new Error("No active QuickBooks Online connection found");
        }
        
        // Check if the expense has been synced to QBO as a bill
        const expenseRef = await qboService.getEntityReference(expenseId, 'expense');
        if (!expenseRef) {
          throw new Error("Cannot sync payment: The expense hasn't been synced to QuickBooks Online yet");
        }
        
        // Create a QBO bill payment
        const billPayment = {
          VendorRef: {
            value: await qboService.getVendorIdForExpense(expenseId)
          },
          TotalAmt: paymentAmount,
          PayType: "Check", // Default payment type
          TxnDate: paymentDate,
          DocNumber: paymentReference,
          PrivateNote: notes || `Payment from CNSTRCT - ID: ${paymentId}`,
          Line: [
            {
              Amount: paymentAmount,
              LinkedTxn: [
                {
                  TxnId: expenseRef.qbo_entity_id,
                  TxnType: "Bill"
                }
              ]
            }
          ]
        };
        
        // Create the bill payment in QBO
        const createdPayment = await qboService.createBillPayment(billPayment);
        
        // Store the reference to the QBO entity
        await qboService.storeEntityReference(
          paymentId,
          'payment',
          createdPayment.Id,
          'billpayment'
        );
        
        // Log the sync
        if (user) {
          await supabase.from('qbo_sync_logs').insert({
            user_id: user.id,
            qbo_reference_id: (await qboService.getEntityReference(paymentId, 'payment'))?.id,
            action: 'create',
            status: 'success',
            payload: billPayment as unknown as Json,
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
