
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceTableRow } from "./InvoiceTableRow";
import { Invoice, PaymentFormData } from "@/components/project/invoice/types";
import { Card } from "@/components/ui/card";

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => Promise<void>;
}

export const InvoiceTable = ({ invoices, loading, onMarkAsPaid }: InvoiceTableProps) => {
  return (
    <Card className="mt-6">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Project & Milestone</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Loading invoices...
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                onMarkAsPaid={onMarkAsPaid}
              />
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
