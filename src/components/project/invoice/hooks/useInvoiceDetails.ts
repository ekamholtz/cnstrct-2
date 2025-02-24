
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";

export function useInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('No invoice ID provided');

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          milestone:milestones (
            name,
            project:project_id (
              name
            )
          )
        `)
        .eq('id', invoiceId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invoice not found');

      // Map the data to our Invoice type
      const invoice: Invoice = {
        id: data.id,
        invoice_number: data.invoice_number,
        amount: data.amount,
        status: data.status,
        created_at: data.created_at,
        milestone_id: data.milestone_id,
        milestone_name: data.milestone.name,
        project_name: data.milestone.project.name,
        project_id: data.project_id,
        payment_method: data.payment_method as "cc" | "check" | "transfer" | "cash" | null,
        payment_date: data.payment_date,
        payment_reference: data.payment_reference,
        payment_gateway: data.payment_gateway,
        updated_at: data.updated_at
      };
      
      console.log('Transformed invoice data:', invoice);
      return invoice;
    },
    enabled: !!invoiceId,
  });
}
