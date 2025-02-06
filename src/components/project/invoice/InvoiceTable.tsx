
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { PaymentModal } from "./PaymentModal";
import { StatusBadge } from "./StatusBadge";
import { InvoiceTableProps } from "./types";

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
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{invoice.project_name}</span>
                  <span className="text-sm text-gray-500">{invoice.milestone_name}</span>
                </div>
              </TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <StatusBadge status={invoice.status} />
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
