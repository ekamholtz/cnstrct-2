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

  // SVG paths for pie chart segments
  const createPieSlice = (startAngle: number, endAngle: number) => {
    // Convert angles to radians
    const start = (startAngle - 90) * Math.PI / 180;
    const end = (endAngle - 90) * Math.PI / 180;
    
    // Calculate points
    const startX = Math.cos(start);
    const startY = Math.sin(start);
    const endX = Math.cos(end);
    const endY = Math.sin(end);
    
    // Determine which arc to use
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} Z`;
  };

  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#172b70]">{formattedValue}</p>
        </div>
        <Icon className="h-5 w-5 text-[#172b70]" />
      </div>

      <div className="flex items-center justify-between">
        {/* Budget Breakdown Text */}
        {breakdownItems.length > 0 && (
          <div className="space-y-1">
            {breakdownItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: index === 0 ? colors.gcBudget : colors.otherExpenses }}>
                  {item.label}
                </span>
                <span className="text-sm font-medium ml-4" style={{ color: index === 0 ? colors.gcBudget : colors.otherExpenses }}>
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Budget Breakdown Pie Chart for Total Budget card */}
        {label === "Total Budget" && breakdownItems.length > 0 && (
          <div className="relative h-14 w-14 ml-4">
            <svg viewBox="-1 -1 2 2" className="w-full h-full">
              {/* GC Budget Slice */}
              <path
                d={createPieSlice(0, firstPercentage * 3.6)}
                fill={colors.gcBudget}
              />
              {/* Other Expenses Slice */}
              <path
                d={createPieSlice(firstPercentage * 3.6, 360)}
                fill={colors.otherExpenses}
              />
            </svg>
          </div>
        )}
      </div>

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
