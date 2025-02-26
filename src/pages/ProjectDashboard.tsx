
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainNav } from "@/components/navigation/MainNav";
import { ProjectNotFound } from "@/components/project/dashboard/ProjectNotFound";
import { LoadingSpinner } from "@/components/project/dashboard/LoadingSpinner";
import { ProjectDashboardContent } from "@/components/project/dashboard/ProjectDashboardContent";
import { useProjectDashboard } from "@/hooks/useProjectDashboard";

const ProjectDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, homeownerExpenses, gcExpenses, userRole, isLoading } = useProjectDashboard(projectId);

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isAdmin = userRole === 'platform_admin';
  if (!isAdmin && !project) {
    return <ProjectNotFound />;
  }

  if (!project) {
    return <ProjectNotFound />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <ProjectDashboardContent
        project={project}
        homeownerExpenses={homeownerExpenses || []}
        gcExpenses={gcExpenses || []}
        projectId={projectId}
        userRole={userRole}
      />
    </div>
  );
};

export default ProjectDashboard;
