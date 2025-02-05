
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";

export default function ClientProjectsPage() {
  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Projects</h1>
          <ClientProjectsList />
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
