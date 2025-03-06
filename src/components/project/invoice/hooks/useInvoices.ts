
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, PaymentFormData } from "../types";
import { getProjectInvoices, markInvoiceAsPaid } from "@/services/invoiceService";

export function useInvoices(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      return getProjectInvoices(projectId);
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
      await markInvoiceAsPaid(invoiceId, { payment_method, payment_date });
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
