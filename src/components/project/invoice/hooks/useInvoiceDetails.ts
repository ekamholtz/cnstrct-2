
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";

export function useInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('No invoice ID provided');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Use standard Supabase join pattern without table aliases
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
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Helper function to validate payment method
      const validatePaymentMethod = (method: string | null): "cc" | "check" | "transfer" | "cash" | null => {
        if (!method) return null;
        if (["cc", "check", "transfer", "cash"].includes(method)) {
          return method as "cc" | "check" | "transfer" | "cash";
        }
        return null;
      };

      // Transform the data to match the Invoice type
      const transformedData: Invoice = {
        id: data.id,
        invoice_number: data.invoice_number,
        amount: data.amount,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        milestone_id: data.milestone_id,
        project_id: data.project_id,
        payment_method: validatePaymentMethod(data.payment_method),
        payment_date: data.payment_date,
        payment_reference: data.payment_reference,
        payment_gateway: data.payment_gateway,
        simulation_data: data.simulation_data,
        milestone_name: data.milestone?.name || '',
        project_name: data.milestone?.project?.name || ''
      };

      return transformedData;
    },
    enabled: !!invoiceId,
  });
}
