
export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  contractor_id: string;
  pm_user_id?: string;
  client_id?: string;
}
