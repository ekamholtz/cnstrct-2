
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
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-2xl font-bold text-[#172b70]">{formattedValue}</p>
        </div>
        <Icon className="h-5 w-5 text-[#172b70]" />
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
              className="h-full bg-[#19db93] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 text-right">
            {progress}% Complete
          </div>
        </div>
      )}
    </Card>
  );
}
