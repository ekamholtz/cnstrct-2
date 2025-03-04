
export interface Milestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
  description?: string;
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

// Add a simplified milestone type that matches what's returned in the client projects query
export interface SimplifiedMilestone {
  id: string;
  name: string;
  amount: number | null;
  status: MilestoneStatus | null;
}
