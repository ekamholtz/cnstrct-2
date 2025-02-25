
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

  const { data, isLoading, error } = useQuery({
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
            status
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#172b70]"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'platform_admin';
  const isHomeowner = userRole === 'homeowner';

  if (!isAdmin && !data) {
    return <ProjectNotFound />;
  }

  if (error) {
    console.error('Error fetching project:', error);
    return <ProjectNotFound />;
  }

  if (!data) {
    return <ProjectNotFound />;
  }

  const totalBudget = data.milestones?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
  const completedAmount = data.milestones?.reduce((sum, m) => 
    m.status === 'completed' ? sum + (m.amount || 0) : sum, 0) || 0;
  const progressPercentage = calculateProjectCompletion(data.milestones || []);

  return (
    <div className="min-h-screen bg-[#F1F0FB]">
      <MainNav />
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">{data.name}</h1>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{data.address}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsCard
            icon={DollarSign}
            label="Total Budget"
            value={`$${totalBudget.toLocaleString()}`}
          />
          <MetricsCard
            icon={Receipt}
            label="Amount Paid"
            value={`$${completedAmount.toLocaleString()}`}
          />
          <MetricsCard
            icon={Activity}
            label="Progress"
            value={`${progressPercentage}%`}
          />
        </div>

        {/* Milestones Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#172b70]">Project Milestones</h2>
          <HorizontalMilestoneScroll milestones={data.milestones || []} />
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <TabbedContent projectId={projectId} isHomeowner={isHomeowner} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
