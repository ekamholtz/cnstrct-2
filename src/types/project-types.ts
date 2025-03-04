
export interface Milestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
  description?: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = 'pending' | 'completed';

export interface ClientProject {
  id: string;
  name: string;
  address: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  contractor_id: string;
  gc_account_id?: string;
  pm_user_id?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
  milestones?: SimplifiedMilestone[];
}

// Simplified milestone type with required properties for display in lists
export interface SimplifiedMilestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}
