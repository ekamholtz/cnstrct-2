
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
  projectId: string;
  userRole: string | null;
}

export function ProjectDashboardContent({
  project,
  homeownerExpenses,
  gcExpenses,
  projectId,
  userRole
}: ProjectDashboardContentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectHeader project={project} />
      
      {/* Add Financial Metrics Section */}
      <div className="mt-8">
        <ProjectFinancialMetrics projectId={projectId} />
      </div>

      {/* Project Milestones Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-blue-500 mr-3 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-800">Project Milestones</h2>
          </div>
          
          {project.milestones && project.milestones.length > 0 ? (
            <HorizontalMilestoneScroll milestones={project.milestones} />
          ) : (
            <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
              No milestones found for this project.
            </div>
          )}
        </div>
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
          />
        )}
      </div>
    </div>
  );
}
