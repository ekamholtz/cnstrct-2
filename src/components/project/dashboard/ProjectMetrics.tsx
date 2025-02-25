
import { DollarSign, Receipt, Activity } from "lucide-react";
import { MetricsCard } from "./MetricsCard";
import { ClientProject } from "@/types/project-types";

interface ProjectMetricsProps {
  project: ClientProject;
  gcBudget: number;
  otherExpenses: number;
  paidToGC: number;
  otherPayments: number;
  totalBudget: number;
  totalPaid: number;
  progressPercentage: number;
  amountProgress: number;
}

export function ProjectMetrics({ 
  gcBudget,
  otherExpenses,
  paidToGC,
  otherPayments,
  totalBudget,
  totalPaid,
  progressPercentage,
  amountProgress
}: ProjectMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricsCard
        icon={DollarSign}
        label="Total Budget"
        value={totalBudget}
        breakdownItems={[
          { label: 'GC Budget', value: gcBudget },
          { label: 'Other Expenses', value: otherExpenses }
        ]}
        progress={amountProgress}
      />
      <MetricsCard
        icon={Receipt}
        label="Amount Paid"
        value={totalPaid}
        breakdownItems={[
          { label: 'Paid to GC', value: paidToGC },
          { label: 'Other Payments', value: otherPayments }
        ]}
        progress={amountProgress}
      />
      <MetricsCard
        icon={Activity}
        label="Progress"
        value={`${progressPercentage}%`}
        progress={progressPercentage}
        useCircularProgress
      />
    </div>
  );
}
