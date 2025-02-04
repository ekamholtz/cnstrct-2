import { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ProjectsList } from "@/components/dashboard/ProjectsList";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        console.error("No user found");
        return;
      }

      console.log("Fetching projects for contractor ID:", user.id);
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', user.id);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }
      
      console.log("Projects fetched:", projectsData);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16">
        <DashboardHeader onProjectCreated={fetchProjects} />
        <StatsOverview projects={projects} />
        <ProjectsList projects={projects} loading={loading} />
      </main>
    </div>
  );
}