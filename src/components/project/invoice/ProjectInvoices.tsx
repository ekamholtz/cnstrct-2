
import { DollarSign } from "lucide-react";
import { InvoiceTable } from "./InvoiceTable";
import { useInvoices } from "./hooks/useInvoices";
import { PaymentFormData } from "./types";
import { Progress } from "@/components/ui/progress";

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

  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === "paid").length || 0;
  const progressPercentage = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
  
  const totalAmount = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const pendingAmount = invoices?.reduce((sum, inv) => 
    inv.status === "pending_payment" ? sum + inv.amount : sum, 0) || 0;

  const handleMarkAsPaid = async (invoiceId: string, data: PaymentFormData) => {
    await markAsPaid({ invoiceId, ...data });
  };

  return (
    <div className="space-y-6 px-6 pb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Project Invoices</h2>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium text-orange-600">
              Pending: ${pendingAmount.toLocaleString()}
            </span>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-medium">
                Total: ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Progress</span>
            <span>{paidInvoices} of {totalInvoices} invoices paid</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-yellow-100 [&>div]:bg-green-500" 
          />
        </div>
      </div>

      <InvoiceTable 
        invoices={invoices || []} 
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
}
