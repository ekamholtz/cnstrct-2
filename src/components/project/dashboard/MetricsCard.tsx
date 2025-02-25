
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  progress?: number;
  useCircularProgress?: boolean;
  sublabel?: string;
}

export function MetricsCard({ 
  icon: Icon, 
  label, 
  value, 
  progress = 0,
  useCircularProgress = false,
  sublabel 
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
          <p className="text-2xl font-bold text-[#172b70]">{formattedValue}</p>
          {sublabel && (
            <p className="text-sm text-gray-500">{sublabel}</p>
          )}
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
          <Progress 
            value={progress} 
            className="h-2 bg-gray-100" 
            indicatorClassName="bg-[#19db93]"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {progress}% Complete
          </div>
        </div>
      )}
    </Card>
  );
}
