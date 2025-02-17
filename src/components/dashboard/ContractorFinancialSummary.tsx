
import { BadgeDollarSign, Receipt, Wallet, Clock, Package, TrendingUp } from "lucide-react";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useContractorFinancials } from "@/hooks/useContractorFinancials";
import { FinancialCard } from "./FinancialCard";
import { Link } from "react-router-dom";

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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <Link to="/invoices" className="block">
        <FinancialCard
          icon={BadgeDollarSign}
          iconColor="text-green-600"
          bgColor="bg-green-100"
          label="Paid Invoices"
          amount={totalPaidInvoices}
        />
      </Link>

      <Link to="/invoices" className="block">
        <FinancialCard
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-100"
          label="Pending Invoices"
          amount={totalPendingInvoices}
        />
      </Link>

      <FinancialCard
        icon={Package}
        iconColor="text-purple-600"
        bgColor="bg-purple-100"
        label="Uninvoiced Amount"
        amount={totalUninvoicedAmount}
      />

      <Link to="/expenses" className="block">
        <FinancialCard
          icon={Receipt}
          iconColor="text-red-600"
          bgColor="bg-red-100"
          label="Total Expenses"
          amount={totalExpenses}
        />
      </Link>

      <FinancialCard
        icon={Wallet}
        iconColor="text-blue-600"
        bgColor="bg-blue-100"
        label="Net Profit"
        amount={netProfit}
        textColor={netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}
      />

      <FinancialCard
        icon={TrendingUp}
        iconColor="text-emerald-600"
        bgColor="bg-emerald-100"
        label="Net Cash Flow"
        amount={netCashFlow}
        textColor={netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}
      />
    </div>
  );
}
