
export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface MilestoneStatus {
  status: string;
  color: string;
  label: string;
}
