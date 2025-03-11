
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainNav } from "@/components/navigation/MainNav";
import { ProjectNotFound } from "@/components/project/dashboard/ProjectNotFound";
import { LoadingSpinner } from "@/components/project/dashboard/LoadingSpinner";
import { ProjectDashboardContent } from "@/components/project/dashboard/ProjectDashboardContent";
import { useProjectDashboard } from "@/hooks/useProjectDashboard";
import { ClientProject } from "@/types/project-types";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const ProjectDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { 
    project, 
    homeownerExpenses, 
    gcExpenses, 
    userRole, 
    hasAdminRights, 
    isLoading,
    invoices,
    permissionError
  } = useProjectDashboard(projectId);

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <div className="bg-[#172b70] text-white">
          <MainNav />
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Handle case where project is not found or user doesn't have permission
  if (!project || permissionError) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <div className="bg-[#172b70] text-white">
          <MainNav />
        </div>
        <div className="container mx-auto px-4 py-8">
          <ProjectNotFound errorMessage={permissionError || "Project not found or you don't have permission to view it."} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <ErrorBoundary>
        <ProjectDashboardContent
          project={project}
          homeownerExpenses={homeownerExpenses}
          gcExpenses={gcExpenses}
          invoices={invoices || []}
          projectId={projectId || ''}
          userRole={userRole}
        />
      </ErrorBoundary>
    </div>
  );
};

export default ProjectDashboard;
