import { DollarSign } from "lucide-react";
import { InvoiceTable } from "./invoice/InvoiceTable";
import { useInvoices } from "./invoice/hooks/useInvoices";
import { PaymentFormData } from "./invoice/types";

interface ProjectInvoicesProps {
  projectId: string;
}

export function ProjectInvoices({ projectId }: ProjectInvoicesProps) {
  const { invoices, isLoading, markAsPaid } = useInvoices(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleMarkAsPaid = async (invoiceId: string, data: PaymentFormData) => {
    await markAsPaid({ invoiceId, ...data });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Project Invoices</h2>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span className="text-lg font-medium">
            Total: ${invoices?.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
          </span>
        </div>
      </div>

      <InvoiceTable 
        invoices={invoices || []} 
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
}