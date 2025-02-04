import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectStatus } from "@/components/project/ProjectStatus";
import { MilestonesList } from "@/components/project/MilestonesList";
import { markMilestoneComplete, calculateCompletion } from "@/utils/milestoneOperations";

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const { toast } = useToast();
  
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

  const completionPercentage = calculateCompletion(milestones || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <ProjectHeader name={project.name} address={project.address} />
        <div className="mb-8">
          <ProjectStatus status={project.status} completionPercentage={completionPercentage} />
        </div>
        <MilestonesList 
          milestones={milestones || []} 
          onMarkComplete={handleMarkComplete}
        />
      </main>
    </div>
  );
}