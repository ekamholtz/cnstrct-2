
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { FileText, DollarSign } from "lucide-react";
import { PaymentModal } from "@/components/project/invoice/PaymentModal";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { PaymentFormData, Invoice } from "@/components/project/invoice/types";

interface InvoiceTableRowProps {
  invoice: Invoice;
  onMarkAsPaid: (invoiceId: string, data: PaymentFormData) => Promise<void>;
}

export const InvoiceTableRow = ({ invoice, onMarkAsPaid }: InvoiceTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          {invoice.invoice_number}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{invoice.project_name}</span>
          <span className="text-sm text-gray-500">{invoice.milestone_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
          {invoice.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={invoice.status} />
      </TableCell>
      <TableCell>
        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        <PaymentModal
          invoice={invoice}
          onSubmit={(data) => onMarkAsPaid(invoice.id, data)}
        />
      </TableCell>
    </TableRow>
  );
};
