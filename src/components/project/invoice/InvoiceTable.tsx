
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceTableProps } from "./types";
import { InvoiceTableRow } from "@/components/invoice-dashboard/InvoiceTableRow";

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
            <InvoiceTableRow 
              key={invoice.id} 
              invoice={invoice} 
              onMarkAsPaid={async (invoiceId, data) => {
                await onMarkAsPaid(invoiceId, data);
              }}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
