
import { Card, CardContent } from "@/components/ui/card";

interface PendingPaymentsSummaryProps {
  totalPending: number;
}

export function PendingPaymentsSummary({ totalPending }: PendingPaymentsSummaryProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Pending Payments</h3>
            <p className="text-sm text-gray-500">Due invoices requiring your attention</p>
          </div>
          <div className="text-2xl font-bold">
            ${totalPending.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
