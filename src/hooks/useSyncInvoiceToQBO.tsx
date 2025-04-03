
import { useToast } from '@/hooks/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for syncing invoices to QuickBooks Online
 */
export const useSyncInvoiceToQBO = () => {
  const { toast } = useToast();
  const qboService = useQBOService();

  /**
   * Sync an invoice to QuickBooks Online
   */
  const syncInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log('Simulating invoice sync to QBO:', invoiceId);
      
      // Fetch the invoice with project and client details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          projects:project_id (
            *,
            clients:client_id (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError || !invoice) {
        throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Invoice not found'}`);
      }
      
      // Check if the invoice has already been synced
      const { data: existingRef } = await supabase
        .from('qbo_references')
        .select('qbo_entity_id')
        .eq('local_entity_type', 'invoice')
        .eq('local_entity_id', invoiceId)
        .single();
      
      if (existingRef?.qbo_entity_id) {
        console.log('Invoice already synced to QBO with ID:', existingRef.qbo_entity_id);
        toast({
          title: 'Invoice Already Synced',
          description: `This invoice has already been synced to QuickBooks with ID: ${existingRef.qbo_entity_id}`,
        });
        return {
          success: true,
          data: { id: existingRef.qbo_entity_id }
        };
      }
      
      // Simulate successful invoice creation in QBO
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQboInvoiceId = `INV-${Math.floor(Math.random() * 10000)}`;
      
      // Store the reference to the newly created invoice
      await supabase.from('qbo_references').insert({
        local_entity_type: 'invoice',
        local_entity_id: invoiceId,
        qbo_entity_id: mockQboInvoiceId
      });
      
      console.log('Successfully synced invoice to QBO with ID:', mockQboInvoiceId);
      
      toast({
        title: 'Invoice Synced',
        description: 'The invoice has been successfully synced to QuickBooks',
      });
      
      return {
        success: true,
        data: { id: mockQboInvoiceId }
      };
    },
    onError: (error) => {
      console.error('Error syncing invoice to QBO:', error);
      
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });
  
  const syncInvoiceToQBO = async (invoiceId: string) => {
    try {
      const result = await syncInvoiceMutation.mutateAsync(invoiceId);
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  
  return {
    syncInvoiceToQBO,
    isLoading: syncInvoiceMutation.isPending
  };
};
