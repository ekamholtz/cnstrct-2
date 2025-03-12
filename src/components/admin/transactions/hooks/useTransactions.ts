
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
      return data || [];
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
          payment_method,
          payment_date,
          payment_reference,
          payment_gateway,
          simulation_data,
          milestones:milestone_id (
            name
          ),
          projects:project_id (
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
      return data || [];
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
          amount_due,
          expense_date,
          notes,
          expense_type,
          payment_status,
          project_id,
          projects:project_id (
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
      return data || [];
    },
    enabled: transactionType === 'all' || transactionType === 'expense'
  });

  return { projects, invoices, expenses };
}
