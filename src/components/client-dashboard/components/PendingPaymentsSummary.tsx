
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface PendingPaymentsSummaryProps {
  totalPending: number;
}

export function PendingPaymentsSummary({ totalPending }: PendingPaymentsSummaryProps) {
  return (
    <Link to="/invoices" className="block">
      <Card className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Pending Payments</span>
            </div>
            <span className="text-lg font-semibold text-yellow-800">
              ${totalPending.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
