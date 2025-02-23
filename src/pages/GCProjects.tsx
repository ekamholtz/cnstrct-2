
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectCreationForm from "@/components/projects/ProjectCreationForm";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";

export default function GCProjects() {
  const { data: projects = [], isLoading: loading, error, refetch } = useContractorProjects();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  
  // Check if user has permission to view contractor projects
  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Redirect if user doesn't have contractor role
    if (profile && profile.role !== 'gc_admin' && !hasPermission('admin.access')) {
      navigate('/client-dashboard');
      return;
    }
  }, [profile, hasPermission, navigate]);

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
      <div className="mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          {profile?.company_name && (
            <p className="text-xl font-bold text-gray-700 mb-2">{profile.company_name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-600 mt-1">View and manage all your construction projects</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill in the project details below to create a new project.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[calc(90vh-180px)] pr-6">
              <div className="pb-6">
                <ProjectCreationForm onSuccess={refetch} />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <ProjectsList projects={projects} loading={loading} />
    </DashboardLayout>
  );
}
