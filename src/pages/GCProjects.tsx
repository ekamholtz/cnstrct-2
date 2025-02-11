
import { useToast } from "@/components/ui/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";

export default function GCProjects() {
  const { data: projects = [], isLoading: loading, error } = useContractorProjects();
  const { toast } = useToast();

  // Show error toast if query fails
  if (error) {
    console.error('Error in GCProjects:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load projects. Please try again.",
    });
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-600">View and manage all your construction projects</p>
        </div>
      </div>
      <ProjectsList projects={projects} loading={loading} />
    </DashboardLayout>
  );
}
