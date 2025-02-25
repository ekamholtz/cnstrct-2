
interface Project {
  milestones?: Array<{ amount?: number }>;
  invoices?: Array<{ amount?: number; status?: string }>;
}

export function calculateClientMetrics(projects: Project[] = []) {
  const totalBudget = projects.reduce((sum, project) => 
    sum + (project.milestones?.reduce((mSum, m) => mSum + (m.amount || 0), 0) || 0), 0);

  const totalPaid = projects.reduce((sum, project) => 
    sum + (project.invoices?.reduce((iSum, inv) => 
      inv.status === 'paid' ? iSum + (inv.amount || 0) : iSum, 0) || 0), 0);

  const totalPending = totalBudget - totalPaid;
  const progressPercentage = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  return {
    totalBudget,
    totalPaid,
    totalPending,
    progressPercentage
  };
}
