
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

  // Colors for the budget and payment visualizations - using brand colors
  const colors = {
    primary: '#172b70',    // Navy blue (brand primary)
    secondary: '#4A5CCC',  // Lighter blue
  };

  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
        </div>
        <Icon className="h-5 w-5 text-[#172b70]" />
      </div>

      {/* Budget/Payment Breakdown Text */}
      {breakdownItems.length > 0 && (
        <div className="space-y-1 mb-4">
          {breakdownItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: index === 0 ? colors.primary : colors.secondary }}>
                {item.label}
              </span>
              <span className="text-sm font-medium" style={{ color: index === 0 ? colors.primary : colors.secondary }}>
                ${item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {useCircularProgress ? (
        <div className="flex justify-center mt-6">
          <div className="relative h-24 w-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
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
                stroke={colors.primary}
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-medium text-[#172b70]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: colors.primary
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
