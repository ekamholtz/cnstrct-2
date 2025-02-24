
export interface Milestone {
  id: string;
  name: string;
  amount: number | null;
  status: 'pending' | 'completed' | null;
  description?: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientProject {
  id: string;
  name: string;
  address: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  contractor_id: string;
  pm_user_id?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
}
