import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function ProjectDashboard() {
  const { data: projects = [], isLoading: loading, error } = useContractorProjects();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects. Please try again.",
      });
    }
  }, [error, toast]);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
      <p className="text-gray-600">View and manage your construction projects</p>
      <ProjectsList projects={projects} loading={loading} />
    </DashboardLayout>
  );
}
