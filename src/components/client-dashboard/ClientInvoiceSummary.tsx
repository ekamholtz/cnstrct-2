
import { useClientInvoices } from "./hooks/useClientInvoices";
import { PendingPaymentsSummary } from "./components/PendingPaymentsSummary";
import { InvoiceList } from "./components/InvoiceList";

export function ClientInvoiceSummary() {
  const { data: invoiceData, isLoading, error } = useClientInvoices();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Failed to load invoice data. Please try again later.
      </div>
    );
  }

  // Safely access data with defaults
  const { invoices = [], totalPending = 0 } = invoiceData || {};

  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <PendingPaymentsSummary totalPending={0} />
        <div className="text-gray-500 p-4 text-center">
          No invoices found. When your contractor creates invoices, they will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PendingPaymentsSummary totalPending={totalPending} />
      <div>
        <h3 className="text-lg font-medium mb-4">Recent Invoices</h3>
        <InvoiceList invoices={invoices} />
      </div>
    </div>
  );
}
