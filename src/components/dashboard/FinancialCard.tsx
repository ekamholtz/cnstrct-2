import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  label: string;
  amount: number;
  textColor?: string;
  borderColor?: string;
}

export function FinancialCard({ 
  icon: Icon, 
  iconColor, 
  bgColor, 
  label, 
  amount,
  textColor,
  borderColor
}: FinancialCardProps) {
  return (
    <Card className={`p-4 w-full h-full border ${borderColor || 'border-gray-200'} rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className={`${bgColor} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <div>
          <p className={`text-xl font-bold ${textColor || iconColor}`}>
            ${amount.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
