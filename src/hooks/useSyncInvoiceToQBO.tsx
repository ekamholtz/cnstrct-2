
import { useToast } from '@/hooks/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { supabase } from '@/integrations/supabase/client';
import { useQBOMapper } from '@/integrations/qbo/hooks/useQBOMapper';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for syncing invoices to QuickBooks Online
 */
export const useSyncInvoiceToQBO = () => {
  const { toast } = useToast();
  const { service: qboService } = useQBOService('invoice');
  const mapper = useQBOMapper();

  /**
   * Sync an invoice to QuickBooks Online
   */
  const syncInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log('Syncing invoice to QBO:', invoiceId);
      
      // Fetch the invoice with project and vendor details
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
        .select('qbo_id')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoiceId)
        .single();
      
      if (existingRef?.qbo_id) {
        console.log('Invoice already synced to QBO with ID:', existingRef.qbo_id);
        toast({
          title: 'Invoice Already Synced',
          description: `This invoice has already been synced to QuickBooks with ID: ${existingRef.qbo_id}`,
        });
        return {
          success: true,
          data: { id: existingRef.qbo_id }
        };
      }
      
      // Get the QBO client ID for the client
      let clientQBOId;
      
      if (invoice.projects?.clients?.id) {
        const { data: clientRef } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', 'client')
          .eq('entity_id', invoice.projects.clients.id)
          .single();
        
        if (!clientRef?.qbo_id) {
          // If the client isn't synced yet, we need to sync them first
          // Use direct method call instead of qboService.createCustomer
          if (!qboService) {
            throw new Error('QBO invoice service not available');
          }
          
          const clientData = mapper.mapClientToCustomer(invoice.projects.clients);
          
          // Use a safe property access method
          const createCustomer = (qboService as any).createCustomer;
          if (typeof createCustomer !== 'function') {
            throw new Error('QBO service does not have createCustomer method');
          }
          
          const clientResult = await createCustomer(clientData);
          
          if (!clientResult.success) {
            throw new Error(`Failed to create client in QBO: ${clientResult.error}`);
          }
          
          // Store the reference to the newly created client
          await supabase.from('qbo_references').insert({
            entity_type: 'client',
            entity_id: invoice.projects.clients.id,
            qbo_id: clientResult.data.Id
          });
          
          clientQBOId = clientResult.data.Id;
        } else {
          clientQBOId = clientRef.qbo_id;
        }
      } else {
        // If no client is specified, use a default client or account
        clientQBOId = '1'; // This should be configured or fetched from settings
      }
      
      // Map the invoice to QBO invoice format
      const qboInvoiceData = mapper.mapInvoiceToInvoice(
        invoice,
        clientQBOId,
        '1' // This should be configured or fetched from settings
      );
      
      // Use a safe property access method for createInvoice
      if (!qboService) {
        throw new Error('QBO invoice service not available');
      }
      
      const createInvoice = (qboService as any).createInvoice;
      if (typeof createInvoice !== 'function') {
        throw new Error('QBO service does not have createInvoice method');
      }
      
      // Create the invoice in QBO
      const result = await createInvoice(qboInvoiceData);
      
      if (!result.success) {
        throw new Error(`Failed to create invoice in QBO: ${result.error}`);
      }
      
      const qboInvoiceId = result.data.Id;
      
      // Store the reference to the newly created invoice
      await supabase.from('qbo_references').insert({
        entity_type: 'invoice',
        entity_id: invoiceId,
        qbo_id: qboInvoiceId
      });
      
      console.log('Successfully synced invoice to QBO with ID:', qboInvoiceId);
      
      toast({
        title: 'Invoice Synced',
        description: 'The invoice has been successfully synced to QuickBooks',
      });
      
      return {
        success: true,
        data: { id: qboInvoiceId }
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
