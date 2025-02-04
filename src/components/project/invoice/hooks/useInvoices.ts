import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, PaymentFormData } from "../types";
import { useInvoiceSubscription } from "./useInvoiceSubscription";
import { useInvoiceMutation } from "./useInvoiceMutation";

export function useInvoices(projectId: string) {
  // Set up real-time subscription
  useInvoiceSubscription(projectId);

  // Set up mutation
  const { mutateAsync: markAsPaid } = useInvoiceMutation();

  // Query invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      console.log('Fetching invoices for project:', projectId);
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
        .eq('milestone.project.id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log('Fetched invoices:', data);
      return data as Invoice[];
    },
  });

  return {
    invoices,
    isLoading,
    markAsPaid,
  };
}