
import { ProjectHeader } from "./ProjectHeader";
import { ProjectMetrics } from "./ProjectMetrics";
import { ProjectMilestones } from "./ProjectMilestones";
import { TabbedContent } from "./TabbedContent";
import { GCTabbedContent } from "./GCTabbedContent";
import { calculateProjectCompletion } from "@/utils/project-calculations";

interface ProjectDashboardContentProps {
  project: any;
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
  const isAdmin = userRole === 'platform_admin';
  const isHomeowner = userRole === 'homeowner';
  const isGC = userRole === 'gc_admin';

  // Calculate metrics
  const gcBudget = project.milestones?.reduce((sum: number, m: any) => sum + (m.amount || 0), 0) || 0;
  const otherExpenses = homeownerExpenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
  const totalBudget = gcBudget + otherExpenses;
  const paidToGC = project.invoices
    ?.filter((i: any) => i.status === 'paid')
    .reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0;
  const otherPayments = homeownerExpenses
    ?.filter((e: any) => e.payment_status === 'paid')
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
  const totalPaid = paidToGC + otherPayments;
  const progressPercentage = calculateProjectCompletion(project.milestones || []);
  const amountProgress = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <ProjectHeader project={project} />
      <ProjectMetrics 
        project={project}
        gcBudget={gcBudget}
        otherExpenses={otherExpenses}
        paidToGC={paidToGC}
        otherPayments={otherPayments}
        totalBudget={totalBudget}
        totalPaid={totalPaid}
        progressPercentage={progressPercentage}
        amountProgress={amountProgress}
      />
      <ProjectMilestones milestones={project.milestones || []} />
      <div className="bg-white rounded-lg shadow-sm mt-8">
        {isHomeowner ? (
          <TabbedContent projectId={projectId} isHomeowner={isHomeowner} />
        ) : isGC || isAdmin ? (
          <GCTabbedContent projectId={projectId} expenses={gcExpenses} />
        ) : null}
      </div>
    </div>
  );
}
