
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ContractorFinancialSummary } from "@/components/dashboard/ContractorFinancialSummary";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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

      console.log("Current user ID:", user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      console.log("Fetching projects for profile ID:", profile.id);
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

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
    <DashboardLayout>
      <DashboardHeader onProjectCreated={fetchProjects} />
      <ContractorFinancialSummary />
      <ProjectsList projects={projects} loading={loading} />
    </DashboardLayout>
  );
}
