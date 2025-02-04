import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceTableRow } from "./InvoiceTableRow";
import { PaymentFormData } from "@/components/project/invoice/types";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone: {
    name: string;
    project: {
      name: string;
    };
  };
}

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => Promise<void>;
}

export const InvoiceTable = ({ invoices, loading, onMarkAsPaid }: InvoiceTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow">
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
    </div>
  );
};