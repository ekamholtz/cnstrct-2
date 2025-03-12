
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQBOConnection } from "./useQBOConnection";
import { useToast } from "@/components/ui/use-toast";

export function useSyncInvoicePaymentToQBO() {
  const { connection, qboService } = useQBOConnection();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      paymentAmount, 
      paymentDate,
      paymentMethod
    }: { 
      invoiceId: string; 
      paymentAmount: number; 
      paymentDate: Date;
      paymentMethod: string;
    }) => {
      if (!connection || !qboService) {
        throw new Error("QBO connection not available");
      }
      
      try {
        // First, get the invoice details from our database
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();
        
        if (invoiceError) throw new Error(`Error fetching invoice: ${invoiceError.message}`);
        if (!invoice) throw new Error("Invoice not found");
        
        // Then get the QBO invoice ID for this invoice
        const { data: qboMapping, error: mappingError } = await supabase
          .from('qbo_mappings')
          .select('qbo_id')
          .eq('cnstrct_id', invoiceId)
          .eq('type', 'invoice')
          .single();
          
        if (mappingError) throw new Error(`Error fetching QBO mapping: ${mappingError.message}`);
        if (!qboMapping) throw new Error("QBO invoice mapping not found");
        
        // Now sync the payment to QBO
        // Note: Using qboService's createPaymentReceipt method instead of createPayment
        const qboPayment = await qboService.createPaymentReceipt({
          invoiceId: qboMapping.qbo_id,
          amount: paymentAmount,
          date: paymentDate,
          paymentMethod
        });
        
        return qboPayment;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "QBO Payment Sync Failed",
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
    }
  });
}
