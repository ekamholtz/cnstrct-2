
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ContractorFinancialSummary } from "@/components/dashboard/ContractorFinancialSummary";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMembersSection } from "@/components/dashboard/TeamMembersSection";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Dashboard() {
  const { data: projects = [], isLoading, error, refetch } = useContractorProjects();
  
  // Get user profile information
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-dashboard-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name, role, gc_account_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check if user is the owner of the GC account
  const { data: isOwner = false } = useQuery({
    queryKey: ['is-dashboard-owner', userProfile?.gc_account_id],
    queryFn: async () => {
      if (!userProfile?.gc_account_id) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('gc_accounts')
        .select('owner_id')
        .eq('id', userProfile.gc_account_id)
        .single();

      if (error) return false;
      return data.owner_id === user.id;
    },
    enabled: !!userProfile?.gc_account_id,
  });

  const isGcOrPm = userProfile?.role === 'gc_admin' || userProfile?.role === 'project_manager';
  const hasGcAccount = !!userProfile?.gc_account_id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {isGcOrPm && userProfile ? (
                <>
                  {userProfile.full_name && (
                    <p className="text-lg font-medium text-slate-500">Welcome, {userProfile.full_name}</p>
                  )}
                  {userProfile.company_name && (
                    <h1 className="text-2xl font-bold text-slate-800 mt-1">{userProfile.company_name}</h1>
                  )}
                  {!hasGcAccount && (
                    <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-700">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertTitle>Company Setup Needed</AlertTitle>
                      <AlertDescription>
                        Please complete your company profile to fully use all features.
                      </AlertDescription>
                    </Alert>
                  )}
                  <p className="text-slate-500 mt-2">Manage and track all your construction projects</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">General Contractor Dashboard</h1>
                  <div className="flex items-center text-slate-500">
                    <span>Manage and track all your construction projects</span>
                  </div>
                </>
              )}
            </div>
            
            <div>
              <DashboardHeader onProjectCreated={refetch} />
            </div>
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

        {/* Project Overview Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Project Overview</h2>
          </div>
          <StatsOverview projects={projects} />
        </div>

        {/* Financial Summary */}
        <ContractorFinancialSummary />

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Active Projects</h2>
          </div>
          <ProjectsList projects={projects} loading={isLoading} />
        </div>
        
        {/* Team Members Section */}
        {isGcOrPm && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Team Members</h2>
            </div>
            <TeamMembersSection />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
