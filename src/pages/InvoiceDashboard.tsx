import { Header } from "@/components/landing/Header";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { InvoiceFilters } from "@/components/invoice-dashboard/InvoiceFilters";
import { InvoiceTable } from "@/components/invoice-dashboard/InvoiceTable";
import { useInvoiceDashboard } from "@/hooks/useInvoiceDashboard";

export default function InvoiceDashboard() {
  const {
    invoices,
    loading,
    statusFilter,
    setStatusFilter,
    handleMarkAsPaid,
  } = useInvoiceDashboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <InvoiceFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <InvoiceTable
          invoices={invoices}
          loading={loading}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </main>
    </div>
  );
}