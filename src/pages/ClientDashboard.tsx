
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";
import { MainNav } from "@/components/navigation/MainNav";
import { ClientMetrics } from "@/components/client-dashboard/components/ClientMetrics";
import { useClientMetrics } from "@/components/client-dashboard/hooks/useClientMetrics";
import { calculateClientMetrics } from "@/components/client-dashboard/utils/calculations";

export default function ClientDashboard() {
  const { data: clientData } = useClientMetrics();
  const metrics = calculateClientMetrics(clientData?.projects);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">
            {clientData?.profile?.full_name}'s Dashboard
          </h1>
          <div className="flex items-center text-gray-600">
            <span>View and manage your construction projects</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <ClientMetrics {...metrics} />

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#172b70]">Recent Projects</h2>
          </div>
          <ClientProjectsList limit={3} />
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#172b70] mb-6">Payment Summary</h2>
          <ClientInvoiceSummary />
        </div>
      </div>
    </div>
  );
}
