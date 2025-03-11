
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Invoice } from "@/components/project/invoice/types";

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Invoice #{invoice.invoice_number}</div>
              <div className="text-sm text-gray-500">
                {invoice.project_name} - {invoice.milestone_name}
              </div>
              <div className="text-sm text-gray-500">
                Created {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="font-bold text-lg">${invoice.amount.toLocaleString()}</div>
              <Badge
                className={
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'pending_payment'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {invoice.status === 'pending_payment' ? 'Pending' : invoice.status}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
