
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContractorFinancials(projectIds: string[]) {
  const { data: paidInvoices = [] } = useQuery({
    queryKey: ['contractor-paid-invoices', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching paid invoices:', error);
        throw error;
      }

      return data || [];
    },
    enabled: projectIds.length > 0,
  });

  const { data: pendingInvoices = [] } = useQuery({
    queryKey: ['contractor-pending-invoices', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'pending_payment')
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching pending invoices:', error);
        throw error;
      }

      return data || [];
    },
    enabled: projectIds.length > 0,
  });

  const { data: incompleteMilestones = [] } = useQuery({
    queryKey: ['contractor-incomplete-milestones', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('milestones')
        .select('amount')
        .eq('status', 'pending')
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching incomplete milestones:', error);
        throw error;
      }

      return data || [];
    },
    enabled: projectIds.length > 0,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['contractor-expenses-total', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .in('project_id', projectIds);

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      return data || [];
    },
    enabled: projectIds.length > 0,
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
