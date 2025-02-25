
import { Milestone } from "@/types/project-types";

export const calculateProjectCompletion = (milestones: Milestone[]) => {
  if (!milestones || milestones.length === 0) return 0;
  
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(milestone => 
    milestone.status === 'completed'
  ).length;

  return Math.round((completedMilestones / totalMilestones) * 100);
};
