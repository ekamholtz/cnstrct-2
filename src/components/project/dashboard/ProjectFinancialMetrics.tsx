
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-[#172b70] mb-6">Financial Overview</h2>
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
