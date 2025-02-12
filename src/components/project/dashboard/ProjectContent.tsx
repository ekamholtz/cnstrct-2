
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectStatus } from "@/components/project/ProjectStatus";
import { MilestonesList } from "@/components/project/MilestonesList";
import { ProjectFinancialSummary } from "@/components/project/ProjectFinancialSummary";
import { ProjectInvoices } from "@/components/project/invoice/ProjectInvoices";
import { ProjectExpenses } from "@/components/project/expense/ProjectExpenses";

interface ProjectContentProps {
  project: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
  dashboardRoute: string;
  isAdmin: boolean;
  isContractor: boolean;
  completionPercentage: number;
  milestones: any[];
  onMarkComplete: (id: string) => void;
}

export function ProjectContent({
  project,
  dashboardRoute,
  isAdmin,
  isContractor,
  completionPercentage,
  milestones,
  onMarkComplete,
}: ProjectContentProps) {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="mb-8">
        <Link to={dashboardRoute}>
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <ClientPageHeader 
        pageTitle={`Project: ${project.name}`}
        pageDescription="View project details and track progress"
      />
      <ProjectHeader 
        name={project.name} 
        address={project.address} 
        projectId={project.id}
      />
      {!isAdmin && (
        <ProjectFinancialSummary projectId={project.id} />
      )}
      <div className="mb-8">
        <ProjectStatus status={project.status} completionPercentage={completionPercentage} />
      </div>
      <div className="space-y-8">
        <MilestonesList 
          milestones={milestones} 
          onMarkComplete={onMarkComplete}
          hideControls={isAdmin}
        />
      </div>
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ProjectInvoices projectId={project.id} />
          {isContractor && <ProjectExpenses projectId={project.id} />}
        </div>
      )}
    </div>
  );
}
