
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainNav } from "@/components/navigation/MainNav";
import { AdminNav } from "@/components/admin/AdminNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/project/dashboard/LoadingState";
import { ProjectNotFound } from "@/components/project/dashboard/ProjectNotFound";
import { ProjectContent } from "@/components/project/dashboard/ProjectContent";
import { markMilestoneComplete, calculateCompletion } from "@/utils/milestoneOperations";

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  contractor_id: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const { toast } = useToast();
  
  // Get current user's role
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Determine the dashboard route based on user role
  const dashboardRoute = userProfile?.role === 'admin' ? '/admin' : 
                        userProfile?.role === 'homeowner' ? '/client-dashboard' : 
                        '/dashboard';

  const isAdmin = userProfile?.role === 'admin';
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project;
    },
  });

  // Get current user to check if they are the contractor
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleMarkComplete = async (milestoneId: string) => {
    try {
      const invoice = await markMilestoneComplete(milestoneId);
      
      toast({
        title: "Success",
        description: `Milestone marked as complete and invoice #${invoice.invoice_number} has been generated.`,
      });

      refetchMilestones();
    } catch (error) {
      console.error('Error in handleMarkComplete:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone status and generate invoice.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin ? <AdminNav /> : <MainNav />}
      <main>
        {projectLoading || milestonesLoading ? (
          <LoadingState dashboardRoute={dashboardRoute} isAdmin={isAdmin} />
        ) : !project ? (
          <ProjectNotFound dashboardRoute={dashboardRoute} />
        ) : (
          <ProjectContent
            project={project}
            dashboardRoute={dashboardRoute}
            isAdmin={isAdmin}
            isContractor={currentUser?.id === project.contractor_id}
            completionPercentage={calculateCompletion(milestones || [])}
            milestones={milestones || []}
            onMarkComplete={handleMarkComplete}
          />
        )}
      </main>
    </div>
  );
}
