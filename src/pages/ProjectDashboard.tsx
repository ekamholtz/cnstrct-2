
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Receipt, Activity, MapPin } from "lucide-react";
import { MainNav } from "@/components/navigation/MainNav";
import { supabase } from "@/integrations/supabase/client";
import { MetricsCard } from "@/components/project/dashboard/MetricsCard";
import { HorizontalMilestoneScroll } from "@/components/project/dashboard/HorizontalMilestoneScroll";
import { TabbedContent } from "@/components/project/dashboard/TabbedContent";
import { calculateProjectCompletion } from "@/utils/project-calculations";

const ProjectNotFound = () => (
  <div className="flex justify-center items-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-semibold">Project Not Found</h2>
      <p className="text-gray-600">The project you are looking for does not exist or you do not have permission to view it.</p>
    </div>
  </div>
);

const ProjectDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return null;
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            name,
            description,
            amount,
            status,
            project_id,
            created_at,
            updated_at
          ),
          invoices (
            id,
            amount,
            status,
            payment_date
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: homeownerExpenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homeowner_expenses')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return data?.role;
    }
  });

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  if (isProjectLoading || isExpensesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#172b70]"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'platform_admin';
  const isHomeowner = userRole === 'homeowner';

  if (!isAdmin && !project) {
    return <ProjectNotFound />;
  }

  if (!project) {
    return <ProjectNotFound />;
  }

  // Calculate GC budget (Total Contract Value)
  const gcBudget = project.milestones?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
  
  // Calculate Other Expenses (Total Homeowner Expenses)
  const otherExpenses = homeownerExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  
  // Calculate Total Budget
  const totalBudget = gcBudget + otherExpenses;

  // Calculate Paid to GC
  const paidToGC = project.invoices
    ?.filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

  // Calculate Other Payments
  const otherPayments = homeownerExpenses
    ?.filter(e => e.payment_status === 'paid')
    .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  // Calculate Total Amount Paid
  const totalPaid = paidToGC + otherPayments;

  // Calculate progress percentages
  const progressPercentage = calculateProjectCompletion(project.milestones || []);
  const amountProgress = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">{project.name}</h1>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{project.address}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsCard
            icon={DollarSign}
            label="Total Budget"
            value={totalBudget}
            breakdownItems={[
              { label: 'GC Budget', value: gcBudget },
              { label: 'Other Expenses', value: otherExpenses }
            ]}
            progress={amountProgress}
          />
          <MetricsCard
            icon={Receipt}
            label="Amount Paid"
            value={totalPaid}
            breakdownItems={[
              { label: 'Paid to GC', value: paidToGC },
              { label: 'Other Payments', value: otherPayments }
            ]}
            progress={amountProgress}
          />
          <MetricsCard
            icon={Activity}
            label="Progress"
            value={`${progressPercentage}%`}
            progress={progressPercentage}
            useCircularProgress
          />
        </div>

        {/* Milestones Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#172b70]">Project Milestones</h2>
          <HorizontalMilestoneScroll milestones={project.milestones || []} />
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-lg shadow-sm mt-8">
          <TabbedContent projectId={projectId} isHomeowner={isHomeowner} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
