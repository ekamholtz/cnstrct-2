
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionType, TransactionStatus } from "../TransactionFilters";

export function useTransactions(
  transactionType: TransactionType,
  statusFilter: TransactionStatus,
  projectFilter: string
) {
  // Fetch projects for filter dropdown
  const { data: projects } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: async () => {
      console.log('Fetching projects for dropdown');
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      console.log('Projects fetched:', data);
      return data;
    }
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['admin-invoices', statusFilter, projectFilter],
    queryFn: async () => {
      console.log('Fetching invoices with filters:', { statusFilter, projectFilter });
      let query = supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          project_id,
          milestone_id,
          milestones (
            name
          ),
          projects (
            name
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      console.log('Invoices fetched:', data);
      return data;
    },
    enabled: transactionType === 'all' || transactionType === 'invoice'
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['admin-expenses', projectFilter],
    queryFn: async () => {
      console.log('Fetching expenses with filter:', { projectFilter });
      let query = supabase
        .from('expenses')
        .select(`
          id,
          name,
          payee,
          amount,
          expense_date,
          notes,
          project_id,
          projects (
            name
          )
        `);

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      console.log('Expenses fetched:', data);
      return data;
    },
    enabled: transactionType === 'all' || transactionType === 'expense'
  });

  return { projects, invoices, expenses };
}
