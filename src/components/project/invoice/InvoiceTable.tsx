
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceTableRow } from "@/components/invoice-dashboard/InvoiceTableRow";
import { Invoice, PaymentFormData } from "./types";

interface InvoiceTableProps {
  invoices: Invoice[];
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => Promise<void>;
}

export function InvoiceTable({ invoices, onMarkAsPaid }: InvoiceTableProps) {
  // Log the invoices data for debugging
  console.log('Invoices data in InvoiceTable:', invoices);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Project/Milestone</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <InvoiceTableRow
              key={invoice.id}
              invoice={invoice}
              onMarkAsPaid={onMarkAsPaid}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
