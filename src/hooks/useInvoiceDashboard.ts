
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/project/invoice/types";

export type InvoiceStatus = "pending_payment" | "paid" | "cancelled";

export function useInvoiceDashboard() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the Invoice type
      const transformedData = (data || []).map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        status: invoice.status,
        created_at: invoice.created_at,
        milestone_id: invoice.milestone_id,
        milestone_name: invoice.milestone?.name || '',
        project_name: invoice.milestone?.project?.name || '',
        project_id: invoice.project_id,
        payment_method: invoice.payment_method,
        payment_date: invoice.payment_date,
        payment_reference: invoice.payment_reference,
        payment_gateway: invoice.payment_gateway,
        simulation_data: invoice.simulation_data,
        updated_at: invoice.updated_at
      }));

      return transformedData;
    }
  });
}
