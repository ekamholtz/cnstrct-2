
import { Card } from "@/components/ui/card";
import { BadgeDollarSign, Clock, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFinancialSummaryProps {
  projectId: string;
}

export function ProjectFinancialSummary({ projectId }: ProjectFinancialSummaryProps) {
  // Fetch all milestones to get total contract value
  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('amount')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  // Fetch all invoices for this project
  const { data: invoices = [] } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          amount,
          status
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  // Calculate total contract value
  const totalContractValue = milestones.reduce((sum, milestone) => 
    sum + (milestone.amount || 0), 0);

  // Calculate paid invoices total
  const paidInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Calculate pending invoices total
  const pendingInvoicesTotal = invoices
    .filter(invoice => invoice.status === 'pending_payment')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Calculate remaining balance
  const totalInvoicedAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const remainingBalance = totalContractValue - totalInvoicedAmount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-full">
          <BadgeDollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Payments Made</p>
          <p className="text-2xl font-bold text-green-600">
            ${paidInvoicesTotal.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-orange-100 p-3 rounded-full">
          <Clock className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
          <p className="text-2xl font-bold text-orange-600">
            ${pendingInvoicesTotal.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="p-6 flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-full">
          <TrendingDown className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Remaining Balance</p>
          <p className="text-2xl font-bold text-blue-600">
            ${remainingBalance.toLocaleString()}
          </p>
        </div>
      </Card>
    </div>
  );
}
