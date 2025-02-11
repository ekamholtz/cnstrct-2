
import { Card } from "@/components/ui/card";
import { BadgeDollarSign, Receipt, Wallet, Clock, Package, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ContractorFinancialSummary() {
  // Fetch paid invoices for all GC's projects
  const { data: paidInvoices = [] } = useQuery({
    queryKey: ['contractor-paid-invoices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      const projectIds = data?.map(p => p.id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .in('project_id', projectIds);

      if (invoicesError) {
        console.error('Error fetching paid invoices:', invoicesError);
        throw invoicesError;
      }

      return invoices || [];
    },
  });

  // Fetch pending invoices for all GC's projects
  const { data: pendingInvoices = [] } = useQuery({
    queryKey: ['contractor-pending-invoices'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      const projectIds = data?.map(p => p.id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'pending_payment')
        .in('project_id', projectIds);

      if (invoicesError) {
        console.error('Error fetching pending invoices:', invoicesError);
        throw invoicesError;
      }

      return invoices || [];
    },
  });

  // Fetch incomplete milestones for all GC's projects
  const { data: incompleteMilestones = [] } = useQuery({
    queryKey: ['contractor-incomplete-milestones'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      const projectIds = data?.map(p => p.id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('amount')
        .eq('status', 'pending')
        .in('project_id', projectIds);

      if (milestonesError) {
        console.error('Error fetching incomplete milestones:', milestonesError);
        throw milestonesError;
      }

      return milestones || [];
    },
  });

  // Fetch expenses for all GC's projects
  const { data: expenses = [] } = useQuery({
    queryKey: ['contractor-expenses-total'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      const projectIds = data?.map(p => p.id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .in('project_id', projectIds);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        throw expensesError;
      }

      return expenses || [];
    },
  });

  const totalPaidInvoices = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPendingInvoices = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalUninvoicedAmount = incompleteMilestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Updated net profit calculation to include pending invoices
  const netProfit = (totalPaidInvoices + totalPendingInvoices) - totalExpenses;
  // Net cash flow calculation (only considering paid invoices)
  const netCashFlow = totalPaidInvoices - totalExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-full">
          <BadgeDollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
          <p className="text-2xl font-bold text-green-600">${totalPaidInvoices.toLocaleString()}</p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-orange-100 p-3 rounded-full">
          <Clock className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
          <p className="text-2xl font-bold text-orange-600">${totalPendingInvoices.toLocaleString()}</p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-purple-100 p-3 rounded-full">
          <Package className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Uninvoiced Amount</p>
          <p className="text-2xl font-bold text-purple-600">${totalUninvoicedAmount.toLocaleString()}</p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-red-100 p-3 rounded-full">
          <Receipt className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-full">
          <Wallet className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${netProfit.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-emerald-100 p-3 rounded-full">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${netCashFlow.toLocaleString()}
          </p>
        </div>
      </Card>
    </div>
  );
}
