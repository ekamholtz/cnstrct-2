
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Invoice } from "@/components/project/invoice/types";

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  // Add debug logging
  console.log('InvoiceList received invoices:', invoices);

  if (!invoices || invoices.length === 0) {
    // Add debug logging for empty state
    console.log('No invoices found, invoices array:', invoices);
    return (
      <div className="p-4 text-center text-gray-500">
        No invoices found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border divide-y">
      {invoices.map((invoice) => {
        // Add debug logging for each invoice
        console.log('Rendering invoice:', invoice);
        return (
          <Link
            key={invoice.id}
            to={`/project/${invoice.project_id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <div className="font-medium text-gray-900">
                  {invoice.project_name}
                </div>
                <div className="text-sm text-gray-500">
                  {invoice.milestone_name}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-medium">
                  ${Number(invoice.amount).toLocaleString()}
                </div>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
