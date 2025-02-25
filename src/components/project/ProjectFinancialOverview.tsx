
import { Card, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectFinancialOverviewProps {
  projectId: string;
}

export function ProjectFinancialOverview({ projectId }: ProjectFinancialOverviewProps) {
  // Fetch GC expenses
  const { data: gcExpenses, isLoading: isLoadingGC } = useQuery({
    queryKey: ['project-gc-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch homeowner expenses
  const { data: homeownerExpenses, isLoading: isLoadingHomeowner } = useQuery({
    queryKey: ['project-homeowner-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homeowner_expenses')
        .select('amount, payment_status')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = isLoadingGC || isLoadingHomeowner;

  // Calculate totals
  const totalGCExpenses = gcExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const totalHomeownerExpenses = homeownerExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const totalBudget = totalGCExpenses + totalHomeownerExpenses;

  // Calculate paid amounts
  const homeownerPaidAmount = homeownerExpenses
    ?.filter(exp => exp.payment_status === 'paid')
    .reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const LoadingState = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <CardHeader className="p-0">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Budget</h3>
        </CardHeader>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-3xl font-bold">${totalBudget.toLocaleString()}</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>GC Expenses: ${totalGCExpenses.toLocaleString()}</p>
              <p>Homeowner Expenses: ${totalHomeownerExpenses.toLocaleString()}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Amount Paid</h3>
        </CardHeader>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-3xl font-bold">${homeownerPaidAmount.toLocaleString()}</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>GC Payments: $0</p>
              <p>Homeowner Payments: ${homeownerPaidAmount.toLocaleString()}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
