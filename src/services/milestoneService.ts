
import { supabase } from "@/integrations/supabase/client";
import { MilestoneStatus } from "@/types/project-types";

/**
 * Creates milestones for a project
 */
export const createMilestones = async (milestonesData: {
  name: string;
  amount: number;
  description: string;
  project_id: string;
  status: MilestoneStatus;
}[]) => {
  try {
    // Important: We need to avoid using RPC function for PMs due to permissions
    // So we'll use direct inserts with explicit fields
    const insertData = milestonesData.map(milestone => ({
      name: milestone.name,
      amount: milestone.amount,
      description: milestone.description,
      project_id: milestone.project_id,
      status: milestone.status
    }));
    
    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(insertData);
      
    if (milestonesError) {
      console.error('Error inserting milestones:', milestonesError);
      throw milestonesError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating milestones:', error);
    throw error;
  }
};
