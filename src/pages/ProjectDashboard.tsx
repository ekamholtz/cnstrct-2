
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainNav } from "@/components/navigation/MainNav";
import { supabase } from "@/integrations/supabase/client";
import { TabbedContent } from "@/components/project/dashboard/TabbedContent";
import { GCTabbedContent } from "@/components/project/dashboard/GCTabbedContent";
import { calculateProjectCompletion } from "@/utils/project-calculations";
import { ProjectHeader } from "@/components/project/dashboard/ProjectHeader";
import { ProjectMetrics } from "@/components/project/dashboard/ProjectMetrics";
import { ProjectMilestones } from "@/components/project/dashboard/ProjectMilestones";

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
  const isGC = userRole === 'gc_admin';

  if (!isAdmin && !project) {
    return <ProjectNotFound />;
  }

  if (!project) {
    return <ProjectNotFound />;
  }

  // Calculate metrics
  const gcBudget = project.milestones?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
  const otherExpenses = homeownerExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const totalBudget = gcBudget + otherExpenses;
  const paidToGC = project.invoices
    ?.filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const otherPayments = homeownerExpenses
    ?.filter(e => e.payment_status === 'paid')
    .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const totalPaid = paidToGC + otherPayments;
  const progressPercentage = calculateProjectCompletion(project.milestones || []);
  const amountProgress = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        <ProjectHeader project={project} />
        <ProjectMetrics 
          project={project}
          gcBudget={gcBudget}
          otherExpenses={otherExpenses}
          paidToGC={paidToGC}
          otherPayments={otherPayments}
          totalBudget={totalBudget}
          totalPaid={totalPaid}
          progressPercentage={progressPercentage}
          amountProgress={amountProgress}
        />
        <ProjectMilestones milestones={project.milestones || []} />
        <div className="bg-white rounded-lg shadow-sm mt-8">
          {isHomeowner ? (
            <TabbedContent projectId={projectId} isHomeowner={isHomeowner} />
          ) : isGC || isAdmin ? (
            <GCTabbedContent projectId={projectId} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
