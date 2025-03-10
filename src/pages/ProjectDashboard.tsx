import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainNav } from "@/components/navigation/MainNav";
import { ProjectNotFound } from "@/components/project/dashboard/ProjectNotFound";
import { LoadingSpinner } from "@/components/project/dashboard/LoadingSpinner";
import { ProjectDashboardContent } from "@/components/project/dashboard/ProjectDashboardContent";
import { useProjectDashboard } from "@/hooks/useProjectDashboard";
import { ClientProject } from "@/types/project-types";

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
    invoices 
  } = useProjectDashboard(projectId);

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAdmin = (userRole as string) === 'platform_admin' || hasAdminRights;

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
          Project not found or you don't have permission to view it.
        </div>
      </div>
    );
  }

  const clientProject: ClientProject = project ? {
    ...project,
    address: project.address || '', // Ensure address is not undefined
    status: (project.status as 'draft' | 'active' | 'completed' | 'cancelled') || 'draft',
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    // Explicitly add expenses for PnL calculations
    expenses: gcExpenses
  } : {
    id: '',
    name: '',
    address: '',
    status: 'draft',
    gc_account_id: '',
    created_at: '',
    updated_at: '',
    milestones: [],
    expenses: []
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <ProjectDashboardContent
        project={clientProject}
        homeownerExpenses={homeownerExpenses}
        gcExpenses={gcExpenses}
        invoices={invoices || []}
        projectId={projectId || ''}
        userRole={userRole}
      />
    </div>
  );
};

export default ProjectDashboard;
