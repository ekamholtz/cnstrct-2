import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { InvoiceFilters } from "@/components/invoice-dashboard/InvoiceFilters";
import { InvoiceTable } from "@/components/invoice-dashboard/InvoiceTable";
import { useInvoiceDashboard } from "@/hooks/useInvoiceDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function InvoiceDashboard() {
  const {
    invoices,
    loading,
    statusFilter,
    setStatusFilter,
    handleMarkAsPaid,
  } = useInvoiceDashboard();

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}