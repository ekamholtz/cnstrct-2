
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  // Updated colors for the budget and payment visualizations - using brand colors
  const colors = {
    primary: '#172b70',    // Navy blue (brand primary)
    secondary: '#4A5CCC',  // Lighter blue
    gradient: 'linear-gradient(135deg, #172b70 0%, #4A5CCC 100%)',
  };

  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-100 rounded-lg group">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          {/* Only show the value if it's not a circular progress card */}
          {!useCircularProgress && (
            <p className="text-2xl font-bold text-cnstrct-navy group-hover:scale-105 transition-transform duration-300">
              {formattedValue}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-5 w-5" />
        </div>
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
          <div className="relative h-24 w-24 transition-transform duration-300 group-hover:scale-105">
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
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
                className="transition-all duration-1000 ease-in-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#172b70" />
                  <stop offset="100%" stopColor="#4A5CCC" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-medium text-cnstrct-navy">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-in-out"
                style={{ 
                  width: `${progress}%`,
                  background: colors.gradient
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
