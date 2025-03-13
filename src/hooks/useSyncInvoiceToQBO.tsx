
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useQBOService } from '@/integrations/qbo/hooks/useQBOService';
import { supabase } from '@/integrations/supabase/client';
import { useQBOMapper } from '@/integrations/qbo/hooks/useQBOMapper';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for syncing invoices to QuickBooks Online
 */
export const useSyncInvoiceToQBO = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const qboService = useQBOService();
  const mapper = useQBOMapper();

  /**
   * Sync an invoice to QuickBooks Online
   */
  const syncInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      setIsLoading(true);
      
      try {
        console.log('Syncing invoice to QBO:', invoiceId);
        
        // First, fetch the invoice with the project and client details
        // Simplified query to avoid nested join issues
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('*, project_id')
          .eq('id', invoiceId)
          .single();
        
        if (invoiceError || !invoice) {
          throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
        }
        
        console.log('Invoice data fetched successfully:', invoice);
        
        // Now fetch the project separately
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*, client_id')
          .eq('id', invoice.project_id)
          .single();
          
        if (projectError || !project) {
          throw new Error(`Failed to fetch project: ${projectError?.message || 'Not found'}`);
        }
        
        console.log('Project data fetched successfully:', project);
        
        // Now fetch the client separately
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', project.client_id)
          .single();
          
        if (clientError || !client) {
          throw new Error(`Failed to fetch client: ${clientError?.message || 'Not found'}`);
        }
        
        console.log('Client data fetched successfully:', client);
        
        // Combine the data for the mapper
        const invoiceData = {
          ...invoice,
          projects: {
            ...project,
            clients: client
          }
        };
        
        // Check if this invoice is already synced to QBO
        const { data: invoiceRef } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', 'invoice')
          .eq('entity_id', invoiceId)
          .single();
        
        if (invoiceRef?.qbo_id) {
          console.log('Invoice already synced to QBO with ID:', invoiceRef.qbo_id);
          toast({
            title: "Already Synced",
            description: `Invoice is already synced to QuickBooks with ID: ${invoiceRef.qbo_id}`,
          });
          return { success: true, data: { id: invoiceRef.qbo_id } };
        }
        
        // Check if client is already in QBO
        const { data: clientRef } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', 'client')
          .eq('entity_id', client.id)
          .single();
        
        let qboCustomerId = clientRef?.qbo_id;
        
        // If client is not in QBO, create them
        if (!qboCustomerId) {
          console.log('Client not synced to QBO yet, creating...');
          
          // Map client data to QBO customer format
          const customerData = mapper.mapClientToCustomer(client);
          console.log('Mapped customer data:', customerData);
          
          // Create customer in QBO using the proxy service
          const customerResult = await qboService.createCustomer(customerData);
          
          if (!customerResult.success || !customerResult.data) {
            throw new Error(`Failed to create customer in QBO: ${customerResult.error || 'Unknown error'}`);
          }
          
          qboCustomerId = customerResult.data.Id;
          console.log('Customer created in QBO with ID:', qboCustomerId);
          
          // Store the reference
          await supabase.from('qbo_references').insert({
            entity_type: 'client',
            entity_id: client.id,
            qbo_id: qboCustomerId
          });
        } else {
          console.log('Client already exists in QBO with ID:', qboCustomerId);
        }
        
        // Map invoice data to QBO invoice format - using the correct mapper method
        const qboInvoiceData = mapper.mapInvoiceToInvoice(invoiceData, qboCustomerId, '1'); // Using '1' as default income account ID
        console.log('Mapped invoice data:', qboInvoiceData);
        
        // Create invoice in QBO
        const invoiceResult = await qboService.createInvoice(qboInvoiceData);
        
        if (!invoiceResult.success || !invoiceResult.data) {
          throw new Error(`Failed to create invoice in QBO: ${invoiceResult.error || 'Unknown error'}`);
        }
        
        const qboInvoiceId = invoiceResult.data.Id;
        console.log('Invoice created in QBO with ID:', qboInvoiceId);
        
        // Store the reference
        await supabase.from('qbo_references').insert({
          entity_type: 'invoice',
          entity_id: invoiceId,
          qbo_id: qboInvoiceId
        });
        
        toast({
          title: "Success",
          description: `Invoice synced to QuickBooks with ID: ${qboInvoiceId}`,
        });
        
        return { success: true, data: { id: qboInvoiceId } };
      } catch (error) {
        console.error('Error syncing invoice to QBO:', error);
        
        toast({
          title: "Error syncing invoice to QBO",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        });
        
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      } finally {
        setIsLoading(false);
      }
    }
  });
  
  const syncInvoiceToQBO = async (invoiceId: string) => {
    return await syncInvoiceMutation.mutateAsync(invoiceId);
  };
  
  return { 
    syncInvoiceToQBO, 
    isLoading: syncInvoiceMutation.isPending || isLoading 
  };
};
