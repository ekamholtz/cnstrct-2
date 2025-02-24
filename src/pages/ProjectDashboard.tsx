import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainNav } from "@/components/navigation/MainNav";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { ProjectMilestones } from "@/components/project/milestone/ProjectMilestones";
import { ProjectExpenses } from "@/components/project/expenses/ProjectExpenses";
import { supabase } from "@/integrations/supabase/client";

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
        .select('*')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'platform_admin';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto mt-16 p-4">
        <ProjectHeader name={data.name} address={data.address} projectId={projectId} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProjectInvoices projectId={projectId} />
          </div>
          <div>
            <ProjectMilestones projectId={projectId} />
            <ProjectExpenses projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
