
import { Card } from "@/components/ui/card";
import { ArrowRight, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";

interface PendingPaymentsSummaryProps {
  totalPending: number;
}

export function PendingPaymentsSummary({ totalPending }: PendingPaymentsSummaryProps) {
  if (totalPending <= 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No Pending Payments</h3>
              <p className="text-sm text-gray-600">
                You're all caught up! No payments are currently due.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-amber-50 border-amber-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-amber-100">
            <DollarSign className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Pending Payments</h3>
            <p className="text-sm text-gray-600">
              You have <span className="font-medium">{formatCurrency(totalPending)}</span> in pending payments
            </p>
          </div>
        </div>
        <Link 
          to="/invoice" 
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
