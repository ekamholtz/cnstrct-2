
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { Invoice } from "@/components/project/invoice/types";

export const useClientInvoices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      try {
        console.log("Fetching client invoices for user:", user?.id);
        
        // First, get the client's projects
        const projectsResponse = await axios.get('/api/client/projects');
        const projects = projectsResponse.data || [];
        
        console.log("Client projects:", projects);
        
        if (!projects.length) {
          console.log("No projects found for client");
          return { invoices: [], totalPending: 0 };
        }
        
        // Get all invoices for these projects
        const projectIds = projects.map(project => project.id);
        const invoicesResponse = await axios.get('/api/client/invoices', {
          params: { projectIds: projectIds.join(',') }
        });
        
        const invoices = invoicesResponse.data || [];
        console.log("Client invoices:", invoices);
        
        // Calculate total pending amount
        const totalPending = invoices
          .filter(invoice => invoice.status === 'pending_payment')
          .reduce((sum, invoice) => sum + invoice.amount, 0);
        
        return {
          invoices,
          totalPending
        };
      } catch (error) {
        console.error("Error fetching client invoices:", error);
        // Instead of throwing error, return empty data
        return { invoices: [], totalPending: 0 };
      }
    },
    // Add error handling at the query level
    onError: (error) => {
      console.error("Query error in useClientInvoices:", error);
    }
  });
};
