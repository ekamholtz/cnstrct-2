
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ContractorFinancialSummary } from "@/components/dashboard/ContractorFinancialSummary";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { MainNav } from "@/components/navigation/MainNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: projects = [], isLoading, error, refetch } = useContractorProjects();

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#172b70] text-white">
        <MainNav />
      </div>
      <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">General Contractor Dashboard</h1>
          <div className="flex items-center text-gray-600">
            <span>Manage and track all your construction projects</span>
          </div>
          <div className="mt-4">
            <DashboardHeader onProjectCreated={refetch} />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your projects. Please try refreshing the page.
              {error instanceof Error ? ` Error: ${error.message}` : ''}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#172b70] mb-6">Project Overview</h2>
          <StatsOverview projects={projects} />
        </div>

        {/* Financial Summary */}
        <ContractorFinancialSummary />

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#172b70] mb-6">Active Projects</h2>
          <ProjectsList projects={projects} loading={isLoading} />
        </div>
      </div>
    </div>
  );
}
