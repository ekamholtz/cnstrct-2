
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ContractorFinancialSummary } from "@/components/dashboard/ContractorFinancialSummary";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useContractorProjects } from "@/hooks/useContractorProjects";

export default function Dashboard() {
  const { data: projects = [], isLoading, refetch } = useContractorProjects();

  console.log("Dashboard rendering with projects:", projects);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DashboardHeader onProjectCreated={refetch} />
        <StatsOverview projects={projects} />
        <ContractorFinancialSummary />
        <ProjectsList projects={projects} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
