
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";

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
      <ClientPageHeader 
        pageTitle="Projects"
        pageDescription="View and manage all your construction projects"
      />
      <div className="space-y-8">
        <section>
          <ClientProjectsList />
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
