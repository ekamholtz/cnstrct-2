
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  label: string;
  amount: number;
  textColor?: string;
  border?: string;
}

export function FinancialCard({ 
  icon: Icon, 
  iconColor, 
  bgColor, 
  label, 
  amount,
  textColor,
  border = "border-gray-100"
}: FinancialCardProps) {
  const isPositive = amount >= 0;
  
  return (
    <Card className={`p-5 bg-white hover:shadow-md transition-all duration-300 ease-in-out ${border} border rounded-lg group h-full`}>
      <div className="flex items-center justify-between">
        <div className={`${bgColor} p-2 rounded-lg transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
      <div className="mt-4">
        <p className={`text-2xl font-bold flex items-center ${textColor || (isPositive ? iconColor : 'text-red-600')}`}>
          <span className="transition-all duration-300 ease-out group-hover:scale-105">
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
