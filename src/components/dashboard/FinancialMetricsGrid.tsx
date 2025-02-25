
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
      bgColor: "bg-green-100",
      label: "Paid Invoices",
      amount: metrics.paidInvoices,
      link: "/invoices?status=paid"
    },
    {
      icon: Clock,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      label: "Pending Invoices",
      amount: metrics.pendingInvoices,
      link: "/invoices?status=pending_payment"
    },
    {
      icon: Package,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Uninvoiced Amount",
      amount: metrics.uninvoicedAmount
    },
    {
      icon: Receipt,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      label: "Total Expenses",
      amount: metrics.totalExpenses,
      link: "/expenses"
    },
    {
      icon: Wallet,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Net Profit",
      amount: metrics.netProfit,
      textColor: metrics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
      label: "Net Cash Flow",
      amount: metrics.netCashFlow,
      textColor: metrics.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {financialMetrics.map((metric, index) => (
        metric.link ? (
          <Link key={index} to={metric.link} className="block">
            <FinancialCard
              icon={metric.icon}
              iconColor={metric.iconColor}
              bgColor={metric.bgColor}
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
            label={metric.label}
            amount={metric.amount}
            textColor={metric.textColor}
          />
        )
      ))}
    </div>
  );
}
