import { useQuery } from "@tanstack/react-query";
import { 
  fetchHistoricalProjects, 
  calculateProjectPnL, 
  getProjectsByPM, 
  getProjectsByType,
  getMonthlyFinancialData
} from "@/services/reportingService";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

export const useReporting = () => {
  const { currentUserProfile, isLoading: isLoadingProfile } = useCurrentUserProfile();
  
  console.log("useReporting - Current user profile:", currentUserProfile);
  
  // Fetch all historical projects with financial data
  const { 
    data: historicalProjects,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ['historical-projects', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      console.log("Fetching historical projects for GC account ID:", currentUserProfile?.gc_account_id);
      
      if (!currentUserProfile?.gc_account_id) {
        console.error("No GC account ID available");
        throw new Error('No GC account ID available');
      }
      
      try {
        const projects = await fetchHistoricalProjects(currentUserProfile.gc_account_id);
        console.log("Fetched projects:", projects?.length || 0);
        
        // Calculate PnL for each project
        const projectsWithPnL = projects.map((project: any) => ({
          ...project,
          ...calculateProjectPnL(project)
        }));
        
        console.log("Projects with PnL calculated:", projectsWithPnL?.length || 0);
        return projectsWithPnL;
      } catch (error) {
        console.error("Error fetching historical projects:", error);
        throw error;
      }
    },
    enabled: !!currentUserProfile?.gc_account_id && !isLoadingProfile
  });
  
  console.log("Historical projects loaded:", historicalProjects?.length || 0);
  
  // Get projects grouped by project manager
  const { 
    data: projectsByPM,
    isLoading: isLoadingPMData
  } = useQuery({
    queryKey: ['projects-by-pm', historicalProjects],
    queryFn: () => {
      console.log("Grouping projects by PM");
      const result = getProjectsByPM(historicalProjects || []);
      console.log("Projects grouped by PM:", result?.length || 0);
      return result;
    },
    enabled: !!historicalProjects
  });
  
  // Get projects grouped by type
  const { 
    data: projectsByType,
    isLoading: isLoadingTypeData
  } = useQuery({
    queryKey: ['projects-by-type', historicalProjects],
    queryFn: () => {
      console.log("Grouping projects by type");
      const result = getProjectsByType(historicalProjects || []);
      console.log("Projects grouped by type:", result?.length || 0);
      return result;
    },
    enabled: !!historicalProjects
  });
  
  // Get monthly financial data for trends
  const { 
    data: monthlyFinancialData,
    isLoading: isLoadingMonthlyData
  } = useQuery({
    queryKey: ['monthly-financial-data', historicalProjects],
    queryFn: () => {
      console.log("Calculating monthly financial data");
      const result = getMonthlyFinancialData(historicalProjects || []);
      console.log("Monthly financial data calculated:", result?.length || 0);
      return result;
    },
    enabled: !!historicalProjects
  });
  
  const isLoading = 
    isLoadingProfile || 
    isLoadingProjects || 
    isLoadingPMData || 
    isLoadingTypeData || 
    isLoadingMonthlyData;
  
  return {
    historicalProjects,
    projectsByPM,
    projectsByType,
    monthlyFinancialData,
    isLoading,
    error: projectsError,
    refetchProjects
  };
};
