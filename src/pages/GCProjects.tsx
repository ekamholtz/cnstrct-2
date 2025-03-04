
import { useToast } from "@/hooks/use-toast";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { MainNav } from "@/components/navigation/MainNav";
import ProjectCreationForm from "@/components/projects/ProjectCreationForm";

export default function GCProjects() {
  const { data: projects = [], isLoading: loading, error, refetch } = useContractorProjects();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

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
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              {profile?.full_name && (
                <p className="text-lg font-medium text-gray-700">Welcome, {profile.full_name}</p>
              )}
              {profile?.company_name && (
                <h1 className="text-2xl font-bold text-[#172b70]">{profile.company_name}</h1>
              )}
              <p className="text-gray-600 mt-1">View and manage all your construction projects</p>
            </div>
            <ProjectCreationForm onSuccess={refetch} />
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm">
          <ProjectsList projects={projects} loading={loading} />
        </div>
      </div>
    </div>
  );
}
