
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, PaymentFormData } from "../types";

export function useInvoices(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      console.log('Starting invoice fetch for project:', projectId);
      
      // Use explicit table aliases and qualified column references
      const { data, error } = await supabase
        .from('invoices as i')
        .select(`
          i.*,
          milestone:i.milestone_id (
            name,
            project:project_id (
              name
            )
          )
        `)
        .eq('i.project_id', projectId)
        .order('i.created_at', { ascending: true });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log('Raw invoices data:', data);

      const transformedData: Invoice[] = (data || []).map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        status: invoice.status as Invoice['status'],
        created_at: invoice.created_at,
        milestone_id: invoice.milestone_id,
        milestone_name: invoice.milestone?.name || '',
        project_name: invoice.milestone?.project?.name || '',
        project_id: invoice.project_id,
        payment_method: invoice.payment_method as Invoice['payment_method'],
        payment_date: invoice.payment_date || null,
        payment_reference: invoice.payment_reference || null,
        payment_gateway: invoice.payment_gateway || null,
        simulation_data: invoice.simulation_data,
        updated_at: invoice.updated_at
      }));

      console.log('Transformed invoices data:', transformedData);
      return transformedData;
    },
  });

  useEffect(() => {
    console.log('Setting up real-time subscription for project invoices:', {
      projectId
    });

    const channel = supabase
      .channel(`project-invoices-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      payment_method, 
      payment_date 
    }: { 
      invoiceId: string;
    } & PaymentFormData) => {
      console.log("Marking invoice as paid:", {
        invoiceId,
        payment_method,
        payment_date
      });

      // Get invoice details first
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: invoice.amount,
          direction: 'incoming',
          payment_method_code: payment_method,
          payment_date: payment_date.toISOString(),
          status: 'completed'
        });

      if (paymentError) throw paymentError;

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method,
          payment_date: payment_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .single();

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Success",
        description: "Invoice has been marked as paid",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error in markAsPaid mutation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark invoice as paid. Please try again.",
      });
    },
  });

  return {
    invoices,
    isLoading,
    markAsPaid: markAsPaidMutation.mutateAsync,
  };
}
