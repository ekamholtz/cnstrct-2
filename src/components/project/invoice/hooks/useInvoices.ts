
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
      
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          milestone:milestone_id (
            name,
            project:project_id (
              name
            )
          )
        `)
        .eq('project_id', projectId)  // Filter by project_id
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        throw invoicesError;
      }

      console.log('Fetched invoices:', {
        projectId,
        invoiceCount: invoicesData?.length,
        invoices: invoicesData
      });

      return invoicesData as Invoice[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set up real-time subscription for invoices
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
          filter: `project_id=eq.${projectId}`  // Filter realtime events by project_id
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
      console.log('Marking invoice as paid:', {
        invoiceId,
        payment_method,
        payment_date
      });

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method,
          payment_date: payment_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error marking invoice as paid:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
      toast({
        title: "Success",
        description: "Invoice has been marked as paid",
      });
    },
    onError: (error) => {
      console.error('Error in markAsPaid mutation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
      });
    },
  });

  return {
    invoices,
    isLoading,
    markAsPaid: markAsPaidMutation.mutateAsync,
  };
}
