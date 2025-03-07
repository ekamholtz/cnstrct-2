
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  label: string;
  amount: number;
  textColor?: string;
}

export function FinancialCard({ 
  icon: Icon, 
  iconColor, 
  bgColor, 
  label, 
  amount,
  textColor
}: FinancialCardProps) {
  const isPositive = amount >= 0;
  
  return (
    <Card className="p-6 flex items-center space-x-4 w-full h-[110px] hover:shadow-premium-lg transition-all duration-300 ease-in-out border border-gray-100">
      <div className={`${bgColor} p-3 rounded-full`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold flex items-center ${textColor || iconColor}`}>
          <span className="transition-all duration-300 ease-out hover:scale-105">
            ${Math.abs(amount).toLocaleString()}
          </span>
          {amount !== 0 && !isPositive && (
            <span className="text-xs ml-1 text-red-500 font-normal">
              (Negative)
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
