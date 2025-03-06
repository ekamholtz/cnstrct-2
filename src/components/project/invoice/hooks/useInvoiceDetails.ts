
import { useQuery } from "@tanstack/react-query";
import { getInvoiceDetails } from "@/services/invoiceService";
import { Invoice } from "../types";

export function useInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('No invoice ID provided');
      return getInvoiceDetails(invoiceId);
    },
    enabled: !!invoiceId,
  });
}
