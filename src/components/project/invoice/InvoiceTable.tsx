import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { Invoice } from "./types";

interface InvoiceTableProps {
  invoices: Invoice[];
  onMarkAsPaid: (invoiceId: string, data: { payment_method: string; payment_date: Date }) => void;
}

export function InvoiceTable({ invoices, onMarkAsPaid }: InvoiceTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Milestone</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices?.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.milestone.name}</TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {invoice.status === 'paid' && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {invoice.status === 'paid'
                      ? 'Paid'
                      : invoice.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Pending Payment'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <PaymentModal
                  invoice={invoice}
                  onSubmit={(data) => onMarkAsPaid(invoice.id, data)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}