
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { ContractorFinancialSummary } from "@/components/dashboard/ContractorFinancialSummary";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import { useContractorProjects } from "@/hooks/useContractorProjects";
import { MainNav } from "@/components/navigation/MainNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMembersSection } from "@/components/dashboard/TeamMembersSection";
import { TeamMembersDebug } from "@/debug/TeamMembersDebug";
import { TargetGCAccountDebug } from "@/debug/TargetGCAccountDebug";
import { AllProfilesDebug } from "@/debug/AllProfilesDebug";
import { ProjectRelationshipsDebug } from "@/debug/ProjectRelationshipsDebug";
import { RoutingDebug } from "@/debug/RoutingDebug";

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

  // Determine if user is a GC or PM
  const isGcOrPm = userProfile?.role === 'gc_admin' || 
                  userProfile?.role === 'project_manager' || 
                  userProfile?.role === 'platform_admin';
  
  // Check if user has a GC account
  const hasGcAccount = !!userProfile?.gc_account_id;

  return (
    <div className="flex min-h-screen flex-col bg-cnstrct-gray">
      <MainNav />
      <div className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Dashboard Header */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                {isGcOrPm && userProfile ? (
                  <>
                    {userProfile.full_name && (
                      <p className="text-base font-medium text-gray-600">Welcome, {userProfile.full_name}</p>
                    )}
                    {userProfile.company_name && (
                      <h1 className="text-2xl md:text-3xl font-bold text-cnstrct-navy">{userProfile.company_name}</h1>
                    )}
                    {!hasGcAccount && (
                      <Alert variant="destructive" className="mt-4 bg-amber-50 border border-amber-200 text-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <AlertTitle className="text-amber-800 font-medium">Company Setup Needed</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          Please complete your company profile to fully use all features.
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-gray-600 mt-1">Manage and track all your construction projects</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-3xl font-bold text-cnstrct-navy">General Contractor Dashboard</h1>
                    <div className="flex items-center text-gray-600">
                      <span>Manage and track all your construction projects</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <DashboardHeader onProjectCreated={refetch} />
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-800 font-medium">Error</AlertTitle>
              <AlertDescription className="text-red-700">
                There was an error loading your projects. Please try refreshing the page.
                {error instanceof Error ? ` Error: ${error.message}` : ''}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Overview */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-cnstrct-navy mb-6 flex items-center">
              <span className="inline-block w-1 h-6 bg-cnstrct-orange mr-3 rounded-full"></span>
              Project Overview
            </h2>
            <StatsOverview projects={projects} />
          </div>

          {/* Financial Summary */}
          <ContractorFinancialSummary />

          {/* Projects List */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-cnstrct-navy mb-6 flex items-center">
              <span className="inline-block w-1 h-6 bg-cnstrct-orange mr-3 rounded-full"></span>
              Active Projects
            </h2>
            <ProjectsList projects={projects} loading={isLoading} />
          </div>
          
          {/* Team Members Section */}
          {isGcOrPm && <TeamMembersSection />}
          
          {/* Debug Components - Hidden in production */}
          {process.env.NODE_ENV === 'development' && isGcOrPm && hasGcAccount && (
            <div className="space-y-6 mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h2 className="text-lg font-semibold text-yellow-800">Debug Components (Only visible in development)</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
                <h3 className="text-md font-semibold text-yellow-700 mb-4">Team Members Debug</h3>
                <TeamMembersDebug />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
                <h3 className="text-md font-semibold text-yellow-700 mb-4">Target GC Account Debug</h3>
                <TargetGCAccountDebug />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
                <h3 className="text-md font-semibold text-yellow-700 mb-4">All Profiles Debug</h3>
                <AllProfilesDebug />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
                <h3 className="text-md font-semibold text-yellow-700 mb-4">Project Relationships Debug</h3>
                <ProjectRelationshipsDebug />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
                <h3 className="text-md font-semibold text-yellow-700 mb-4">Routing Debug</h3>
                <RoutingDebug />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
