
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Invoice } from "@/components/project/invoice/types";

export interface ClientInvoicesData {
  invoices: Invoice[];
  totalPending: number;
}

export function useClientInvoices() {
  return useQuery({
    queryKey: ['client-invoices'],
    queryFn: async (): Promise<ClientInvoicesData> => {
      try {
        // First, fetch client projects
        const projectsResponse = await axios.get('/api/client/projects');
        const projects = projectsResponse.data || [];
        
        if (!projects.length) {
          console.log('No client projects found');
          return { invoices: [], totalPending: 0 };
        }
        
        // Extract project IDs
        const projectIds = projects.map((p: any) => p.id);
        console.log('Client project IDs:', projectIds);
        
        // Fetch invoices for these projects
        const invoicesResponse = await axios.get('/api/client/invoices', {
          params: { projectIds: projectIds.join(',') }
        });
        
        const invoices = invoicesResponse.data?.invoices || [];
        console.log('Client invoices:', invoices);
        
        // Calculate total pending amount
        const totalPending = invoices
          .filter((invoice: Invoice) => invoice.status === 'pending_payment')
          .reduce((sum: number, invoice: Invoice) => sum + invoice.amount, 0);
          
        return {
          invoices,
          totalPending
        };
      } catch (error) {
        console.error('Error fetching client invoices:', error);
        throw error;
      }
    }
  });
}
