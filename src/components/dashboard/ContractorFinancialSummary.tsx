import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useContractorFinancials } from "@/hooks/useContractorFinancials";
import { FinancialMetricsGrid } from "./FinancialMetricsGrid";
import { TrendingUp } from "lucide-react";

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
    <div className="premium-card p-6">
      <h2 className="text-xl font-semibold text-cnstrct-navy mb-6 flex items-center">
        <span className="inline-block w-1 h-6 bg-cnstrct-orange mr-3 rounded-full"></span>
        Financial Overview
      </h2>
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
