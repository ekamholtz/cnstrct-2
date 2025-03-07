
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
  border?: string;
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
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      label: "PAID INVOICES",
      amount: metrics.paidInvoices,
      link: "/invoices?status=paid",
      border: "border-emerald-100"
    },
    {
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      label: "PENDING INVOICES",
      amount: metrics.pendingInvoices,
      link: "/invoices?status=pending_payment",
      border: "border-amber-100"
    },
    {
      icon: Package,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      label: "UNINVOICED AMOUNT",
      amount: metrics.uninvoicedAmount,
      border: "border-violet-100"
    },
    {
      icon: Receipt,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      label: "TOTAL EXPENSES",
      amount: metrics.totalExpenses,
      link: "/expenses",
      border: "border-red-100"
    },
    {
      icon: Wallet,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      label: "NET PROFIT",
      amount: metrics.netProfit,
      textColor: metrics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600',
      border: "border-blue-100"
    },
    {
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      label: "NET CASH FLOW",
      amount: metrics.netCashFlow,
      textColor: metrics.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600',
      border: "border-emerald-100"
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
              border={metric.border}
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
            border={metric.border}
          />
        )
      ))}
    </div>
  );
}
