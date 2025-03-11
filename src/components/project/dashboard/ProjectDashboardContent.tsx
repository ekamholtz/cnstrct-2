
import { ProjectHeader } from "./ProjectHeader";
import { ProjectFinancialMetrics } from "./ProjectFinancialMetrics";
import { TabbedContent } from "./TabbedContent";
import { GCTabbedContent } from "./GCTabbedContent";
import { ClientProject } from "@/types/project-types";
import { HorizontalMilestoneScroll } from "./HorizontalMilestoneScroll";

interface ProjectDashboardContentProps {
  project: ClientProject;
  homeownerExpenses: any[];
  gcExpenses: any[];
  invoices: any[];
  projectId: string;
  userRole: string | null;
}

export function ProjectDashboardContent({
  project,
  homeownerExpenses,
  gcExpenses,
  invoices,
  projectId,
  userRole
}: ProjectDashboardContentProps) {
  return (
    <div className="container mx-auto px-4 py-8 mt-16"> {/* Added mt-16 for proper spacing below the fixed header */}
      <ProjectHeader project={project} />
      
      {/* Add Financial Metrics Section */}
      <div className="mt-8">
        <ProjectFinancialMetrics projectId={projectId} />
      </div>

      {/* Project Milestones Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[#172b70] mb-4">Project Milestones</h2>
        {project.milestones && project.milestones.length > 0 ? (
          <HorizontalMilestoneScroll milestones={project.milestones} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            No milestones found for this project.
          </div>
        )}
      </div>

      {/* Content tabs */}
      <div className="mt-8">
        {userRole === 'homeowner' ? (
          <TabbedContent 
            projectId={projectId}
            isHomeowner={true}
          />
        ) : (
          <GCTabbedContent 
            projectId={projectId}
            expenses={gcExpenses}
            invoices={invoices}
          />
        )}
      </div>
    </div>
  );
}
