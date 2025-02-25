
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  breakdownItems?: {
    label: string;
    value: number;
  }[];
  progress?: number;
  useCircularProgress?: boolean;
}

export function MetricsCard({ 
  icon: Icon, 
  label, 
  value, 
  breakdownItems = [],
  progress = 0,
  useCircularProgress = false,
}: MetricsCardProps) {
  const formattedValue = typeof value === 'number' 
    ? `$${value.toLocaleString()}`
    : value;

  // Colors for the budget visualization
  const colors = {
    gcBudget: '#4F46E5', // Indigo
    otherExpenses: '#EC4899', // Pink
  };

  // Calculate percentages for the pie chart if there are breakdown items
  const total = breakdownItems.reduce((sum, item) => sum + item.value, 0);
  const firstPercentage = total > 0 ? (breakdownItems[0]?.value || 0) / total * 100 : 0;

  // SVG path for the circular visualization
  const createArc = (percentage: number) => {
    const x = Math.cos(2 * Math.PI * percentage / 100);
    const y = Math.sin(2 * Math.PI * percentage / 100);
    return `M 0 -1 A 1 1 0 ${percentage > 50 ? 1 : 0} 1 ${x} ${y} L 0 0`;
  };

  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          {breakdownItems.length > 0 && (
            <div className="space-y-1 border-b border-gray-100 pb-2 mb-2">
              {breakdownItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: index === 0 ? colors.gcBudget : colors.otherExpenses }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: index === 0 ? colors.gcBudget : colors.otherExpenses }}>
                    ${item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-2xl font-bold text-[#172b70]">{formattedValue}</p>
        </div>
        <Icon className="h-5 w-5 text-[#172b70]" />
      </div>

      {/* Budget Breakdown Circle for Total Budget card */}
      {label === "Total Budget" && breakdownItems.length > 0 && (
        <div className="mt-4 flex justify-end mb-4">
          <div className="relative h-16 w-16">
            <svg
              viewBox="-1.1 -1.1 2.2 2.2"
              style={{ transform: 'rotate(-90deg)' }}
              className="w-full h-full"
            >
              {/* Background circle */}
              <circle
                cx="0"
                cy="0"
                r="1"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="0.1"
              />
              {/* First segment (GC Budget) */}
              <path
                d={createArc(firstPercentage)}
                fill="none"
                stroke={colors.gcBudget}
                strokeWidth="0.1"
              />
              {/* Second segment (Other Expenses) */}
              <path
                d={createArc(100)}
                fill="none"
                stroke={colors.otherExpenses}
                strokeWidth="0.1"
              />
            </svg>
          </div>
        </div>
      )}

      {useCircularProgress ? (
        <div className="mt-4 relative h-12 w-12">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#eee"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#19db93"
              strokeWidth="3"
              strokeDasharray={`${progress}, 100`}
            />
          </svg>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium">
            {progress}%
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all"
              style={{ 
                width: `${progress}%`,
                backgroundColor: label === "Total Budget" ? colors.gcBudget : '#19db93'
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
