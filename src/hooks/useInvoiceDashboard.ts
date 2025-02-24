
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

      return (data || []) as Invoice[];
    }
  });
}
