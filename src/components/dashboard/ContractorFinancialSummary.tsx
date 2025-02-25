
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useContractorFinancials } from "@/hooks/useContractorFinancials";
import { FinancialMetricsGrid } from "./FinancialMetricsGrid";

export function ContractorFinancialSummary() {
  const { data: projects = [] } = useContractorProjects();
  const projectIds = projects.map(p => p.id);
  
  const {
    totalPaidInvoices,
    totalPendingInvoices,
    totalUninvoicedAmount,
    totalExpenses,
    netProfit,
    netCashFlow
  } = useContractorFinancials(projectIds);

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
