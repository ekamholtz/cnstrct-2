import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/Header";
import { supabase } from "@/integrations/supabase/client";
import { ProjectHeader } from "@/components/projects/dashboard/ProjectHeader";
import { ProjectOverview } from "@/components/projects/dashboard/ProjectOverview";
import { MilestonesList } from "@/components/projects/dashboard/MilestonesList";

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  
  console.log("Current projectId:", projectId);
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      console.log("Fetching project with ID:", projectId);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching project:", error);
        throw error;
      }
      return data as Project;
    },
    enabled: !!projectId,
  });

  // Fetch milestones with explicit ordering by created_at to maintain chronological order
  const { data: milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      console.log("Fetching milestones for project:", projectId);
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }); // Changed to ascending order
      
      if (error) {
        console.error("Error fetching milestones:", error);
        throw error;
      }
      console.log("Fetched milestones:", data);
      return data;
    },
    enabled: !!projectId,
  });

  if (projectLoading || milestonesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project Not Found</h2>
            <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <ProjectHeader />
        <ProjectOverview 
          name={project.name}
          address={project.address}
          status={project.status}
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Milestones</h2>
          <MilestonesList 
            milestones={milestones}
            onMilestoneComplete={refetchMilestones}
          />
        </div>
      </main>
    </div>
  );
}