
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

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No payments found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Contact Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow 
              key={payment.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <TableCell>
                <Link 
                  to={`/payments/${payment.id}`}
                  state={{ from: '/payments' }}
                  className="block"
                >
                  {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                </Link>
              </TableCell>
              <TableCell className="capitalize">
                <Link 
                  to={`/payments/${payment.id}`}
                  state={{ from: '/payments' }}
                  className="block"
                >
                  {payment.payment_type}
                </Link>
              </TableCell>
              <TableCell>
                <Link 
                  to={`/payments/${payment.id}`}
                  state={{ from: '/payments' }}
                  className="block"
                >
                  ${payment.payment_amount.toFixed(2)}
                </Link>
              </TableCell>
              <TableCell>
                <Link 
                  to={`/payments/${payment.id}`}
                  state={{ from: '/payments' }}
                  className="block"
                >
                  {payment.expense.project.name}
                </Link>
              </TableCell>
              <TableCell>
                <Link 
                  to={`/payments/${payment.id}`}
                  state={{ from: '/payments' }}
                  className="block"
                >
                  {payment.vendor_email && (
                    <div>Email: {payment.vendor_email}</div>
                  )}
                  {payment.vendor_phone && (
                    <div>Phone: {payment.vendor_phone}</div>
                  )}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
