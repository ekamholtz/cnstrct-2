
import { useQuery } from "@tanstack/react-query";
import { getClientProjects, getClientInvoices } from "@/mocks/clientApi";
import { useToast } from "@/hooks/use-toast";

export interface ClientInvoicesData {
  invoices: any[];
  totalPending: number;
}

export function useClientInvoices() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['client-invoices'],
    queryFn: async (): Promise<ClientInvoicesData> => {
      try {
        // First, fetch client projects
        const projects = await getClientProjects();
        
        if (!projects.length) {
          console.log('No client projects found');
          return { invoices: [], totalPending: 0 };
        }
        
        // Extract project IDs
        const projectIds = projects.map((p: any) => p.id);
        console.log('Client project IDs:', projectIds);
        
        // Fetch invoices for these projects
        const invoices = await getClientInvoices(projectIds);
        console.log('Client invoices:', invoices);
        
        // Calculate total pending amount
        const totalPending = invoices
          .filter((invoice: any) => invoice.status === 'pending_payment')
          .reduce((sum: number, invoice: any) => sum + invoice.amount, 0);
          
        return {
          invoices,
          totalPending
        };
      } catch (error) {
        console.error('Error fetching client invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoice data. Please try again later.",
          variant: "destructive"
        });
        return { invoices: [], totalPending: 0 };
      }
    }
  });
}
