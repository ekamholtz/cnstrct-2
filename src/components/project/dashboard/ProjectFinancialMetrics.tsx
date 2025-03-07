
import { useProjectFinancials } from "@/hooks/useProjectFinancials";
import { FinancialMetricsGrid } from "@/components/dashboard/FinancialMetricsGrid";

interface ProjectFinancialMetricsProps {
  projectId: string;
}

export function ProjectFinancialMetrics({ projectId }: ProjectFinancialMetricsProps) {
  const {
    totalPaidInvoices,
    totalPendingInvoices,
    totalUninvoicedAmount,
    totalExpenses,
    netProfit,
    netCashFlow
  } = useProjectFinancials(projectId);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-blue-500 mr-3 rounded-full"></div>
        <h2 className="text-xl font-semibold text-slate-800">Financial Overview</h2>
      </div>
      <FinancialMetricsGrid 
        metrics={{
          paidInvoices: totalPaidInvoices,
          pendingInvoices: totalPendingInvoices,
          uninvoicedAmount: totalUninvoicedAmount,
          totalExpenses: totalExpenses,
          netProfit: netProfit,
          netCashFlow: netCashFlow
        }}
      />
    </div>
  );
}
