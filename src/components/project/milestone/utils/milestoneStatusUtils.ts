
import { supabase } from "@/integrations/supabase/client";
import { Milestone } from "@/types/project-types";

/**
 * Updates a milestone's status to completed
 */
export const updateMilestoneStatus = async (milestoneId: string, status: 'pending' | 'completed') => {
  console.log(`Updating milestone ${milestoneId} status to ${status}`);
  
  const { data, error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) {
    console.error("Error updating milestone status:", error);
    throw error;
  }
  
  console.log('Updated milestone status successfully');
  return data;
};

/**
 * Fetches milestone details with its associated project
 */
export const fetchMilestoneWithProject = async (milestoneId: string): Promise<Milestone & { project: any }> => {
  console.log("Fetching milestone details for:", milestoneId);

  // Use explicit table aliases and qualify column references
  const { data, error } = await supabase
    .from('milestones')
    .select(`
      *,
      project:project_id (*)
    `)
    .eq('id', milestoneId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching milestone details:", error);
    throw error;
  }
  
  if (!data) {
    console.error("Milestone not found");
    throw new Error('Milestone not found');
  }
  
  console.log('Fetched milestone details:', data);
  return data as Milestone & { project: any };
};
