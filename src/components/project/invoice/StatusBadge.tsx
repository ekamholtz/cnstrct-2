import { CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending_payment" | "paid" | "cancelled";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className="flex items-center">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'paid'
            ? 'bg-green-100 text-green-800'
            : status === 'cancelled'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {status === 'paid' && (
          <CheckCircle className="h-3 w-3 mr-1" />
        )}
        {status === 'paid'
          ? 'Paid'
          : status === 'cancelled'
          ? 'Cancelled'
          : 'Pending Payment'}
      </span>
    </div>
  );
}