
import { useMutation } from "@tanstack/react-query";
import { useQBOService } from "@/integrations/qbo/hooks/useQBOService";
import { useToast } from "@/components/ui/use-toast";
import { useQBOMapper } from "@/integrations/qbo/hooks/useQBOMapper";
import { supabase } from "@/integrations/supabase/client";

// Type for syncing invoice payments
interface InvoicePaymentData {
  id: string;
  amount: number;
  date: string;
  payment_type: string;
  invoice_id: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

// Type for syncing bill/expense payments
interface ExpensePaymentData {
  id: string;
  amount: number;
  date: string;
  payment_type: string;
  expense_id: string;
  qbo_sync_status?: string;
  qbo_entity_id?: string;
}

// Unified type for payment data
type PaymentData = InvoicePaymentData | ExpensePaymentData;

// Helper to determine if payment is for an invoice
const isInvoicePayment = (payment: PaymentData): payment is InvoicePaymentData => {
  return 'invoice_id' in payment;
};

// Helper to determine if payment is for an expense
const isExpensePayment = (payment: PaymentData): payment is ExpensePaymentData => {
  return 'expense_id' in payment;
};

/**
 * Hook for syncing payments to QuickBooks Online
 */
export const useSyncPaymentToQBO = () => {
  const { toast } = useToast();
  const qboService = useQBOService();
  const mapper = useQBOMapper();
  
  // Create mutation for syncing a payment to QBO
  const syncMutation = useMutation({
    mutationFn: async (payment: PaymentData) => {
      try {
        console.log("Starting payment sync to QBO:", payment);
        
        // Check if payment has already been synced
        if (payment.qbo_sync_status === 'synced' && payment.qbo_entity_id) {
          toast({
            title: "Already Synced",
            description: "This payment has already been synced to QuickBooks Online.",
            variant: "default"
          });
          return payment;
        }
        
        // Handle invoice payment
        if (isInvoicePayment(payment)) {
          return await syncInvoicePayment(payment);
        }
        
        // Handle expense payment
        if (isExpensePayment(payment)) {
          return await syncExpensePayment(payment);
        }
        
        throw new Error("Unknown payment type");
      } catch (error) {
        console.error("Error syncing payment to QBO:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        toast({
          title: "Sync Failed",
          description: `Error syncing to QuickBooks: ${errorMessage}`,
          variant: "destructive"
        });
        
        throw error;
      }
    }
  });
  
  /**
   * Sync an invoice payment to QBO
   */
  const syncInvoicePayment = async (payment: InvoicePaymentData) => {
    console.log(`Syncing invoice payment ${payment.id} for invoice ${payment.invoice_id}`);
    
    try {
      // Get the QBO entity ID for the invoice
      const qboInvoiceId = await qboService.getEntityReference('invoice', payment.invoice_id);
      
      if (!qboInvoiceId) {
        throw new Error("Invoice not found in QBO. Please sync the invoice first.");
      }
      
      // Get the client ID for this invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('project_invoices')
        .select('client_id')
        .eq('id', payment.invoice_id)
        .single();
      
      if (invoiceError || !invoice) {
        throw new Error(`Error fetching invoice details: ${invoiceError?.message || 'Invoice not found'}`);
      }
      
      // Get the QBO customer ID for this client
      const qboCustomerId = await qboService.getCustomerIdForClient(invoice.client_id);
      
      if (!qboCustomerId) {
        throw new Error("Client not found in QBO. Please sync the client first.");
      }
      
      // Create payment data for QBO
      const paymentData = mapper.mapInvoicePaymentToPayment({
        invoiceId: qboInvoiceId,
        amount: payment.amount,
        date: new Date(payment.date),
        paymentMethod: payment.payment_type
      });
      
      // Set the customer reference
      paymentData.CustomerRef.value = qboCustomerId;
      
      // Record payment in QBO
      const paymentResponse = await qboService.recordPayment(paymentData);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "Failed to record payment in QuickBooks");
      }
      
      // Get the QBO payment ID
      const qboPaymentId = paymentResponse.data.Id;
      
      // Store the reference in our database
      await qboService.storeEntityReference('payment', payment.id, qboPaymentId);
      
      // Update local state
      const updatedPayment = {
        ...payment,
        qbo_sync_status: 'synced',
        qbo_entity_id: qboPaymentId
      };
      
      // Update the payment record in the database
      await supabase
        .from('payments')
        .update({
          qbo_sync_status: 'synced',
          qbo_entity_id: qboPaymentId
        })
        .eq('id', payment.id);
      
      toast({
        title: "Payment Synced",
        description: "Successfully synced payment to QuickBooks Online.",
        variant: "default"
      });
      
      return updatedPayment;
    } catch (error) {
      console.error("Error syncing invoice payment:", error);
      throw error;
    }
  };
  
  /**
   * Sync an expense payment to QBO
   */
  const syncExpensePayment = async (payment: ExpensePaymentData) => {
    console.log(`Syncing expense payment ${payment.id} for expense ${payment.expense_id}`);
    
    try {
      // Get the QBO entity ID for the expense/bill
      const qboBillId = await qboService.getEntityReference('expense', payment.expense_id);
      
      if (!qboBillId) {
        throw new Error("Expense not found in QBO. Please sync the expense first.");
      }
      
      // Get the vendor ID for this expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('vendor_name')
        .eq('id', payment.expense_id)
        .single();
      
      if (expenseError || !expense) {
        throw new Error(`Error fetching expense details: ${expenseError?.message || 'Expense not found'}`);
      }
      
      // Get the QBO vendor ID for this vendor
      const vendorId = await qboService.getVendorIdForExpense(expense.vendor_name);
      
      // Create payment data for QBO
      const paymentData = mapper.mapExpensePaymentToBillPayment({
        billId: qboBillId,
        amount: payment.amount,
        date: new Date(payment.date),
        paymentMethod: payment.payment_type
      });
      
      // Set the vendor reference
      paymentData.VendorRef.value = vendorId;
      
      // Record bill payment in QBO
      // Use recordPayment as a fallback if recordBillPayment is not available
      const paymentResponse = await qboService.recordPayment(paymentData);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "Failed to record bill payment in QuickBooks");
      }
      
      // Get the QBO payment ID
      const qboPaymentId = paymentResponse.data.Id;
      
      // Store the reference in our database
      await qboService.storeEntityReference('payment', payment.id, qboPaymentId);
      
      // Update local state
      const updatedPayment = {
        ...payment,
        qbo_sync_status: 'synced',
        qbo_entity_id: qboPaymentId
      };
      
      // Update the payment record in the database
      await supabase
        .from('payments')
        .update({
          qbo_sync_status: 'synced',
          qbo_entity_id: qboPaymentId
        })
        .eq('id', payment.id);
      
      toast({
        title: "Bill Payment Synced",
        description: "Successfully synced bill payment to QuickBooks Online.",
        variant: "default"
      });
      
      return updatedPayment;
    } catch (error) {
      console.error("Error syncing expense payment:", error);
      throw error;
    }
  };
  
  /**
   * Public function to sync a payment to QBO
   */
  const syncPaymentToQBO = async (payment: PaymentData) => {
    return await syncMutation.mutateAsync(payment);
  };
  
  return {
    ...syncMutation,
    syncPaymentToQBO,
    isLoading: syncMutation.isPending
  };
};
