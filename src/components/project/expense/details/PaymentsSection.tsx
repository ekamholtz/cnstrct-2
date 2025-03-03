
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Payment } from "../types";
import { Link } from "react-router-dom";

interface PaymentsSectionProps {
  payments: Payment[];
}

export function PaymentsSection({ payments }: PaymentsSectionProps) {
  if (payments.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payments</h2>
        <p className="text-gray-600">No payments have been recorded for this expense.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payments</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr 
                key={payment.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link 
                    to={`/payments/${payment.id}`} 
                    state={{ from: '/expenses' }}
                    className="block"
                  >
                    {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  <Link 
                    to={`/payments/${payment.id}`}
                    state={{ from: '/expenses' }}
                    className="block"
                  >
                    {payment.payment_method_code}
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link 
                    to={`/payments/${payment.id}`}
                    state={{ from: '/expenses' }}
                    className="block"
                  >
                    ${payment.amount.toFixed(2)}
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link 
                    to={`/payments/${payment.id}`}
                    state={{ from: '/expenses' }}
                    className="block"
                  >
                    {payment.notes || "-"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
