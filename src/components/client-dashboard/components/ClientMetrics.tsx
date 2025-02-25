
import { DollarSign, Receipt, Activity } from "lucide-react";
import { MetricsCard } from "@/components/project/dashboard/MetricsCard";

interface ClientMetricsProps {
  totalBudget: number;
  totalPaid: number;
  totalPending: number;
  progressPercentage: number;
}

export function ClientMetrics({ 
  totalBudget, 
  totalPaid, 
  totalPending, 
  progressPercentage 
}: ClientMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricsCard
        icon={DollarSign}
        label="Total Budget"
        value={totalBudget}
        breakdownItems={[
          { label: 'Paid', value: totalPaid },
          { label: 'Pending', value: totalPending }
        ]}
        progress={(totalPaid / totalBudget) * 100}
      />
      <MetricsCard
        icon={Receipt}
        label="Amount Paid"
        value={totalPaid}
        breakdownItems={[
          { label: 'To Pay', value: totalPending }
        ]}
        progress={(totalPaid / totalBudget) * 100}
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
