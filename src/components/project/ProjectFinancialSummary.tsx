
import { Card } from "@/components/ui/card";
import { BadgeDollarSign, Receipt, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFinancialSummaryProps {
  projectId: string;
}

export function ProjectFinancialSummary({ projectId }: ProjectFinancialSummaryProps) {
  // Fetch paid invoices
  const { data: paidInvoices = [] } = useQuery({
    queryKey: ['project-paid-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          amount,
          milestone:milestone_id (
            project_id
          )
        `)
        .eq('status', 'paid')
        .eq('milestone.project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['project-expenses-total', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  const totalPaidInvoices = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalPaidInvoices - totalExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
    </div>
  );
}
