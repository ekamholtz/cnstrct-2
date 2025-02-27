
import { ProjectHeader } from "./ProjectHeader";
import { ProjectFinancialMetrics } from "./ProjectFinancialMetrics";
import { TabbedContent } from "./TabbedContent";
import { GCTabbedContent } from "./GCTabbedContent";
import { ClientProject } from "@/types/project-types";

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

      {/* Content tabs */}
      <div className="mt-8">
        {userRole === 'homeowner' ? (
          <TabbedContent 
            project={project}
            expenses={homeownerExpenses}
          />
        ) : (
          <GCTabbedContent 
            project={project}
            expenses={gcExpenses}
          />
        )}
      </div>
    </div>
  );
}
