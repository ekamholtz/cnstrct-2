
import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainNav } from "@/components/navigation/MainNav";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { MilestonesList } from "@/components/project/MilestonesList";
import { supabase } from "@/integrations/supabase/client";
import { HomeownerExpenses } from "@/components/homeowner/expenses/HomeownerExpenses";
import { Card, CardContent } from "@/components/ui/card";

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

  return (
    <div className="min-h-screen bg-[#F1F0FB]">
      <MainNav />
      <div className="container mx-auto mt-16 p-8">
        <ProjectHeader name={data.name} address={data.address} projectId={projectId} />
        
        <div className="grid gap-8 mt-8">
          {/* Milestones Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#403E43]">Project Milestones</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <MilestonesList 
                milestones={data.milestones || []} 
                onMarkComplete={(id) => console.log('Mark complete:', id)} 
              />
            </div>
          </section>

          {/* Invoices Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#403E43]">Invoices</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ProjectInvoices projectId={projectId} />
            </div>
          </section>

          {/* Homeowner Expenses Section */}
          {isHomeowner && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#403E43]">My Expenses</h2>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <HomeownerExpenses projectId={projectId} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
