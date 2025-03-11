
interface PendingPaymentsSummaryProps {
  totalPending: number;
}

export function PendingPaymentsSummary({ totalPending }: PendingPaymentsSummaryProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium text-blue-700">Pending Payments</h3>
        <p className="text-sm text-blue-600">Invoices awaiting payment</p>
      </div>
      <div className="text-2xl font-bold text-blue-700">${totalPending.toLocaleString()}</div>
    </div>
  );
}
