
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Invoice } from "./types";
import { PaymentModal } from "./PaymentModal";
import { PaymentSimulationModal } from "./PaymentSimulationModal";

interface InvoiceInformationCardProps {
  invoice: Invoice;
  isClient: boolean;
}

export function InvoiceInformationCard({ invoice, isClient }: InvoiceInformationCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoice Information</CardTitle>
        {invoice.status === 'pending_payment' && (
          <div>
            {isClient ? (
              <PaymentSimulationModal
                invoice={invoice}
                onPaymentComplete={() => {
                  window.location.reload();
                }}
              />
            ) : (
              <PaymentModal
                invoice={invoice}
                onSubmit={async (data) => {
                  console.log('Payment marked:', data);
                  window.location.reload();
                }}
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-500">Status</h3>
            <StatusBadge status={invoice.status} />
          </div>
          <div>
            <h3 className="font-medium text-gray-500">Amount</h3>
            <p className="text-lg font-semibold">${invoice.amount.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-500">Project</h3>
            <p>{invoice.project_name}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-500">Milestone</h3>
            <p>{invoice.milestone_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-500">Created Date</h3>
            <p>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
