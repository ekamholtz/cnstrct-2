
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function GCProjects() {
  const { data: projects = [], isLoading: loading, error } = useContractorProjects();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Handle error with useEffect to avoid render issues
  useEffect(() => {
    if (error) {
      console.error('Error in GCProjects:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects. Please try again.",
      });
    }
  }, [error, toast]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          {profile?.company_name && (
            <p className="text-lg text-gray-600 mt-1">{profile.company_name}</p>
          )}
          <p className="text-gray-600 mt-1">View and manage all your construction projects</p>
        </div>
      </div>
      <ProjectsList projects={projects} loading={loading} />
    </DashboardLayout>
  );
}
