
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ClientProjectsPage() {
  return (
    <ClientDashboardLayout>
      <div className="mb-8">
        <Link to="/client-dashboard">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <div className="space-y-8">
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Projects</h1>
          <ClientProjectsList />
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
