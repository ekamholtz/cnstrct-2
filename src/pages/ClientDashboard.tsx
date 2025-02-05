
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientDashboardHeader } from "@/components/client-dashboard/ClientDashboardHeader";
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ClientDashboard() {
  return (
    <ClientDashboardLayout>
      <ClientDashboardHeader />
      <div className="space-y-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link to="/client-projects">
              <Button variant="ghost" className="text-sm">
                View All Projects <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ClientProjectsList limit={3} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
          <ClientInvoiceSummary />
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
