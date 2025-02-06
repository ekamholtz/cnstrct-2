
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

      // Get milestones for this project with a direct project_id filter
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('id')
        .eq('project_id', projectId);

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        throw milestonesError;
      }

      if (!milestones || milestones.length === 0) {
        console.log('No milestones found for project:', projectId);
        return [];
      }

      const currentMilestoneIds = milestones.map(m => m.id);
      console.log('Milestone IDs for project:', currentMilestoneIds);
      setMilestoneIds(currentMilestoneIds);

      // Fetch invoices using milestone_id IN clause
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
        .in('milestone_id', currentMilestoneIds);

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        throw invoicesError;
      }

      console.log('Fetched invoices:', {
        projectId,
        milestoneIds: currentMilestoneIds,
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
    if (!milestoneIds.length) return;

    console.log('Setting up real-time subscription for project invoices:', {
      projectId,
      milestoneIds
    });

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
