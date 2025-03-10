import { BadgeDollarSign, Receipt, Wallet, Clock, Package, TrendingUp, LucideIcon } from "lucide-react";
import { FinancialCard } from "./FinancialCard";
import { Link } from "react-router-dom";

interface FinancialMetric {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  label: string;
  amount: number;
  link?: string;
  textColor?: string;
  borderColor?: string;
}

interface FinancialMetricsGridProps {
  metrics: {
    paidInvoices: number;
    pendingInvoices: number;
    uninvoicedAmount: number;
    totalExpenses: number;
    netProfit: number;
    netCashFlow: number;
  };
}

export function FinancialMetricsGrid({ metrics }: FinancialMetricsGridProps) {
  const financialMetrics: FinancialMetric[] = [
    {
      icon: BadgeDollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      label: "Paid Invoices",
      amount: metrics.paidInvoices,
      link: "/invoices?status=paid"
    },
    {
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      label: "Pending Invoices",
      amount: metrics.pendingInvoices,
      link: "/invoices?status=pending_payment"
    },
    {
      icon: Package,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      label: "Uninvoiced Amount",
      amount: metrics.uninvoicedAmount
    },
    {
      icon: Receipt,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      label: "Total Expenses",
      amount: metrics.totalExpenses,
      link: "/expenses"
    },
    {
      icon: Wallet,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      label: "Net Profit",
      amount: metrics.netProfit,
      textColor: metrics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      label: "Net Cash Flow",
      amount: metrics.netCashFlow,
      textColor: metrics.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {financialMetrics.map((metric, index) => (
        metric.link ? (
          <Link key={index} to={metric.link} className="block transition-transform hover:scale-102 hover:shadow-card-hover">
            <FinancialCard
              icon={metric.icon}
              iconColor={metric.iconColor}
              bgColor={metric.bgColor}
              borderColor={metric.borderColor}
              label={metric.label}
              amount={metric.amount}
              textColor={metric.textColor}
            />
          </Link>
        ) : (
          <FinancialCard
            key={index}
            icon={metric.icon}
            iconColor={metric.iconColor}
            bgColor={metric.bgColor}
            borderColor={metric.borderColor}
            label={metric.label}
            amount={metric.amount}
            textColor={metric.textColor}
          />
        )
      ))}
    </div>
  );
}
