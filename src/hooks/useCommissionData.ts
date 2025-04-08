import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjectFinancials } from "./useProjectFinancials";

interface CommissionSettings {
  office_overhead_percentage: number;
  pm_profit_split_percentage: number;
}

export function useCommissionData(projectId: string) {
  const queryClient = useQueryClient();
  const {
    totalPaidInvoices,
    totalExpenses
  } = useProjectFinancials(projectId);

  // Fetch project data with milestones to calculate total contract value
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project-commission', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          milestones (id, amount)
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project for commission:', error);
        throw error;
      }

      return data;
    },
  });

  // Fetch commission settings from the database
  const { data: commissionData, isLoading: isCommissionLoading } = useQuery({
    queryKey: ['commission-settings', projectId],
    queryFn: async () => {
      // Try to get existing commission settings
      const { data, error } = await supabase
        .from('project_commission_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found, create default settings
          const { data: newData, error: insertError } = await supabase
            .from('project_commission_settings')
            .insert({
              project_id: projectId,
              office_overhead_percentage: 20, // Default value
              pm_profit_split_percentage: 10, // Default value
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating default commission settings:', insertError);
            throw insertError;
          }

          return newData;
        }
        
        console.error('Error fetching commission settings:', error);
        throw error;
      }

      return data;
    },
  });

  // Mutation to update commission settings
  const { mutateAsync: updateCommissionSettings } = useMutation({
    mutationFn: async (settings: CommissionSettings) => {
      const { error } = await supabase
        .from('project_commission_settings')
        .update({
          office_overhead_percentage: settings.office_overhead_percentage,
          pm_profit_split_percentage: settings.pm_profit_split_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error updating commission settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the commission settings query
      queryClient.invalidateQueries({ queryKey: ['commission-settings', projectId] });
    },
  });

  // Calculate total contract value as the sum of all milestone amounts
  const calculateTotalContractValue = () => {
    if (!project || !project.milestones || !Array.isArray(project.milestones)) {
      return 0;
    }
    
    // Sum up all milestone amounts
    const totalMilestoneAmount = project.milestones.reduce((sum, milestone) => {
      return sum + (milestone.amount || 0);
    }, 0);
    
    return totalMilestoneAmount || 0;
  };

  return {
    commissionData,
    isLoading: isCommissionLoading || isProjectLoading,
    updateCommissionSettings,
    totalContractValue: calculateTotalContractValue(),
    totalCollected: totalPaidInvoices,
    totalExpensesPaid: totalExpenses
  };
}
