
import { useClientInvoices } from "./hooks/useClientInvoices";
import { PendingPaymentsSummary } from "./components/PendingPaymentsSummary";
import { InvoiceList } from "./components/InvoiceList";

export function ClientInvoiceSummary() {
  const { data: invoiceData, isLoading } = useClientInvoices();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { invoices = [], totalPending = 0 } = invoiceData || {};

  return (
    <div className="space-y-4">
      <PendingPaymentsSummary totalPending={totalPending} />
      <InvoiceList invoices={invoices} />
    </div>
  );
}
