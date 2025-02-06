
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, PaymentFormData } from "../types";

export function useInvoices(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [milestoneIds, setMilestoneIds] = useState<string[]>([]);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      console.log('Starting invoice fetch for project:', projectId);
      
      // First, verify the project exists
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error verifying project:', projectError);
        throw projectError;
      }

      console.log('Verified project exists:', project);

      // First get all milestones for this project
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id')
        .eq('project_id', projectId);

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        throw milestonesError;
      }

      const currentMilestoneIds = milestones.map(m => m.id);
      setMilestoneIds(currentMilestoneIds);
      
      // Then fetch invoices that belong to these milestones
      const { data, error } = await supabase
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
        .in('milestone_id', currentMilestoneIds);

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log('Fetched invoices for project:', {
        projectId,
        milestoneIds: currentMilestoneIds,
        invoiceCount: data?.length,
        invoices: data
      });

      return data as Invoice[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set up real-time subscription for this specific project's invoices
  useEffect(() => {
    if (milestoneIds.length === 0) return;

    console.log('Setting up real-time subscription for project invoices:', projectId);
    const channel = supabase
      .channel(`project-invoices-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `milestone_id.in.(${milestoneIds.join(',')})`
        },
        (payload) => {
          console.log('Real-time update received for project invoices:', {
            projectId,
            event: payload.eventType,
            data: payload.new
          });
          queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for project:', projectId);
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, milestoneIds]);

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
