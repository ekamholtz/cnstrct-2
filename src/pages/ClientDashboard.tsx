
import { ClientProjectsList } from "@/components/client-dashboard/ClientProjectsList";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";
import { MainNav } from "@/components/navigation/MainNav";
import { DollarSign, Receipt, Activity, MapPin } from "lucide-react";
import { MetricsCard } from "@/components/project/dashboard/MetricsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ClientDashboard() {
  const { data: clientData } = useQuery({
    queryKey: ['client-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get client details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Get client's projects with their milestones and invoices
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            amount,
            status
          ),
          invoices (
            id,
            amount,
            status
          )
        `);

      return {
        profile: profileData,
        projects: projects || []
      };
    }
  });

  // Calculate metrics
  const totalBudget = clientData?.projects?.reduce((sum, project) => 
    sum + (project.milestones?.reduce((mSum, m) => mSum + (m.amount || 0), 0) || 0), 0) || 0;

  const totalPaid = clientData?.projects?.reduce((sum, project) => 
    sum + (project.invoices?.reduce((iSum, inv) => 
      inv.status === 'paid' ? iSum + (inv.amount || 0) : iSum, 0) || 0), 0) || 0;

  const totalPending = totalBudget - totalPaid;
  const progressPercentage = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsCard
            icon={DollarSign}
            label="Total Budget"
            value={totalBudget}
            breakdownItems={[
              { label: 'Paid', value: totalPaid },
              { label: 'Pending', value: totalPending }
            ]}
            progress={(totalPaid / totalBudget) * 100}
          />
          <MetricsCard
            icon={Receipt}
            label="Amount Paid"
            value={totalPaid}
            breakdownItems={[
              { label: 'To Pay', value: totalPending }
            ]}
            progress={(totalPaid / totalBudget) * 100}
          />
          <MetricsCard
            icon={Activity}
            label="Progress"
            value={`${progressPercentage}%`}
            progress={progressPercentage}
            useCircularProgress
          />
        </div>

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
