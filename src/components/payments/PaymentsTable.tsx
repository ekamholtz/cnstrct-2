
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Payment } from "./types";

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No payments found matching the current filters.</p>
      </div>
    );
  }

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionColor = (direction: Payment['direction']) => {
    return direction === 'incoming' 
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow 
              key={payment.id}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <TableCell>
                <Link 
                  to={`/payments/${payment.id}`}
                  className="block"
                >
                  {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={getDirectionColor(payment.direction)}>
                  {payment.direction === 'incoming' ? 'Received' : 'Sent'}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">
                {payment.payment_method_code}
              </TableCell>
              <TableCell className={payment.direction === 'incoming' ? 'text-green-600' : 'text-orange-600'}>
                ${payment.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.invoice_id ? (
                  <span className="text-blue-600">
                    Invoice #{payment.invoice?.invoice_number}
                  </span>
                ) : (
                  <span className="text-purple-600">
                    Expense: {payment.expense?.name}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-gray-600">
                {payment.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
