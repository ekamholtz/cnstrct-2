
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientDashboardHeader } from "@/components/client-dashboard/ClientDashboardHeader";
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";

export default function ClientDashboard() {
  return (
    <ClientDashboardLayout>
      <ClientDashboardHeader />
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          <ClientProjectsList />
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
