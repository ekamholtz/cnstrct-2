
import { ProjectFormValues } from "@/components/projects/types";
import { MilestoneStatus } from "@/types/project-types";

export const useMilestonePreparation = () => {
  /**
   * Prepares milestone data for API submission
   */
  const prepareMilestoneData = (projectId: string, milestones: ProjectFormValues['milestones']) => {
    if (!milestones?.length) return [];
    
    // Prepare milestones data - ensuring the status is properly typed
    return milestones.map((milestone) => ({
      name: milestone.name,
      amount: parseFloat(milestone.amount),
      description: milestone.description,
      project_id: projectId,
      status: 'pending' as MilestoneStatus
    }));
  };

  return { prepareMilestoneData };
};
