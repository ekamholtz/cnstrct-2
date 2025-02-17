
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
  return (
    <Card className="p-6 flex items-center space-x-4 w-full h-[100px]">
      <div className={`${bgColor} p-3 rounded-full`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${textColor || iconColor}`}>
          ${amount.toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
