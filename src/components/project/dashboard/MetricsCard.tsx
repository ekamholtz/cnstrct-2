
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
}

export function MetricsCard({ icon: Icon, label, value, sublabel }: MetricsCardProps) {
  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-[#172b70]">{value}</p>
          {sublabel && (
            <p className="text-sm text-gray-500">{sublabel}</p>
          )}
        </div>
        <Icon className="h-5 w-5 text-[#172b70]" />
      </div>
    </Card>
  );
}
