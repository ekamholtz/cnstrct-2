
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { useToast } from "@/components/ui/use-toast";

interface ExpensePaymentData {
  id: string;
  expense_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

interface Expense {
  id: string;
  name: string;
  qbo_entity_id?: string;
}

export const useSyncExpensePaymentToQBO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const qboService = new QBOService();
  
  return useMutation({
    mutationFn: async ({ 
      payment, 
      expense 
    }: { 
      payment: ExpensePaymentData; 
      expense: Expense 
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
        
        // Check if the expense has been synced
        if (!expense.qbo_entity_id) {
          throw new Error("Cannot sync payment: Expense has not been synced to QuickBooks yet");
        }
        
        // Create bill payment in QBO
        const billPaymentData = {
          VendorRef: {
            // We would get this from expense.vendor_ref, but we'll need to add that field
            value: "56" // Example vendor ID - should be dynamically fetched
          },
          TotalAmt: payment.amount,
          PayType: "Check", // or "CreditCard" based on payment_method
          CheckPayment: {
            BankAccountRef: {
              value: "35" // Default bank account - should be configurable
            }
          },
          Line: [
            {
              Amount: payment.amount,
              LinkedTxn: [
                {
                  TxnId: expense.qbo_entity_id,
                  TxnType: "Bill"
                }
              ]
            }
          ],
          TxnDate: payment.payment_date
        };
        
        const paymentResponse = await qboService.createBillPayment(billPaymentData);
        
        if (!paymentResponse.success) {
          throw new Error(paymentResponse.error || "Failed to create bill payment in QuickBooks");
        }
        
        const billPaymentId = paymentResponse.data.Id;
        
        // Store the reference in our database
        await qboService.storeEntityReference('expense_payment', payment.id, billPaymentId);
        
        // Update local state
        const updatedPayment = {
          ...payment,
          qbo_sync_status: 'synced',
          qbo_entity_id: billPaymentId
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
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
};
