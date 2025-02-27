
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProjectFinancials(projectId: string) {
  const { data: paidInvoices = [] } = useQuery({
    queryKey: ['project-paid-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching paid invoices:', error);
        throw error;
      }

      return data || [];
    },
  });

  const { data: pendingInvoices = [] } = useQuery({
    queryKey: ['project-pending-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'pending_payment')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching pending invoices:', error);
        throw error;
      }

      return data || [];
    },
  });

  const { data: incompleteMilestones = [] } = useQuery({
    queryKey: ['project-incomplete-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('amount')
        .eq('status', 'pending')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching incomplete milestones:', error);
        throw error;
      }

      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['project-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      return data || [];
    },
  });

  const totalPaidInvoices = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPendingInvoices = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalUninvoicedAmount = incompleteMilestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = (totalPaidInvoices + totalPendingInvoices) - totalExpenses;
  const netCashFlow = totalPaidInvoices - totalExpenses;

  return {
    totalPaidInvoices,
    totalPendingInvoices,
    totalUninvoicedAmount,
    totalExpenses,
    netProfit,
    netCashFlow
  };
}
