import { Milestone } from "@/types/project-types";

export const calculateProjectCompletion = (milestones: Milestone[]) => {
  if (!milestones || milestones.length === 0) return 0;
  
  const totalAmount = milestones.reduce((sum, milestone) => 
    sum + (milestone.amount || 0), 0);
  
  const completedAmount = milestones
    .filter(milestone => milestone.status === 'completed')
    .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

  return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
};